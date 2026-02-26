import * as React from "react";
import { useTranslation } from "gatsby-plugin-react-i18next";
import {
  initModelerWorkspace,
  exportWorkspaceJson,
  updateToolbox,
  getWorkspace,
} from "../blockly/workspace";
import { loadToolbox, getToolboxForView } from "../blockly/toolboxLoader";

const Canvas = ({
  onSelectionChange,
  designView,
  onDesignViewChange,
  isFullscreen,
  onToggleFullscreen,
  readOnly,
  extraActions,
}) => {
  const { t } = useTranslation();
  const containerRef = React.useRef(null);
  const [toolboxLoaded, setToolboxLoaded] = React.useState(false);

  // Load toolbox from S3 and init workspace
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    async function init() {
      const toolbox = await loadToolbox("latest");
      if (cancelled) return;
      setToolboxLoaded(true);

      const toolboxConfig =
        designView === "all" ? toolbox : getToolboxForView(designView);

      initModelerWorkspace(containerRef.current, {
        onSelectionChange,
        toolboxConfig: toolboxConfig || undefined,
        readOnly,
      });
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [onSelectionChange, readOnly]);

  // Update toolbox when designView changes
  React.useEffect(() => {
    if (typeof window === "undefined" || !toolboxLoaded) return;
    const toolboxConfig = getToolboxForView(designView);
    if (toolboxConfig) {
      updateToolbox(toolboxConfig);
    }
  }, [designView, toolboxLoaded]);

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
    if (view === "shared") return "Shared";
    return "All";
  };

  const views = ["spatial", "electrical", "shared", "all"];

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
          <span className="dhc-canvas-label">
            {toolboxLoaded ? "Workspace" : "Loading toolbox..."}
          </span>
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
            {extraActions}
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
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Inspector = ({ selectedBlock }) => {
  const { t } = useTranslation();

  // Collect all fields from the block, grouped by type
  const fields = React.useMemo(() => {
    if (!selectedBlock) return [];
    const result = [];
    for (const input of selectedBlock.inputList) {
      for (const field of input.fieldRow) {
        if (!field.name) continue;
        const value = field.getValue();
        let fieldType = "text";
        if (field instanceof Object && field.constructor?.name === "FieldNumber") {
          fieldType = "number";
        } else if (field instanceof Object && field.constructor?.name === "FieldCheckbox") {
          fieldType = "checkbox";
        } else if (field instanceof Object && field.constructor?.name === "FieldDropdown") {
          fieldType = "dropdown";
        }
        result.push({
          name: field.name,
          label: field.name.replace(/_/g, " ").toLowerCase(),
          value,
          fieldType,
        });
      }
    }
    return result;
  }, [selectedBlock]);

  const blockType = selectedBlock?.type?.replace("dhc_", "").replace(/_/g, " ") || "";

  return (
    <div className="dhc-panel dhc-panel--inspector">
      <div className="dhc-panel-header">
        <span className="dhc-panel-title">
          {t("workspace.inspector.title")}
        </span>
        <span className="dhc-panel-tag">Details</span>
      </div>
      <div className="dhc-panel-body">
        {!selectedBlock ? (
          <p className="dhc-panel-help">{t("workspace.inspector.help")}</p>
        ) : (
          <>
            <div className="dhc-inspector-field">
              <div className="dhc-inspector-label">Block Type</div>
              <input
                className="dhc-inspector-input"
                type="text"
                value={blockType}
                readOnly
              />
            </div>
            {fields.map((f) => (
              <div key={f.name} className="dhc-inspector-field">
                <div className="dhc-inspector-label">{f.label}</div>
                {f.fieldType === "checkbox" ? (
                  <input
                    className="dhc-inspector-input"
                    type="checkbox"
                    checked={f.value === "TRUE"}
                    readOnly
                    style={{ width: "auto" }}
                  />
                ) : (
                  <input
                    className="dhc-inspector-input"
                    type={f.fieldType === "number" ? "number" : "text"}
                    value={f.value ?? ""}
                    readOnly
                  />
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const WorkspaceShell = ({ readOnly = false, extraActions, children }) => {
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
          readOnly={readOnly}
          extraActions={extraActions}
        />
        {!isFullscreen && <Inspector selectedBlock={selectedBlock} />}
      </div>
      {children}
    </div>
  );
};

export default WorkspaceShell;
