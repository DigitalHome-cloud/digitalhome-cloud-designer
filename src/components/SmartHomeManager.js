import React, { useState, useEffect, useCallback } from "react";
import { navigate } from "gatsby";
import { useTranslation } from "gatsby-plugin-react-i18next";
import { useAuth } from "../context/AuthContext";
import { useSmartHome } from "../context/SmartHomeContext";
import { useTier } from "../utils/useTier";
import { UpgradePrompt } from "./UpgradePrompt";
import SmartHomeForm from "./SmartHomeForm";
import { generateClient } from "aws-amplify/api";
import { listSmartHomes, getSmartHome } from "../graphql/queries";
import {
  createSmartHome,
  updateSmartHome,
  deleteSmartHome,
} from "../graphql/mutations";
import { generateShellWorkspace } from "../utils/shellGenerator";
import { saveDesignToS3, fetchDesignFromS3 } from "../utils/s3";

const SmartHomeManager = () => {
  const { t } = useTranslation();
  const auth = useAuth();
  const { authState, isAuthenticated } = auth;
  const { demoHomes, activeHome, setActiveHome } = useSmartHome();
  const { tier, can } = useTier(auth);
  const createResult = can("create.new_home");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchSmartHomes = useCallback(async () => {
    if (!isAuthenticated || typeof window === "undefined") return;
    setLoading(true);
    setError(null);
    try {
      const client = generateClient();
      const result = await client.graphql({ query: listSmartHomes });
      setItems(result.data.listSmartHomes.items || []);
    } catch (err) {
      console.error("[Manager] Failed to fetch SmartHomes:", err);
      setError("Failed to load SmartHomes.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSmartHomes();
  }, [fetchSmartHomes]);

  const handleSave = async (data) => {
    if (typeof window === "undefined") return;
    const client = generateClient();

    if (editingItem) {
      await client.graphql({
        query: updateSmartHome,
        variables: {
          input: {
            id: editingItem.id,
            address: data.address,
            description: data.description,
            ownerName: data.ownerName,
          },
        },
      });
    } else {
      await client.graphql({
        query: createSmartHome,
        variables: {
          input: {
            id: data.id,
            country: data.country,
            zip: data.zip,
            streetCode: data.streetCode,
            houseNumber: data.houseNumber,
            suffix: data.suffix,
            address: data.address,
            description: data.description,
            ownerName: data.ownerName,
          },
        },
      });

      // Generate electrical shell for new SmartHome
      try {
        const shellWorkspace = generateShellWorkspace(data.id, data.country);
        await saveDesignToS3(data.id, {
          workspaceJson: shellWorkspace,
          aboxTtl: "",
          aboxJson: { nodes: [], links: [] },
        });
        console.log("[Manager] Electrical shell generated for", data.id);
        navigate(`/design/?home=${encodeURIComponent(data.id)}`);
        return;
      } catch (shellErr) {
        console.warn("[Manager] Failed to generate electrical shell:", shellErr.message);
      }
    }

    setShowForm(false);
    setEditingItem(null);
    fetchSmartHomes();
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete SmartHome ${item.id}?`)) return;
    const client = generateClient();
    await client.graphql({
      query: deleteSmartHome,
      variables: { input: { id: item.id } },
    });
    fetchSmartHomes();
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleGenerateShell = async (item) => {
    // Check if a design already exists
    const existing = await fetchDesignFromS3(item.id);
    if (existing) {
      if (!window.confirm(`SmartHome ${item.id} already has a design. Overwrite with a new electrical shell?`)) {
        return;
      }
    }

    try {
      const country = item.country || item.id.split("-")[0] || "";
      const shellWorkspace = generateShellWorkspace(item.id, country);
      await saveDesignToS3(item.id, {
        workspaceJson: shellWorkspace,
        aboxTtl: "",
        aboxJson: { nodes: [], links: [] },
      });
      navigate(`/design/?home=${encodeURIComponent(item.id)}`);
    } catch (err) {
      console.error("[Manager] Shell generation failed:", err);
      window.alert(`Failed to generate shell: ${err.message}`);
    }
  };

  const isAuth = authState === "authenticated";

  const renderIdCell = (id) => {
    const isActive = activeHome.id === id;
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
          {createResult.allowed ? (
            <button
              type="button"
              className="dhc-button-primary"
              onClick={handleCreate}
            >
              + Create SmartHome
            </button>
          ) : tier !== "guest" ? (
            <UpgradePrompt
              required={createResult.requiredTier}
              current={tier}
              compact
            />
          ) : null}
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
              <th>ID</th>
              <th>Address</th>
              <th>Owner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {demoHomes.map((h) => (
              <tr key={h.id}>
                <td>{renderIdCell(h.id)}</td>
                <td>{h.name}</td>
                <td>{t("role.guest")}</td>
                <td>
                  <span className="dhc-nav-pill">{t("role.guest")}</span>
                </td>
              </tr>
            ))}
            {items.map((item) => (
              <tr key={item.id}>
                <td>{renderIdCell(item.id)}</td>
                <td>{item.address || "—"}</td>
                <td>{item.ownerName || "—"}</td>
                <td>
                  <button
                    type="button"
                    className="dhc-button-ghost"
                    onClick={() => handleEdit(item)}
                    style={{ marginRight: "0.4rem" }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="dhc-button-ghost"
                    onClick={() => handleGenerateShell(item)}
                    style={{ marginRight: "0.4rem" }}
                    title="Generate electrical delivery chain skeleton"
                  >
                    Shell
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
            ))}
          </tbody>
        </table>
      )}

      {tier === "guest" && (
        <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "1rem" }}>
          Sign in to create and manage your own SmartHomes.
        </p>
      )}
    </div>
  );
};

export default SmartHomeManager;
