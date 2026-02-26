import React, { useState, useEffect, useCallback } from "react";

const CatalogueAttachment = ({ node, onAttach, onDetach }) => {
  const [libraryItems, setLibraryItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLibraryItems = useCallback(async () => {
    if (typeof window === "undefined") return;
    setLoading(true);
    try {
      const { generateClient } = await import("aws-amplify/api");
      const { listLibraryItems } = await import("../graphql/queries");
      const client = generateClient();
      const result = await client.graphql({ query: listLibraryItems });
      setLibraryItems(result.data.listLibraryItems.items || []);
    } catch (err) {
      console.warn("[Catalogue] Failed to fetch library items:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibraryItems();
  }, [fetchLibraryItems]);

  // Filter items by compatible classes and search term
  const nodeType = node?.type?.replace("dhc:", "") || "";
  const filteredItems = libraryItems.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass =
      !nodeType ||
      (item.compatibleClasses || []).some(
        (cls) => cls.includes(nodeType) || nodeType.includes(cls.replace("dhc:", ""))
      );

    return matchesSearch && matchesClass;
  });

  return (
    <div style={{ marginTop: "0.75rem" }}>
      <div
        style={{
          fontSize: "0.8rem",
          fontWeight: 600,
          marginBottom: "0.4rem",
          color: "#e5e7eb",
        }}
      >
        Catalogue Items
      </div>

      <input
        type="text"
        className="dhc-form-input"
        placeholder="Search library..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: "0.5rem", fontSize: "0.8rem" }}
      />

      {loading ? (
        <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>Loading...</p>
      ) : filteredItems.length === 0 ? (
        <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
          No compatible items found.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {filteredItems.slice(0, 10).map((item) => (
            <li
              key={item.id}
              style={{
                fontSize: "0.8rem",
                padding: "0.3rem 0.4rem",
                borderRadius: "0.3rem",
                marginBottom: "0.2rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(148, 163, 184, 0.05)",
              }}
            >
              <div>
                <div style={{ color: "#e5e7eb" }}>{item.title}</div>
                <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>
                  {item.version}
                  {item.hasActorCapability && (
                    <span className="dhc-capability-badge dhc-capability-badge--actor">
                      A
                    </span>
                  )}
                  {item.hasSensorCapability && (
                    <span className="dhc-capability-badge dhc-capability-badge--sensor">
                      S
                    </span>
                  )}
                  {item.hasControllerCapability && (
                    <span className="dhc-capability-badge dhc-capability-badge--controller">
                      C
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="dhc-button-ghost"
                style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem" }}
                onClick={() => onAttach && onAttach(node, item)}
              >
                Attach
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CatalogueAttachment;
