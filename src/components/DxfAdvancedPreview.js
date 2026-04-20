import * as React from "react";

/**
 * Advanced DXF preview using the `dxf-viewer` library (three.js-based).
 * Loaded lazily so the lib only enters the bundle chunk that mounts it.
 *
 * Known limitation: without a bundled font, TEXT entities render as empty.
 * The geometry (lines, circles, arcs, blocks) shows correctly. We ship this
 * as the "advanced" toggle for zoom/pan/layer inspection; the SVG preview
 * remains the default for faithful text rendering.
 */
const DxfAdvancedPreview = ({ dxfText }) => {
  const containerRef = React.useRef(null);
  const viewerRef = React.useRef(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!dxfText || !containerRef.current) return;
    let cancelled = false;
    let blobUrl = null;

    (async () => {
      try {
        const { DxfViewer } = await import("dxf-viewer");
        if (cancelled) return;

        if (viewerRef.current) {
          try { viewerRef.current.Destroy(); } catch (_) {}
          viewerRef.current = null;
        }

        const viewer = new DxfViewer(containerRef.current, {
          clearColor: new (await import("three")).Color(0xffffff),
          autoResize: true,
          colorCorrection: true,
        });
        viewerRef.current = viewer;

        const blob = new Blob([dxfText], { type: "application/dxf" });
        blobUrl = URL.createObjectURL(blob);
        await viewer.Load({ url: blobUrl, fonts: [] });
      } catch (e) {
        console.error("[DxfAdvancedPreview] load failed", e);
        if (!cancelled) setError(e.message || String(e));
      }
    })();

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      if (viewerRef.current) {
        try { viewerRef.current.Destroy(); } catch (_) {}
        viewerRef.current = null;
      }
    };
  }, [dxfText]);

  return (
    <div className="dhc-drawing-advanced">
      {error && <p className="dhc-drawing-status">Advanced preview failed: {error}</p>}
      <div ref={containerRef} className="dhc-drawing-advanced-canvas" />
    </div>
  );
};

export default DxfAdvancedPreview;
