import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { generateClient } from "aws-amplify/api";
import { listDeviceModels, listDeviceInstances } from "../graphql/queries";
import {
  createDeviceModel,
  updateDeviceModel,
  deleteDeviceModel,
} from "../graphql/mutations";
import { DEVICE_CATEGORIES, CATEGORY_LABEL } from "../constants/deviceTypes";
import DeviceModelForm from "./DeviceModelForm";

const Thumb = ({ src }) =>
  src ? (
    <img
      src={src}
      alt=""
      style={{
        width: 36,
        height: 36,
        objectFit: "cover",
        borderRadius: "0.3rem",
        border: "1px solid rgba(148,163,184,0.3)",
        verticalAlign: "middle",
      }}
    />
  ) : (
    <span style={{ color: "#64748b", fontSize: "0.75rem" }}>—</span>
  );

/**
 * Device-product catalogue (DeviceModel). Any signed-in user can browse and
 * **View** a model (read-only); dhc-admins can add / modify / delete via the
 * shared DeviceModelForm. A model can only be deleted when no DeviceInstance
 * references its modelNumber.
 */
const DeviceCatalogue = () => {
  const { isAuthenticated, hasGroup } = useAuth();
  const isAdmin = hasGroup("dhc-admins");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formMode, setFormMode] = useState("edit"); // 'view' | 'edit'

  const fetchModels = useCallback(async () => {
    if (!isAuthenticated || typeof window === "undefined") return;
    setLoading(true);
    setError(null);
    try {
      const client = generateClient();
      const result = await client.graphql({ query: listDeviceModels });
      setItems(result.data.listDeviceModels.items || []);
    } catch (err) {
      console.error("[DeviceCatalogue] fetch failed:", err);
      setError("Failed to load the device catalogue.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const filtered = items.filter((it) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (it.brand || "").toLowerCase().includes(q) ||
      (it.modelNumber || "").toLowerCase().includes(q) ||
      (it.deviceType || "").toLowerCase().includes(q) ||
      (it.description || "").toLowerCase().includes(q);
    const matchesCat = !categoryFilter || it.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const open = (it, m) => {
    setEditing(it);
    setFormMode(m);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSave = async ({ _isEdit, ...input }) => {
    const client = generateClient();
    await client.graphql({
      query: _isEdit ? updateDeviceModel : createDeviceModel,
      variables: { input },
    });
    closeForm();
    await fetchModels();
  };

  const handleDelete = async (it) => {
    const client = generateClient();
    try {
      // Guard: refuse if any DeviceInstance references this model.
      const linked = await client.graphql({
        query: listDeviceInstances,
        variables: {
          filter: { modelNumber: { eq: it.modelNumber } },
          limit: 1,
        },
      });
      const inUse =
        (linked.data.listDeviceInstances.items || []).length > 0;
      if (inUse) {
        window.alert(
          `Cannot delete ${it.modelNumber}: at least one device instance is linked to this model. Remove those devices first.`
        );
        return;
      }
      if (!window.confirm(`Remove catalogue model ${it.modelNumber}?`)) return;
      await client.graphql({
        query: deleteDeviceModel,
        variables: { input: { modelNumber: it.modelNumber } },
      });
      fetchModels();
    } catch (err) {
      setError(err?.errors?.[0]?.message || err?.message || String(err));
    }
  };

  return (
    <div className="dhc-manager-list">
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          className="dhc-form-input"
          placeholder="Search brand / model / type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "20rem" }}
        />
        <select
          className="dhc-form-input"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ maxWidth: "16rem" }}
        >
          <option value="">All categories</option>
          {DEVICE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        {isAdmin && !showForm && (
          <button
            type="button"
            className="dhc-button-primary"
            onClick={() => {
              setEditing(null);
              setFormMode("edit");
              setShowForm(true);
            }}
          >
            + Add model
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: "#fca5a5", fontSize: "0.85rem" }}>{error}</p>
      )}

      {showForm && (
        <div style={{ marginBottom: "1.5rem" }}>
          <DeviceModelForm
            item={editing}
            mode={formMode}
            canEdit={isAdmin}
            onSave={handleSave}
            onCancel={closeForm}
          />
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Loading…</p>
      ) : (
        <table className="dhc-manager-table">
          <thead>
            <tr>
              <th>Img</th>
              <th>Model</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "1.5rem",
                    color: "#9ca3af",
                  }}
                >
                  {isAuthenticated
                    ? "No catalogue models match."
                    : "Sign in to browse the device catalogue."}
                </td>
              </tr>
            ) : (
              filtered.map((it) => (
                <tr key={it.modelNumber}>
                  <td>
                    <Thumb src={it.thumbnail} />
                  </td>
                  <td style={{ fontFamily: "monospace" }}>{it.modelNumber}</td>
                  <td>{it.brand}</td>
                  <td>
                    <span className="dhc-nav-pill">
                      {CATEGORY_LABEL[it.category] || it.category || "—"}
                    </span>
                  </td>
                  <td>{it.deviceType}</td>
                  <td>
                    <button
                      type="button"
                      className="dhc-button-ghost"
                      onClick={() => open(it, "view")}
                      style={{ marginRight: "0.4rem" }}
                    >
                      View
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          className="dhc-button-ghost"
                          onClick={() => open(it, "edit")}
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
                      </>
                    )}
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

export default DeviceCatalogue;
