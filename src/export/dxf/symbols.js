/**
 * NF C 15-100 symbol library.
 *
 * Each symbol is registered as a DXF BLOCK at unit scale; insert via dxf.insert().
 * Geometry follows IEC 60617 conventions (simplified — v1).
 */

const SYMBOL_LAYER = "SYMBOLS";

export function registerSymbols(dxf) {
  dxf.ensureLayer(SYMBOL_LAYER, 7);

  // AGCP / disjoncteur de branchement (500 mA selective)
  dxf.addBlock("AGCP", (d) => {
    d.rect(-4, -6, 8, 12, { layer: SYMBOL_LAYER });
    d.line(0, 6, 0, 10, { layer: SYMBOL_LAYER });
    d.line(0, -6, 0, -10, { layer: SYMBOL_LAYER });
    d.text(-2.5, -2, 2, "AGCP", { layer: SYMBOL_LAYER });
    d.text(-3.5, -5, 1.5, "500mA-S", { layer: SYMBOL_LAYER });
  });

  // Interrupteur différentiel (30 mA RCD)
  dxf.addBlock("RCD30", (d) => {
    d.rect(-4, -5, 8, 10, { layer: SYMBOL_LAYER });
    d.line(-3, 2, 3, -2, { layer: SYMBOL_LAYER });
    d.line(-3, -2, 3, 2, { layer: SYMBOL_LAYER });
    d.line(0, 5, 0, 8, { layer: SYMBOL_LAYER });
    d.line(0, -5, 0, -8, { layer: SYMBOL_LAYER });
    d.text(-2.5, -4.2, 1.5, "30mA", { layer: SYMBOL_LAYER });
  });

  // Disjoncteur magnétothermique (MCB)
  dxf.addBlock("BREAKER", (d) => {
    d.rect(-3, -4, 6, 8, { layer: SYMBOL_LAYER });
    d.line(-2, 2, 2, -2, { layer: SYMBOL_LAYER });
    d.line(0, 4, 0, 7, { layer: SYMBOL_LAYER });
    d.line(0, -4, 0, -7, { layer: SYMBOL_LAYER });
  });

  // Circuit terminal marker (dot + downward line)
  dxf.addBlock("CIRCUIT_END", (d) => {
    d.circle(0, 0, 0.6, { layer: SYMBOL_LAYER });
    d.line(0, 0, 0, -3, { layer: SYMBOL_LAYER });
  });
}

export const SYMBOLS_LAYER_NAME = SYMBOL_LAYER;
