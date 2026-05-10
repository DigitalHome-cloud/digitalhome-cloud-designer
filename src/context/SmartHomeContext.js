import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

/**
 * SmartHomeContext / SmartHomeProvider
 *
 * Manages the active DigitalHome selection. When authenticated, the user's
 * homes are fetched via listDigitalHomes and exposed as `userHomes`.
 *
 * Persists the active selection to localStorage and supports an initial
 * selection via the `?home=<smartHomeId>` URL query parameter (passed from
 * the Portal's tile links).
 *
 * Note: the file is named SmartHomeContext.js for backward compat with the
 * many consumers that import { useSmartHome } — the underlying data model
 * is dhc:DigitalHome (per ADR / DH-SPEC). Renaming the file is a follow-up.
 */

const STORAGE_KEY = "dhc-active-home";

// Always-false stub — kept exported because utils/s3.js still imports it.
// Demos were removed in v2 (see context PR). Returning false collapses
// the demo branches in s3.js to dead code without forcing a touch there.
export const isDemoSmartHome = () => false;

const SmartHomeContext = createContext(null);

export const SmartHomeProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const isBrowser = typeof window !== "undefined";

  const [activeHomeId, setActiveHomeId] = useState(() => {
    if (!isBrowser) return null;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("home");
    if (fromUrl) {
      localStorage.setItem(STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    return localStorage.getItem(STORAGE_KEY);
  });

  const [userHomes, setUserHomes] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !isBrowser) return;

    let cancelled = false;

    async function fetchUserHomes() {
      try {
        const { generateClient } = await import("aws-amplify/api");
        const { listDigitalHomes } = await import("../graphql/queries");
        const client = generateClient();
        const result = await client.graphql({ query: listDigitalHomes });
        if (!cancelled) {
          const homes = (result.data.listDigitalHomes.items || []).map((h) => ({
            id: h.smartHomeId,
            name:
              [h.addressLine1, h.city].filter(Boolean).join(", ") ||
              h.smartHomeId,
            isDemo: !!h.isDemo,
          }));
          setUserHomes(homes);
        }
      } catch (err) {
        console.warn("[SmartHomeContext] Failed to fetch DigitalHomes:", err);
      }
    }

    fetchUserHomes();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isBrowser]);

  // Sentinel returned when no real home is selected. Keeps activeHome
  // non-null so consumers can read activeHome.id without crashing; pages
  // that gate on a real selection should check activeHome.id !== "".
  const NO_HOME = { id: "", name: "(no home selected)", isDemo: false };

  const activeHome =
    userHomes.find((h) => h.id === activeHomeId) ||
    (userHomes.length > 0 ? userHomes[0] : NO_HOME);

  const setActiveHome = useCallback(
    (id) => {
      setActiveHomeId(id);
      if (isBrowser) {
        if (id) localStorage.setItem(STORAGE_KEY, id);
        else localStorage.removeItem(STORAGE_KEY);
      }
    },
    [isBrowser],
  );

  // Auto-select when there's exactly one home (most users for a long time):
  // skip the "pick one" UX entirely. If more than one exists and nothing is
  // stored, leave activeHomeId null so the user explicitly picks.
  useEffect(() => {
    if (!activeHomeId && userHomes.length === 1) {
      setActiveHome(userHomes[0].id);
    }
  }, [userHomes, activeHomeId, setActiveHome]);

  // If the stored selection is no longer in the list, reset.
  useEffect(() => {
    if (
      activeHomeId &&
      userHomes.length > 0 &&
      !userHomes.find((h) => h.id === activeHomeId)
    ) {
      setActiveHome(userHomes[0].id);
    }
  }, [userHomes, activeHomeId, setActiveHome]);

  const value = {
    smartHomes: userHomes,
    demoHomes: [],
    userHomes,
    activeHome,
    activeHomeId,
    setActiveHome,
    isDemo: activeHome?.isDemo ?? false,
  };

  return (
    <SmartHomeContext.Provider value={value}>
      {children}
    </SmartHomeContext.Provider>
  );
};

export const useSmartHome = () => {
  const ctx = useContext(SmartHomeContext);
  if (!ctx) {
    throw new Error("useSmartHome must be used within a SmartHomeProvider");
  }
  return ctx;
};
