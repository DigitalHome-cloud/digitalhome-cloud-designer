import * as React from "react";
import { useTranslation } from "gatsby-plugin-react-i18next";

const CatalogPanel = ({
  selectedNode,
  catalogItems,
  onAssign,
  onUnassign,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState("");

  if (!selectedNode) {
    return (
      <div className="dhc-catalog">
        <div className="dhc-catalog-header">
          <span className="dhc-catalog-title">{t("builder.catalog.title")}</span>
        </div>
        <div className="dhc-catalog-empty">{t("builder.catalog.empty")}</div>
      </div>
    );
  }

  const properties = selectedNode.properties
    ? typeof selectedNode.properties === "string"
      ? JSON.parse(selectedNode.properties)
      : selectedNode.properties
    : {};

  const assignedItem = selectedNode.catalogItem || null;

  const filtered = (catalogItems || []).filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.brand && item.brand.toLowerCase().includes(term)) ||
      (item.model && item.model.toLowerCase().includes(term)) ||
      (item.category && item.category.toLowerCase().includes(term))
    );
  });

  return (
    <div className="dhc-catalog">
      <div className="dhc-catalog-header">
        <span className="dhc-catalog-title">{t("builder.catalog.title")}</span>
      </div>

      {/* Node properties */}
      <div className="dhc-node-props">
        <div className="dhc-node-props-field">
          <div className="dhc-node-props-label">Label</div>
          <div className="dhc-node-props-value">{selectedNode.label}</div>
        </div>
        <div className="dhc-node-props-field">
          <div className="dhc-node-props-label">Type</div>
          <div className="dhc-node-props-value">{selectedNode.nodeType}</div>
        </div>
        {selectedNode.designView && (
          <div className="dhc-node-props-field">
            <div className="dhc-node-props-label">Design View</div>
            <div className="dhc-node-props-value">{selectedNode.designView}</div>
          </div>
        )}
        {Object.keys(properties).length > 0 &&
          Object.entries(properties).map(([key, value]) => (
            <div key={key} className="dhc-node-props-field">
              <div className="dhc-node-props-label">{key}</div>
              <div className="dhc-node-props-value">{String(value)}</div>
            </div>
          ))}
      </div>

      {/* Assigned product */}
      {assignedItem && (
        <div className="dhc-catalog-section">
          <div className="dhc-catalog-section-label">{t("builder.catalog.assigned")}</div>
          <div className="dhc-catalog-assigned">
            <div className="dhc-catalog-assigned-label">
              {assignedItem.brand} {assignedItem.model}
            </div>
            {assignedItem.description && (
              <div className="dhc-catalog-assigned-detail">{assignedItem.description}</div>
            )}
            {assignedItem.sku && (
              <div className="dhc-catalog-assigned-detail">SKU: {assignedItem.sku}</div>
            )}
          </div>
          <button
            className="dhc-catalog-unassign"
            onClick={() => onUnassign(selectedNode.id)}
            style={{ marginTop: "0.35rem" }}
          >
            {t("builder.catalog.unassign")}
          </button>
        </div>
      )}

      {/* Catalog search */}
      <div className="dhc-catalog-section">
        <input
          type="text"
          className="dhc-catalog-search"
          placeholder={t("builder.catalog.search")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="dhc-catalog-list">
          {filtered.map((item) => (
            <div key={item.id} className="dhc-catalog-item">
              <div className="dhc-catalog-item-info">
                <span className="dhc-catalog-item-name">{item.model}</span>
                <span className="dhc-catalog-item-brand">
                  {item.brand} &middot; {item.category}
                </span>
              </div>
              <button
                className="dhc-catalog-assign"
                onClick={() => onAssign(selectedNode.id, item.id)}
              >
                {t("builder.catalog.assign")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CatalogPanel;
