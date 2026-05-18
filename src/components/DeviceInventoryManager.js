import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSmartHome } from "../context/SmartHomeContext";
import DeviceInstanceForm from "./DeviceInstanceForm";
import { generateClient } from "aws-amplify/api";
import {
  listDeviceInstanceBySmartHomeId,
  listDeviceModels,
} from "../graphql/queries";
import {
  createDeviceInstance,
  updateDeviceInstance,
  deleteDeviceInstance,
} from "../graphql/mutations";

// DeviceLifecycle enum → display label.
const LIFECYCLE_LABEL = {
  NEW: "New",
  ACTIVE: "Active",
  END_OF_LIFE: "End of life",
  DECOMMISSIONED: "Decommissioned",
};

/**
 * Per-SmartHome device inventory. Mirrors SmartHomeManager: list + form
 * toggle + GraphQL CRUD. Scoped to the active home via the smartHomeId
 * secondary index. Writes require the caller to be a home owner (the new
 * row is created with owners=[caller]) or dhc-admins.
 */
const ownerIdOf = (user) =>
  user?.idTokenPayload?.sub ||
  user?.userId ||
  user?.username ||
  null;

const DeviceInventoryManager = () => {
  const { isAuthenticated, user, hasGroup } = useAuth();
  const { activeHome } = useSmartHome();
  const homeId = activeHome?.id || "";
  const isAdmin = hasGroup("dhc-admins");

  const [items, setItems] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchInstances = useCallback(async () => {
    if (!isAuthenticated || !homeId || typeof window === "undefined") return;
    setLoading(true);
    setError(null);
    try {
      const client = generateClient();
      const [instRes, modelRes] = await Promise.all([
        client.graphql({
          query: listDeviceInstanceBySmartHomeId,
          variables: { smartHomeId: homeId },
        }),
        client.graphql({ query: listDeviceModels }),
      ]);
      setItems(instRes.data.listDeviceInstanceBySmartHomeId.items || []);
      setModels(modelRes.data.listDeviceModels.items || []);
    } catch (err) {
      console.error("[DeviceInventory] fetch failed:", err);
      setError("Failed to load devices for this SmartHome.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, homeId]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const handleSave = async (args) => {
    if (typeof window === "undefined") return;
    const client = generateClient();
    if (args.id) {
      const { id, ...rest } = args;
      await client.graphql({
        query: updateDeviceInstance,
        variables: { input: { id, ...rest } },
      });
    } else {
      const ownerId = ownerIdOf(user);
      await client.graphql({
        query: createDeviceInstance,
        variables: {
          input: {
            smartHomeId: homeId,
            owners: ownerId ? [ownerId] : [],
            ...args,
          },
        },
      });
    }
    setShowForm(false);
    setEditingItem(null);
    await fetchInstances();
  };

  const handleDelete = async (it) => {
    if (!window.confirm(`Remove device ${it.serialNumber} from ${homeId}?`)) {
      return;
    }
    try {
      const client = generateClient();
      await client.graphql({
        query: deleteDeviceInstance,
        variables: { input: { id: it.id } },
      });
      fetchInstances();
    } catch (err) {
      setError(err?.errors?.[0]?.message || err?.message || String(err));
    }
  };

  if (!homeId) {
    return (
      <div className="dhc-manager-list">
        <p
          style={{
            textAlign: "center",
            padding: "1.5rem",
            color: "#9ca3af",
            fontSize: "0.9rem",
          }}
        >
          Select a SmartHome (Manager) to view and manage its device inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="dhc-manager-list">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <span className="dhc-nav-pill" title="Active SmartHome">
          {homeId}
        </span>
        {!showForm && (
          <button
            type="button"
            className="dhc-button-primary"
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            disabled={!isAuthenticated}
            title={
              !isAuthenticated ? "Sign in to add devices" : undefined
            }
          >
            + Add device
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: "#fca5a5", fontSize: "0.85rem" }}>{error}</p>
      )}

      {showForm && (
        <div style={{ marginBottom: "1.5rem" }}>
          <DeviceInstanceForm
            item={editingItem}
            models={models}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Loading…</p>
      ) : (
        <table className="dhc-manager-table">
          <thead>
            <tr>
              <th>Serial</th>
              <th>Model</th>
              <th>Type</th>
              <th>Lifecycle</th>
              <th>Installed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "1.5rem",
                    color: "#9ca3af",
                  }}
                >
                  No devices recorded for this SmartHome yet.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id}>
                  <td style={{ fontFamily: "monospace" }}>
                    {it.serialNumber}
                  </td>
                  <td>{it.modelNumber}</td>
                  <td>{it.deviceType}</td>
                  <td>
                    <span className="dhc-nav-pill">
                      {LIFECYCLE_LABEL[it.lifecycleState] ||
                        it.lifecycleState ||
                        "—"}
                    </span>
                  </td>
                  <td>{it.installationDate || "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="dhc-button-ghost"
                      onClick={() => {
                        setEditingItem(it);
                        setShowForm(true);
                      }}
                      style={{ marginRight: "0.4rem" }}
                    >
                      Modify
                    </button>
                    <button
                      type="button"
                      className="dhc-button-danger"
                      onClick={() => handleDelete(it)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DeviceInventoryManager;
