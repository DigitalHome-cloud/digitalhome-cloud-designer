import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { generateClient } from "aws-amplify/api";
import { listDeviceModels } from "../graphql/queries";
import { createDeviceModel, deleteDeviceModel } from "../graphql/mutations";
import { DEVICE_CATEGORIES, CATEGORY_LABEL } from "../constants/deviceTypes";

/**
 * Device-product catalogue (DeviceModel). Browse/search/filter by the
 * app-level device taxonomy; dhc-admins can add/remove models. Mirrors the
 * SmartHomeManager fetch/CRUD shape + the CatalogueAttachment capability
 * badges. Read flow is open to any authenticated user.
 */
const EMPTY_FORM = {
  modelNumber: "",
  brand: "",
  category: DEVICE_CATEGORIES[0].id,
  deviceType: DEVICE_CATEGORIES[0].subTypes[0].label,
  description: "",
  version: "1.0.0",
};

const DeviceCatalogue = () => {
  const { isAuthenticated, hasGroup } = useAuth();
  const isAdmin = hasGroup("dhc-admins");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

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

  const subTypes = useMemo(() => {
    const cat = DEVICE_CATEGORIES.find((c) => c.id === form.category);
    return cat ? cat.subTypes : [];
  }, [form.category]);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.modelNumber.trim() || !form.brand.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const client = generateClient();
      await client.graphql({
        query: createDeviceModel,
        variables: {
          input: {
            modelNumber: form.modelNumber.trim(),
            brand: form.brand.trim(),
            category: form.category,
            deviceType: form.deviceType,
            description: form.description.trim() || null,
            version: form.version.trim() || "1.0.0",
          },
        },
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      await fetchModels();
    } catch (err) {
      setError(err?.errors?.[0]?.message || err?.message || String(err));
    } finally {
      setSaving(false);
    }
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

  const set = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: e.target.value,
      ...(k === "category"
        ? {
            deviceType:
              (DEVICE_CATEGORIES.find((c) => c.id === e.target.value) || {})
                .subTypes?.[0]?.label || "",
          }
        : {}),
    }));

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
            onClick={() => setShowForm(true)}
          >
            + Add model
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: "#fca5a5", fontSize: "0.85rem" }}>{error}</p>
      )}

      {showForm && isAdmin && (
        <form
          className="dhc-manager-form"
          onSubmit={handleCreate}
          style={{ marginBottom: "1.5rem" }}
        >
          <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>
            Add catalogue model
          </h3>
          <div className="dhc-form-field">
            <label className="dhc-form-label">Model number</label>
            <input
              className="dhc-form-input"
              value={form.modelNumber}
              onChange={set("modelNumber")}
              placeholder="ACME-NVR-8CH"
              required
            />
          </div>
          <div className="dhc-form-field">
            <label className="dhc-form-label">Brand</label>
            <input
              className="dhc-form-input"
              value={form.brand}
              onChange={set("brand")}
              placeholder="ACME"
              required
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.6rem",
            }}
          >
            <div className="dhc-form-field">
              <label className="dhc-form-label">Category</label>
              <select
                className="dhc-form-input"
                value={form.category}
                onChange={set("category")}
              >
                {DEVICE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="dhc-form-field">
              <label className="dhc-form-label">Device type</label>
              <select
                className="dhc-form-input"
                value={form.deviceType}
                onChange={set("deviceType")}
              >
                {subTypes.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="dhc-form-field">
            <label className="dhc-form-label">Description</label>
            <input
              className="dhc-form-input"
              value={form.description}
              onChange={set("description")}
            />
          </div>
          <div className="dhc-form-field">
            <label className="dhc-form-label">Version</label>
            <input
              className="dhc-form-input"
              value={form.version}
              onChange={set("version")}
            />
          </div>
          <div className="dhc-form-actions">
            <button
              type="submit"
              className="dhc-button-primary"
              disabled={saving}
            >
              {saving ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              className="dhc-button-ghost"
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
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
              <th>Version</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 6 : 5}
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
                  <td>{it.version}</td>
                  {isAdmin && (
                    <td>
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
