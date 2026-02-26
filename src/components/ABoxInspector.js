import React from "react";
import CatalogueAttachment from "./CatalogueAttachment";

const VIEW_COLOURS = {
  spatial: "#22c55e",
  building: "#f59e0b",
  electrical: "#3b82f6",
  plumbing: "#06b6d4",
  heating: "#ef4444",
  network: "#a855f7",
  governance: "#f97316",
  automation: "#ec4899",
  shared: "#e5e7eb",
};

const ABoxInspector = ({ selectedNode, onAttachCatalogue, onDetachCatalogue }) => {
  if (!selectedNode) {
    return (
      <div className="dhc-viewer-inspector">
        <div
          style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
          }}
        >
          Inspector
        </div>
        <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
          Click a node in the graph to view its details.
        </p>
      </div>
    );
  }

  const properties = selectedNode.properties || {};
  const viewColor = VIEW_COLOURS[selectedNode.designView] || VIEW_COLOURS.shared;

  return (
    <div className="dhc-viewer-inspector">
      <div
        style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          marginBottom: "0.75rem",
        }}
      >
        Inspector
      </div>

      {/* Instance label */}
      <div className="dhc-inspector-field">
        <div className="dhc-inspector-label">Label</div>
        <input
          className="dhc-inspector-input"
          type="text"
          value={selectedNode.label || ""}
          readOnly
        />
      </div>

      {/* Type */}
      <div className="dhc-inspector-field">
        <div className="dhc-inspector-label">Type</div>
        <input
          className="dhc-inspector-input"
          type="text"
          value={(selectedNode.type || "").replace("dhc:", "")}
          readOnly
        />
      </div>

      {/* Design View */}
      <div className="dhc-inspector-field">
        <div className="dhc-inspector-label">Design View</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: viewColor,
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: "0.8rem" }}>
            {selectedNode.designView || "shared"}
          </span>
        </div>
      </div>

      {/* Instance IRI */}
      <div className="dhc-inspector-field">
        <div className="dhc-inspector-label">IRI</div>
        <input
          className="dhc-inspector-input"
          type="text"
          value={selectedNode.id || ""}
          readOnly
          style={{ fontSize: "0.7rem" }}
        />
      </div>

      {/* Properties */}
      {Object.keys(properties).length > 0 && (
        <>
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              marginTop: "0.75rem",
              marginBottom: "0.4rem",
              color: "#e5e7eb",
            }}
          >
            Properties
          </div>
          {Object.entries(properties).map(([key, value]) => (
            <div key={key} className="dhc-inspector-field">
              <div className="dhc-inspector-label">
                {key.replace(/_/g, " ").toLowerCase()}
              </div>
              <input
                className="dhc-inspector-input"
                type="text"
                value={String(value ?? "")}
                readOnly
              />
            </div>
          ))}
        </>
      )}

      {/* Catalogue attachment (for equipment nodes) */}
      {selectedNode.type &&
        (selectedNode.type.includes("Equipment") ||
          selectedNode.type.includes("Socket") ||
          selectedNode.type.includes("Switch") ||
          selectedNode.type.includes("Light") ||
          selectedNode.type.includes("Heater")) && (
          <CatalogueAttachment
            node={selectedNode}
            onAttach={onAttachCatalogue}
            onDetach={onDetachCatalogue}
          />
        )}
    </div>
  );
};

export default ABoxInspector;
