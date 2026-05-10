import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSmartHome } from "../context/SmartHomeContext";
import { useTier } from "../utils/useTier";
import { UpgradePrompt } from "./UpgradePrompt";
import SmartHomeForm from "./SmartHomeForm";
import { generateClient } from "aws-amplify/api";
import { listDigitalHomes } from "../graphql/queries";
import {
  initiateDigitalHome,
  updateDigitalHome,
  deleteDigitalHome,
} from "../graphql/mutations";

const SmartHomeManager = () => {
  const auth = useAuth();
  const { authState, isAuthenticated } = auth;
  const { activeHome, setActiveHome } = useSmartHome();
  const { tier, can } = useTier(auth);
  const createResult = can("create.new_home");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchHomes = useCallback(async () => {
    if (!isAuthenticated || typeof window === "undefined") return;
    setLoading(true);
    setError(null);
    try {
      const client = generateClient();
      const result = await client.graphql({ query: listDigitalHomes });
      setItems(result.data.listDigitalHomes.items || []);
    } catch (err) {
      console.error("[Manager] Failed to fetch DigitalHomes:", err);
      setError("Failed to load DigitalHomes.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchHomes();
  }, [fetchHomes]);

  const handleSave = async (args) => {
    if (typeof window === "undefined") return;
    const client = generateClient();

    if (editingItem) {
      // Modify flow — DDB-only update of the mutable subset.
      // Note: the abox.ttl + graph.jsonld in S3 are NOT regenerated here;
      // a follow-up Lambda will keep them in sync with DDB.
      await client.graphql({
        query: updateDigitalHome,
        variables: {
          input: {
            smartHomeId: args.smartHomeId,
            city: args.city,
            addressLine1: args.addressLine1,
            addressLine2: args.addressLine2,
          },
        },
      });
      setShowForm(false);
      setEditingItem(null);
      await fetchHomes();
      return;
    }

    const result = await client.graphql({
      query: initiateDigitalHome,
      variables: args,
    });
    const created = result.data.initiateDigitalHome;
    if (created?.smartHomeId) {
      setActiveHome(created.smartHomeId);
    }
    setShowForm(false);
    await fetchHomes();
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete DigitalHome ${item.smartHomeId}?\n\nThis removes the metadata row only — the S3 designtime files and Cognito group are not removed by this action.`)) {
      return;
    }
    const client = generateClient();
    await client.graphql({
      query: deleteDigitalHome,
      variables: { input: { smartHomeId: item.smartHomeId } },
    });
    fetchHomes();
  };

  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const renderIdCell = (id) => {
    const isActive = activeHome?.id === id;
    return (
      <button
        type="button"
        className={`dhc-home-pick${isActive ? " dhc-home-pick--active" : ""}`}
        onClick={() => setActiveHome(id)}
      >
        <span className="dhc-home-pick-check" aria-hidden="true">
          {isActive ? "✓" : ""}
        </span>
        <span className="dhc-home-pick-id">{id}</span>
      </button>
    );
  };

  const formatAddress = (item) => {
    const parts = [item.addressLine1, item.city, item.postalCode]
      .filter(Boolean)
      .join(", ");
    return parts || "—";
  };

  return (
    <div className="dhc-manager-list">
      {!showForm && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <button
            type="button"
            className="dhc-button-primary"
            onClick={handleCreate}
            disabled={!isAuthenticated || !createResult.allowed}
            title={
              !isAuthenticated
                ? "Sign in to create a DigitalHome"
                : !createResult.allowed
                ? "Your tier does not allow creating new homes"
                : undefined
            }
          >
            + Create DigitalHome
          </button>
          {isAuthenticated && !createResult.allowed && tier !== "guest" && (
            <UpgradePrompt
              required={createResult.requiredTier}
              current={tier}
              compact
            />
          )}
        </div>
      )}

      {error && (
        <p style={{ color: "#fca5a5", fontSize: "0.85rem" }}>{error}</p>
      )}

      {showForm && (
        <div style={{ marginBottom: "1.5rem" }}>
          <SmartHomeForm
            item={editingItem}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Loading...</p>
      ) : (
        <table className="dhc-manager-table">
          <thead>
            <tr>
              <th>SmartHome ID</th>
              <th>Address</th>
              <th>Country</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "1.5rem", color: "#9ca3af" }}>
                  {authState === "authenticated"
                    ? "No DigitalHomes yet. Click + Create DigitalHome to start."
                    : "Sign in to create and manage your DigitalHomes."}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.smartHomeId}>
                  <td>{renderIdCell(item.smartHomeId)}</td>
                  <td>{formatAddress(item)}</td>
                  <td>{item.country}</td>
                  <td>
                    <span className="dhc-nav-pill">
                      {item.isDemo ? "Demo" : "Real"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="dhc-button-ghost"
                      onClick={() => handleEdit(item)}
                      style={{ marginRight: "0.4rem" }}
                    >
                      Modify
                    </button>
                    <button
                      type="button"
                      className="dhc-button-danger"
                      onClick={() => handleDelete(item)}
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

export default SmartHomeManager;
