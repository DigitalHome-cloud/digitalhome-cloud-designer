import * as React from "react";
import { useTranslation } from "gatsby-plugin-react-i18next";
import { initModelerWorkspace, exportWorkspaceJson } from "../blockly/workspace";

const Canvas = ({ onSelectionChange }) => {
  const { t } = useTranslation();
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    initModelerWorkspace(containerRef.current, { onSelectionChange });
  }, [onSelectionChange]);

  const handleExport = () => {
    const json = exportWorkspaceJson();
    // eslint-disable-next-line no-console
    console.log("DHC Modeler workspace export:", json);
    alert("Workspace exported to console (see DevTools).");
  };

  return (
    <div className="dhc-panel">
      <div className="dhc-panel-header">
        <span className="dhc-panel-title">
          {t("workspace.canvas.title")}
        </span>
        <span className="dhc-panel-tag">Blockly</span>
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
          <button
            type="button"
            onClick={handleExport}
            className="dhc-button-secondary"
          >
            Export workspace (console)
          </button>
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
          <input
            className="dhc-inspector-input"
            type="text"
            value={comment}
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

const WorkspaceShell = () => {
  const { t } = useTranslation();
  const [selectedBlock, setSelectedBlock] = React.useState(null);

  return (
    <section>
      <h2 className="dhc-section-title">{t("section.workspace")}</h2>
      <div className="dhc-workspace dhc-workspace--two-columns">
        <Canvas onSelectionChange={setSelectedBlock} />
        <Inspector selectedBlock={selectedBlock} />
      </div>
    </section>
  );
};

export default WorkspaceShell;
