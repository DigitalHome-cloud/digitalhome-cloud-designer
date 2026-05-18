import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { generateClient } from "aws-amplify/api";
import { listDeviceModels } from "../graphql/queries";
import {
  createDeviceModel,
  updateDeviceModel,
  deleteDeviceModel,
} from "../graphql/mutations";
import { DEVICE_CATEGORIES, CATEGORY_LABEL } from "../constants/deviceTypes";
import DeviceModelForm from "./DeviceModelForm";

/**
 * Device-product catalogue (DeviceModel). Browse/search/filter by the
 * app-level device taxonomy; dhc-admins can add / modify / remove models
 * via the shared DeviceModelForm. Read flow is open to any signed-in user.
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

  const handleSave = async ({ _isEdit, ...input }) => {
    const client = generateClient();
    if (_isEdit) {
      await client.graphql({
        query: updateDeviceModel,
        variables: { input },
      });
    } else {
      await client.graphql({
        query: createDeviceModel,
        variables: { input },
      });
    }
    setShowForm(false);
    setEditing(null);
    await fetchModels();
  };

  const handleDelete = async (it) => {
    if (!window.confirm(`Remove catalogue model ${it.modelNumber}?`)) return;
    try {
      const client = generateClient();
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

      {showForm && isAdmin && (
        <div style={{ marginBottom: "1.5rem" }}>
          <DeviceModelForm
            item={editing}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
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
              <th>Model</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Type</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 5 : 4}
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
                  <td style={{ fontFamily: "monospace" }}>{it.modelNumber}</td>
                  <td>{it.brand}</td>
                  <td>
                    <span className="dhc-nav-pill">
                      {CATEGORY_LABEL[it.category] || it.category || "—"}
                    </span>
                  </td>
                  <td>{it.deviceType}</td>
                  {isAdmin && (
                    <td>
                      <button
                        type="button"
                        className="dhc-button-ghost"
                        onClick={() => {
                          setEditing(it);
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
                  )}
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
