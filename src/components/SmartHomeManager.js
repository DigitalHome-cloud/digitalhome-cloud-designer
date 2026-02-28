import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSmartHome } from "../context/SmartHomeContext";
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
  const { authState, isAuthenticated } = useAuth();
  const { demoHomes, setActiveHome } = useSmartHome();
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
      window.alert(`Electrical shell generated for ${item.id}.`);
    } catch (err) {
      console.error("[Manager] Shell generation failed:", err);
      window.alert(`Failed to generate shell: ${err.message}`);
    }
  };

  if (authState !== "authenticated") {
    return (
      <div className="dhc-manager-list">
        <h3 style={{ fontSize: "0.95rem", marginBottom: "1rem" }}>
          Demo SmartHomes
        </h3>
        <table className="dhc-manager-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {demoHomes.map((h) => (
              <tr key={h.id}>
                <td>{h.id}</td>
                <td>{h.name}</td>
                <td>
                  <span className="dhc-nav-pill">DEMO</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "1rem" }}>
          Sign in to create and manage your own SmartHomes.
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
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ fontSize: "0.95rem", margin: 0 }}>Your SmartHomes</h3>
        {!showForm && (
          <button
            type="button"
            className="dhc-button-primary"
            onClick={handleCreate}
          >
            + Create SmartHome
          </button>
        )}
      </div>

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
                <td>
                  <button
                    type="button"
                    className="dhc-nav-link"
                    style={{ padding: 0 }}
                    onClick={() => setActiveHome(h.id)}
                  >
                    {h.id}
                  </button>
                </td>
                <td>{h.name}</td>
                <td>—</td>
                <td>
                  <span className="dhc-nav-pill">DEMO</span>
                </td>
              </tr>
            ))}
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <button
                    type="button"
                    className="dhc-nav-link"
                    style={{ padding: 0 }}
                    onClick={() => setActiveHome(item.id)}
                  >
                    {item.id}
                  </button>
                </td>
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
    </div>
  );
};

export default SmartHomeManager;
