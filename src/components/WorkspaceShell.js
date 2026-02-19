import * as React from "react";
import { useTranslation } from "gatsby-plugin-react-i18next";
import {
  initModelerWorkspace,
  exportWorkspaceJson,
  setDesignView,
} from "../blockly/workspace";
import BuilderTab from "./BuilderTab";

/* ── Designer tab: existing Blockly canvas + inspector ── */

const Canvas = ({
  onSelectionChange,
  designView,
  onDesignViewChange,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const { t } = useTranslation();
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    initModelerWorkspace(containerRef.current, { onSelectionChange, designView: "all" });
  }, [onSelectionChange]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!designView) return;
    setDesignView(designView);
  }, [designView]);

  const handleExport = () => {
    const data = exportWorkspaceJson();
    if (!data) {
      alert("Nothing to export: workspace is empty.");
      return;
    }
    const serialized = JSON.stringify(data, null, 2);
    const blob = new Blob([serialized], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dhc-workspace.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const changeView = (view) => {
    if (view === designView) return;
    onDesignViewChange(view);
  };

  const viewLabel = (view) => {
    if (view === "spatial") return "Spatial";
    if (view === "electrical") return "Electrical";
    if (view === "network") return "Network";
    return "All";
  };

  const views = ["spatial", "electrical", "network", "all"];

  return (
    <div className="dhc-panel">
      <div className="dhc-panel-header">
        <span className="dhc-panel-title">
          {t("workspace.canvas.title")}
        </span>
        <span className="dhc-panel-tag">Smart Home</span>
      </div>
      <div className="dhc-panel-body">
        <div className="dhc-canvas-area">
          <span className="dhc-canvas-label">Workspace</span>
          <div
            ref={containerRef}
            style={{ width: "100%", height: "100%", minHeight: "500px" }}
          />
        </div>
        <div className="dhc-canvas-actions">
          <div className="dhc-canvas-actions-left">
            <span className="dhc-canvas-view-label">Design view:</span>
            {views.map((view) => (
              <button
                key={view}
                type="button"
                className={
                  "dhc-view-pill" +
                  (designView === view ? " dhc-view-pill--active" : "")
                }
                onClick={() => changeView(view)}
              >
                {viewLabel(view)}
              </button>
            ))}
          </div>
          <div className="dhc-canvas-actions-right">
            <button
              type="button"
              className="dhc-button-ghost"
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? "Exit full screen (Esc)" : "Full screen"}
            </button>
            <button
              type="button"
              className="dhc-button-secondary"
              onClick={handleExport}
            >
              Export workspace to file
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Inspector = ({ selectedBlock }) => {
  const { t } = useTranslation();

  const label = selectedBlock?.getFieldValue("LABEL") || "";
  const iri =
    selectedBlock?.getFieldValue("IRI") ||
    selectedBlock?.getFieldValue("BASE") ||
    "";
  const comment = selectedBlock?.getFieldValue("COMMENT") || "";

  return (
    <div className="dhc-panel dhc-panel--inspector">
      <div className="dhc-panel-header">
        <span className="dhc-panel-title">
          {t("workspace.inspector.title")}
        </span>
        <span className="dhc-panel-tag">Details</span>
      </div>
      <div className="dhc-panel-body">
        <p className="dhc-panel-help">{t("workspace.inspector.help")}</p>
        <div className="dhc-inspector-field">
          <div className="dhc-inspector-label">Label</div>
          <input
            className="dhc-inspector-input"
            type="text"
            value={label}
            readOnly
          />
        </div>
        <div className="dhc-inspector-field">
          <div className="dhc-inspector-label">IRI / Base</div>
          <input
            className="dhc-inspector-input"
            type="text"
            value={iri}
            readOnly
          />
        </div>
        <div className="dhc-inspector-field">
          <div className="dhc-inspector-label">Comment</div>
          <textarea
            className="dhc-inspector-input"
            value={comment}
            readOnly
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

const DesignerTab = () => {
  const [selectedBlock, setSelectedBlock] = React.useState(null);
  const [designView, setDesignViewState] = React.useState("all");
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    if (!isFullscreen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const sectionClassName = isFullscreen ? "dhc-workspace-fullscreen" : "";

  return (
    <div className={sectionClassName}>
      <div className="dhc-workspace dhc-workspace--two-columns">
        <Canvas
          onSelectionChange={setSelectedBlock}
          designView={designView}
          onDesignViewChange={setDesignViewState}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
        />
        {!isFullscreen && <Inspector selectedBlock={selectedBlock} />}
      </div>
    </div>
  );
};

/* ── WorkspaceShell with tab bar ── */

const WorkspaceShell = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState("designer");

  return (
    <section>
      <h2 className="dhc-section-title">{t("section.workspace")}</h2>
      <div className="dhc-tab-bar">
        <button
          type="button"
          className={`dhc-tab${activeTab === "designer" ? " dhc-tab--active" : ""}`}
          onClick={() => setActiveTab("designer")}
        >
          {t("tab.designer")}
        </button>
        <button
          type="button"
          className={`dhc-tab${activeTab === "builder" ? " dhc-tab--active" : ""}`}
          onClick={() => setActiveTab("builder")}
        >
          {t("tab.builder")}
        </button>
      </div>

      {activeTab === "designer" && <DesignerTab />}
      {activeTab === "builder" && <BuilderTab />}
    </section>
  );
};

export default WorkspaceShell;
