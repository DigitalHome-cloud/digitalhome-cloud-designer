import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSmartHome } from "../context/SmartHomeContext";
import { exportWorkspaceJson, loadDesignWorkspace, getWorkspace } from "../blockly/workspace";
import { serializeToTTL, serializeToJSON } from "../blockly/aboxSerializer";
import { fetchDesignFromS3, saveDesignToS3 } from "../utils/s3";

const STALE_LOCK_MINUTES = 30;

/**
 * Design lock state machine: view → edit → save/cancel
 *
 * States:
 *   "loading"   — fetching design from S3
 *   "view"      — read-only, can click "Edit Design"
 *   "edit"      — locked by current user, can edit
 *   "saving"    — save in progress
 *   "locked"    — locked by another user
 */
export function useDesignLock() {
  const { isAuthenticated, user } = useAuth();
  const { activeHome, isDemo } = useSmartHome();
  const [mode, setMode] = useState("loading");
  const [design, setDesign] = useState(null);
  const [lockedBy, setLockedBy] = useState(null);
  const [lockedAt, setLockedAt] = useState(null);
  const [error, setError] = useState(null);

  const currentUser =
    user?.idTokenPayload?.email || user?.username || "unknown";
  const smartHomeId = activeHome?.id;

  // Fetch design on mount / SmartHome change
  useEffect(() => {
    if (!smartHomeId) return;
    let cancelled = false;

    async function load() {
      setMode("loading");
      setError(null);
      try {
        const { generateClient } = await import("aws-amplify/api");
        const { listSmartHomeDesigns } = await import("../graphql/queries");
        const client = generateClient();

        // Find existing design record
        const result = await client.graphql({
          query: listSmartHomeDesigns,
          variables: {
            filter: { smartHomeId: { eq: smartHomeId } },
            limit: 1,
          },
        });

        const items = result.data.listSmartHomeDesigns.items || [];
        const existing = items[0] || null;

        if (!cancelled) {
          setDesign(existing);
          if (existing?.lockedBy && existing.lockedBy !== currentUser) {
            setLockedBy(existing.lockedBy);
            setLockedAt(existing.lockedAt);
            setMode("locked");
          } else {
            setLockedBy(null);
            setLockedAt(null);
            setMode("view");
          }
        }

        // Load workspace from S3
        const savedWorkspace = await fetchDesignFromS3(smartHomeId);
        if (!cancelled && savedWorkspace) {
          // Defer loading to next tick so workspace is ready
          setTimeout(() => {
            loadDesignWorkspace(savedWorkspace);
          }, 100);
        }
      } catch (err) {
        console.error("[Lock] Failed to load design:", err);
        if (!cancelled) {
          setError("Failed to load design.");
          setMode("view");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [smartHomeId, currentUser]);

  const lockDesign = useCallback(async () => {
    if (!isAuthenticated || isDemo) return;
    setError(null);

    try {
      const { generateClient } = await import("aws-amplify/api");
      const { createSmartHomeDesign, updateSmartHomeDesign } = await import(
        "../graphql/mutations"
      );
      const client = generateClient();
      const now = new Date().toISOString();

      if (design) {
        // Update existing
        await client.graphql({
          query: updateSmartHomeDesign,
          variables: {
            input: {
              id: design.id,
              lockedBy: currentUser,
              lockedAt: now,
              lastModified: now,
            },
          },
        });
        setDesign((d) => ({
          ...d,
          lockedBy: currentUser,
          lockedAt: now,
        }));
      } else {
        // Create new
        const result = await client.graphql({
          query: createSmartHomeDesign,
          variables: {
            input: {
              smartHomeId,
              version: 1,
              lastModified: now,
              lockedBy: currentUser,
              lockedAt: now,
              ontologyVersion: "1.0.0",
            },
          },
        });
        setDesign(result.data.createSmartHomeDesign);
      }

      setLockedBy(currentUser);
      setLockedAt(now);
      setMode("edit");
    } catch (err) {
      console.error("[Lock] Failed to lock:", err);
      setError("Failed to acquire edit lock.");
    }
  }, [isAuthenticated, isDemo, design, currentUser, smartHomeId]);

  const unlockDesign = useCallback(async () => {
    if (!design) return;

    try {
      const { generateClient } = await import("aws-amplify/api");
      const { updateSmartHomeDesign } = await import("../graphql/mutations");
      const client = generateClient();

      await client.graphql({
        query: updateSmartHomeDesign,
        variables: {
          input: {
            id: design.id,
            lockedBy: null,
            lockedAt: null,
            lastModified: new Date().toISOString(),
          },
        },
      });

      setLockedBy(null);
      setLockedAt(null);
      setMode("view");
    } catch (err) {
      console.error("[Lock] Failed to unlock:", err);
      setError("Failed to release lock.");
    }
  }, [design]);

  const saveDesign = useCallback(
    async (keepEditing = false) => {
      if (!design || !smartHomeId) return;
      setMode("saving");
      setError(null);

      try {
        const workspace = getWorkspace();
        const workspaceJson = exportWorkspaceJson();
        const aboxTtl = serializeToTTL(workspace, smartHomeId);
        const aboxJson = serializeToJSON(workspace, smartHomeId);

        await saveDesignToS3(smartHomeId, { workspaceJson, aboxTtl, aboxJson });

        // Update version in DynamoDB
        const { generateClient } = await import("aws-amplify/api");
        const { updateSmartHomeDesign } = await import("../graphql/mutations");
        const client = generateClient();
        const now = new Date().toISOString();

        await client.graphql({
          query: updateSmartHomeDesign,
          variables: {
            input: {
              id: design.id,
              version: (design.version || 0) + 1,
              lastModified: now,
              lockedBy: keepEditing ? currentUser : null,
              lockedAt: keepEditing ? now : null,
            },
          },
        });

        setDesign((d) => ({
          ...d,
          version: (d.version || 0) + 1,
          lastModified: now,
          lockedBy: keepEditing ? currentUser : null,
          lockedAt: keepEditing ? now : null,
        }));

        setMode(keepEditing ? "edit" : "view");
        if (!keepEditing) {
          setLockedBy(null);
          setLockedAt(null);
        }
      } catch (err) {
        console.error("[Lock] Failed to save:", err);
        setError("Failed to save design.");
        setMode("edit");
      }
    },
    [design, smartHomeId, currentUser]
  );

  const cancelEdit = useCallback(async () => {
    // Discard changes by reloading from S3
    const savedWorkspace = await fetchDesignFromS3(smartHomeId);
    if (savedWorkspace) {
      loadDesignWorkspace(savedWorkspace);
    } else {
      const workspace = getWorkspace();
      if (workspace) workspace.clear();
    }
    await unlockDesign();
  }, [smartHomeId, unlockDesign]);

  const isLockStale =
    lockedAt &&
    Date.now() - new Date(lockedAt).getTime() >
      STALE_LOCK_MINUTES * 60 * 1000;

  const forceUnlock = useCallback(async () => {
    await unlockDesign();
  }, [unlockDesign]);

  return {
    mode,
    design,
    lockedBy,
    lockedAt,
    isLockStale,
    error,
    canEdit: isAuthenticated && !isDemo,
    lockDesign,
    unlockDesign,
    saveDesign,
    cancelEdit,
    forceUnlock,
  };
}
