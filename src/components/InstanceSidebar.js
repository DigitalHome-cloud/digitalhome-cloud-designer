import * as React from "react";
import { useTranslation } from "gatsby-plugin-react-i18next";

const VIEW_COLORS = {
  spatial: "#22c55e",
  building: "#f59e0b",
  electrical: "#3b82f6",
  plumbing: "#06b6d4",
  heating: "#ef4444",
  network: "#a855f7",
  governance: "#f97316",
  automation: "#ec4899",
};

const VIEW_LABELS = {
  spatial: "Spatial",
  building: "Building",
  electrical: "Electrical",
  plumbing: "Plumbing",
  heating: "Heating / HVAC",
  network: "Network",
  governance: "Governance",
  automation: "Automation",
};

const VIEW_ORDER = [
  "spatial",
  "building",
  "electrical",
  "plumbing",
  "heating",
  "network",
  "governance",
  "automation",
];

const InstanceSidebar = ({
  graphData,
  visibleViews,
  onToggleView,
  onShowAll,
  onHideAll,
  onNodeSelect,
  selectedNode,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState({});

  const grouped = React.useMemo(() => {
    if (!graphData) return {};
    const groups = {};
    for (const node of graphData.nodes) {
      const view = node.view || "other";
      if (!groups[view]) groups[view] = [];
      groups[view].push(node);
    }
    return groups;
  }, [graphData]);

  const toggleExpanded = (view) => {
    setExpanded((prev) => ({ ...prev, [view]: !prev[view] }));
  };

  const expandAll = () => {
    const next = {};
    for (const v of [...VIEW_ORDER, "other"]) next[v] = true;
    setExpanded(next);
  };

  const collapseAll = () => {
    const next = {};
    for (const v of [...VIEW_ORDER, "other"]) next[v] = false;
    setExpanded(next);
  };

  return (
    <div className="dhc-sidebar">
      <div className="dhc-sidebar-header">
        <span className="dhc-sidebar-title">{t("builder.sidebar.title")}</span>
        <div className="dhc-sidebar-header-actions">
          <button className="dhc-sidebar-clear" onClick={onShowAll} title="Show all views">
            All
          </button>
          <button className="dhc-sidebar-clear" onClick={onHideAll} title="Hide all views">
            None
          </button>
        </div>
      </div>
      <div className="dhc-sidebar-controls">
        <div className="dhc-sidebar-controls-row">
          <button className="dhc-sidebar-clear" onClick={expandAll} title="Expand all">
            Expand
          </button>
          <button className="dhc-sidebar-clear" onClick={collapseAll} title="Collapse all">
            Collapse
          </button>
        </div>
      </div>
      <div className="dhc-sidebar-body">
        {VIEW_ORDER.map((view) => {
          const nodes = grouped[view];
          if (!nodes || nodes.length === 0) return null;
          const isExpanded = expanded[view] !== false;
          const isVisible = visibleViews.has(view);

          return (
            <div key={view} className="dhc-sidebar-section">
              <div
                className={`dhc-sidebar-section-header ${isVisible ? "dhc-sidebar-section-header--active" : ""}`}
              >
                <input
                  type="checkbox"
                  className="dhc-sidebar-checkbox"
                  checked={isVisible}
                  onChange={() => onToggleView(view)}
                  title={`Toggle ${VIEW_LABELS[view]}`}
                />
                <button
                  className="dhc-sidebar-section-btn"
                  onClick={() => toggleExpanded(view)}
                >
                  <span
                    className="dhc-view-dot"
                    style={{ background: VIEW_COLORS[view] }}
                  />
                  <span className="dhc-sidebar-section-label">
                    {VIEW_LABELS[view]}
                  </span>
                  <span className="dhc-sidebar-section-count">
                    {nodes.length}
                  </span>
                  <span className={`dhc-sidebar-chevron ${isExpanded ? "dhc-sidebar-chevron--open" : ""}`}>
                    &#9654;
                  </span>
                </button>
              </div>
              {isExpanded && (
                <div className="dhc-sidebar-items">
                  {nodes.map((node) => (
                    <button
                      key={node.id}
                      className={`dhc-sidebar-item ${selectedNode === node.id ? "dhc-sidebar-item--selected" : ""}`}
                      onClick={() => onNodeSelect(node.id)}
                    >
                      <span className="dhc-sidebar-item-icon">
                        {node.nodeType?.[0] || "N"}
                      </span>
                      {node.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {grouped["other"] && grouped["other"].length > 0 && (
          <div className="dhc-sidebar-section">
            <div className="dhc-sidebar-section-header">
              <button
                className="dhc-sidebar-section-btn"
                onClick={() => toggleExpanded("other")}
              >
                <span className="dhc-view-dot" style={{ background: "#e5e7eb" }} />
                <span className="dhc-sidebar-section-label">Other</span>
                <span className="dhc-sidebar-section-count">
                  {grouped["other"].length}
                </span>
                <span className={`dhc-sidebar-chevron ${expanded["other"] !== false ? "dhc-sidebar-chevron--open" : ""}`}>
                  &#9654;
                </span>
              </button>
            </div>
            {expanded["other"] !== false && (
              <div className="dhc-sidebar-items">
                {grouped["other"].map((node) => (
                  <button
                    key={node.id}
                    className={`dhc-sidebar-item ${selectedNode === node.id ? "dhc-sidebar-item--selected" : ""}`}
                    onClick={() => onNodeSelect(node.id)}
                  >
                    <span className="dhc-sidebar-item-icon">
                      {node.nodeType?.[0] || "N"}
                    </span>
                    {node.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstanceSidebar;
