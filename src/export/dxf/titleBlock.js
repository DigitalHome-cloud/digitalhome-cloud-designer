/**
 * NF C 15-100 cartouche (A3 landscape, 420 × 297 mm).
 * Placed so its top-right corner lands at the configured (x, y).
 */

const TITLE_LAYER = "TITLE_BLOCK";

export function drawTitleBlock(dxf, { x, y, smartHomeId, diagramTitle, revision = "A" }) {
  dxf.ensureLayer(TITLE_LAYER, 7);
  const W = 180;
  const H = 40;
  const x0 = x - W;
  const y0 = y - H;

  dxf.rect(x0, y0, W, H, { layer: TITLE_LAYER });
  dxf.line(x0, y0 + H / 2, x0 + W, y0 + H / 2, { layer: TITLE_LAYER });
  dxf.line(x0 + W / 2, y0, x0 + W / 2, y0 + H, { layer: TITLE_LAYER });

  dxf.text(x0 + 2, y0 + H - 6, 3.5, diagramTitle, { layer: TITLE_LAYER });
  dxf.text(x0 + W / 2 + 2, y0 + H - 6, 2.5, `SmartHome: ${smartHomeId}`, { layer: TITLE_LAYER });
  dxf.text(x0 + 2, y0 + H / 2 - 6, 2.5, `Date: ${new Date().toISOString().slice(0, 10)}`, { layer: TITLE_LAYER });
  dxf.text(x0 + W / 2 + 2, y0 + H / 2 - 6, 2.5, `Rev: ${revision}`, { layer: TITLE_LAYER });
  dxf.text(x0 + 2, y0 + 2, 2, "Conforme NF C 15-100", { layer: TITLE_LAYER });
  dxf.text(x0 + W / 2 + 2, y0 + 2, 2, "DigitalHome.Cloud Designer", { layer: TITLE_LAYER });
}
