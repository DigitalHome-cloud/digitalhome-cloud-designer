import * as React from "react";
import { getWorkspace } from "../blockly/workspace";
import { serializeToJSON } from "../blockly/aboxSerializer";
import { exportUnifilaireFromAbox, exportLibrary, downloadDxf } from "../export/dxf";
import { useSmartHome } from "../context/SmartHomeContext";

const ExportDxfButton = ({ hasBlockingViolations = false }) => {
  const { activeHomeId } = useSmartHome();
  const [busy, setBusy] = React.useState(false);

  const onClick = () => {
    const ws = getWorkspace();
    if (!ws) return;
    if (hasBlockingViolations) {
      const go = window.confirm(
        "Validation NF C 15-100 non satisfaite. Exporter quand même (DRAFT) ?",
      );
      if (!go) return;
    }
    try {
      setBusy(true);
      const abox = serializeToJSON(ws, activeHomeId || "UNKNOWN");
      const dxf = exportUnifilaireFromAbox(abox, activeHomeId || "UNKNOWN");
      const ts = new Date().toISOString().slice(0, 10);
      downloadDxf(dxf, `${activeHomeId || "design"}-unifilaire-${ts}.dxf`);
    } finally {
      setBusy(false);
    }
  };

  const onExportLibrary = () => {
    const dxf = exportLibrary({ author: "DLAB5" });
    downloadDxf(dxf, `dlab5-nfc15100-library-${new Date().toISOString().slice(0, 10)}.dxf`);
  };

  return (
    <>
      <button
        type="button"
        className="dhc-btn dhc-btn-secondary"
        onClick={onClick}
        disabled={busy}
        title="Exporter le schéma unifilaire NF C 15-100 au format DXF"
      >
        {busy ? "…" : "Export DXF"}
      </button>
      <button
        type="button"
        className="dhc-btn dhc-btn-secondary"
        onClick={onExportLibrary}
        title="Télécharger la bibliothèque (gabarits A4/A3/A2/A1 + symboles NF C 15-100)"
      >
        Bibliothèque DXF
      </button>
    </>
  );
};

export default ExportDxfButton;
