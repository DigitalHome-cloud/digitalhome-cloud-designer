// src/features/smart-home-designer/SmartHomeDesigner.tsx
// Smart Home Designer main component.
// Reuses the WorkspaceShell from the modeler / ontology designer repo.

import React, { useCallback, useEffect, useState } from "react";
import { smartHomeToolboxes, SmartHomeDesignView } from "../../blockly/smartHomeToolboxes";
import { WorkspaceShell } from "../ontology-designer/WorkspaceShell"; // adjust path if needed
// import { useLocalization } from "../../i18n/LocalizationContext";

export const SmartHomeDesigner: React.FC = () => {
  const [view, setView] = useState<SmartHomeDesignView>("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  // const { t } = useLocalization();

  const toolboxXml = smartHomeToolboxes[view];

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      document.body.style.overflow = next ? "hidden" : "";
      return next;
    });
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        exitFullscreen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen, exitFullscreen]);

  const handleExportToFile = useCallback(() => {
    const event = new CustomEvent("dhc:blockly-export-workspace");
    window.dispatchEvent(event);
  }, []);

  const containerClass = `designer-shell ${isFullscreen ? "designer-shell--fullscreen" : ""}`;

  return (
    <div className={containerClass}>
      <header className="designer-shell__header">
        <div className="designer-shell__title">
          {/* t("smartHomeDesigner.title") ?? */} Smart Home Designer
        </div>

        <div className="designer-shell__toolbar">
          <button
            type="button"
            className="dhc-btn dhc-btn--secondary"
            onClick={handleExportToFile}
          >
            {/* t("ontologyDesigner.exportToFile") ?? */} Export workspace to file
          </button>

          <button
            type="button"
            className="dhc-btn dhc-btn--ghost"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? "Exit full screen (Esc)" : "Full screen"}
          </button>

          <div className="designer-shell__view-switch">
            <span className="designer-shell__view-label">Design view:</span>
            <div className="designer-shell__view-buttons">
              <button
                type="button"
                className={`dhc-chip ${view === "spatial" ? "dhc-chip--active" : ""}`}
                onClick={() => setView("spatial")}
              >
                Spatial
              </button>
              <button
                type="button"
                className={`dhc-chip ${view === "electrical" ? "dhc-chip--active" : ""}`}
                onClick={() => setView("electrical")}
              >
                Electrical
              </button>
              <button
                type="button"
                className={`dhc-chip ${view === "network" ? "dhc-chip--active" : ""}`}
                onClick={() => setView("network")}
              >
                Network
              </button>
              <button
                type="button"
                className={`dhc-chip ${view === "all" ? "dhc-chip--active" : ""}`}
                onClick={() => setView("all")}
              >
                All
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="designer-shell__body">
        <WorkspaceShell
          mode="smart-home"
          toolboxXml={toolboxXml}
        />
      </main>
    </div>
  );
};
