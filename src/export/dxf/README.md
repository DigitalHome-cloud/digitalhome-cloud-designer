# NF C 15-100 DXF Block Library

Browser-side DXF generator for French-standard electrical diagrams (`schéma unifilaire`), produced from the Blockly A-Box of the Designer. Ships a reusable library of DXF BLOCKs (frames, symbols, circuits) that bureaux d'études can insert in LibreCAD / QCAD / AutoCAD.

See `docs/adr/0014-dxf-block-library-in-designer.md` (umbrella repo) for the architectural decisions behind this module.

## Module layout

```
src/export/dxf/
  dxfWriter.js            Hand-rolled AC1009 DXF writer (~200 LOC, zero deps)
  unifilaire.js           Renders a unifilaire schema from neutral input
  fromAbox.js             Adapter: Blockly serializeToJSON → neutral input
  index.js                Public API
  library/
    manifest.json         Source of truth for all BLOCKs + metadata
    frames.js             FRAME_A4/A3/A2/A1 as BLOCKs + DLAB5 cartouche overlay
    symbolsNfc15100.js    45 IEC 60617 symbol BLOCKs (AGCP, DDR, SOCKET_*, …)
    circuits.js           22 NF C 15-100 circuit BLOCKs (mini-schematics)
    buildLibrary.js       Assembles the full library.dxf
    pictures/             Raster images referenced by manifest (picture kind)
    index.js              Barrel
  __tests__/
    fixtures/
      fr-demo-blockly.json   Sample Blockly output for FR-DEMO pavillon
    generate-samples.mjs     Writes 7 DXF files to /tmp + structural asserts
    generate-fr-demo.mjs     Full pipeline: fixture → fromAbox → unifilaire
    run.mjs                  Entry: register ESM hook + generate-samples
    run-fr-demo.mjs          Entry: register ESM hook + generate-fr-demo
    loader.mjs               ESM resolver hook (extensionless imports)
```

## Architecture

Four layers, left-to-right:

```
 Blockly workspace         Neutral input model        DXF document
 ─────────────────         ──────────────────         ───────────
 serializeToJSON()  ─┐                               ┌─  library.dxf
 { nodes, links }    ├── fromAbox ──►  { boards,  ──┤
                     │                    rcds,     │   unifilaire.dxf
                     │                    circuits }│
 manifest.json  ─────┘ (T-box ↔ block)              └─  (frames + symbols
                                                         + circuits)
```

- **`manifest.json`** is the catalogue: normative metadata (IEC 60617 code, NF C 15-100 clause, T-box class IRI, A-Box hint values) for every block. Referenced by the drawing modules to derive their exported arrays and by the future Blockly→DXF compiler to pick a block from a T-box class.
- **`dxfWriter.js`** emits AC1009 (R12) DXF. It supports LINE / CIRCLE / ARC / TEXT / INSERT entities, LAYER + BLOCK tables, Unicode escape for French accents (`\U+XXXX` with `$DWGCODEPAGE ANSI_1252`).
- **`library/` modules** register BLOCKs via `dxf.addBlock(name, draw)` — one group per file, all driven by the manifest.
- **`unifilaire.js`** composes INSERTs of those blocks into a single-line diagram.

### Why frames are BLOCKs

Treating the ISO 216 paper frames (A4/A3/A2/A1 with DLAB5 cartouche) as `FRAME_Ax` blocks means:

1. LibreCAD lists them in the Block palette → one-click insertion into any drawing.
2. A user can redefine the block inside LibreCAD to customise the cartouche graphics once, and every future `INSERT FRAME_A3` picks up the change.
3. Variable fields (title, project, date, revision …) remain editable per drawing because they are **overlaid** as TEXT entities by `drawDlab5Frame` after the INSERT — not baked into the block.

### Pictures (raster images)

The manifest supports `"kind": "picture"` entries pointing to a PNG under `library/pictures/`. They are currently rendered as a **placeholder block** (bounding rect + crossed lines + filename label + size annotation) — enough to round-trip through LibreCAD with a recognisable insertion point. The real `IMAGE`/`IMAGEDEF` entity emission requires bumping the writer from AC1009 (R12) to AC1015 (R2000). See *Follow-ups* below.

## Public API

```js
import {
  // rendering
  exportUnifilaire,            // (input)          → DXF string
  exportUnifilaireFromAbox,    // (aboxJson, sid)  → DXF string
  exportLibrary,               // (opts)           → DXF string
  downloadDxf,                 // (dxfText, fname)   triggers browser download

  // library primitives
  registerFrameBlocks,         // dxf → registers FRAME_A4..A1 as BLOCKs
  drawDlab5Frame,              // (dxf, {size, origin, cartouche})
  registerNfc15100Symbols,     // dxf → 45 IEC 60617 symbol BLOCKs
  registerCircuitBlocks,       // dxf → 22 NF C 15-100 circuit BLOCKs

  // catalogues (derived from manifest.json)
  PAPER_SIZES,                 // { A4, A3, A2, A1 } in mm
  NFC15100_SYMBOLS,            // [blockName, …]
  CIRCUIT_CATALOGUE,           // [{ name, rating, section, label, terminal, group }, …]
  CIRCUIT_MANIFEST,            // full manifest entries for circuits
  MANIFEST,                    // full manifest.json (all block kinds)
} from "src/export/dxf";
```

## How to add a new block

### Vector symbol

1. Append an entry to `library/manifest.json`:

   ```json
   {
     "name": "NEW_SYMBOL",
     "kind": "symbol",
     "category": "protection",
     "label": { "fr": "…", "en": "…" },
     "iec60617": "S00xxx",
     "tbox": "dhc-nfc15100:YourClass",
     "source": { "kind": "vector", "module": "./symbolsNfc15100.js" }
   }
   ```

2. Add a draw function in `symbolsNfc15100.js`:

   ```js
   dxf.addBlock("NEW_SYMBOL", (d) => {
     d.rect(-3, -3, 6, 6);
     d.text(-2, -1, 2, "NS");
   });
   ```

3. Run `node src/export/dxf/__tests__/run.mjs` — the parity check will ensure the registry and manifest agree.

### Vector circuit

Same recipe with `"kind": "circuit"` and a draw function in `circuits.js`. Minimum `abox`: `rating`, `section`, `terminal`.

### Raster picture

1. Drop a PNG into `library/pictures/your-image.png`.
2. Append a manifest entry:

   ```json
   {
     "name": "PICTURE_NAME",
     "kind": "picture",
     "source": { "kind": "raster", "file": "./pictures/your-image.png", "widthMm": 80, "heightMm": 60 }
   }
   ```

3. Regenerate the library — the block appears in the picture palette, rendered as a placeholder today, as a real image once AC1015 lands.

## Running the tests

```bash
# Library + 3 single-frame files + 2 unifilaires (min/full) + structural checks
node src/export/dxf/__tests__/run.mjs

# End-to-end from the FR-DEMO Blockly fixture
node src/export/dxf/__tests__/run-fr-demo.mjs
```

Output files land in `/tmp/dhc-test-*.dxf`. Open them in LibreCAD (Ubuntu: `apt install librecad`) to verify.

## LibreCAD round-trip workflow

1. `node src/export/dxf/__tests__/run.mjs`
2. Open `/tmp/dhc-test-library.dxf` in LibreCAD.
3. Drag blocks from the Block palette onto your drawing (or copy-paste them into another DXF file — the BLOCK definitions travel with the INSERT).
4. Save as `.dxf` (keep AC1009 / R12 for now).

## Follow-ups

- **S3 sync.** A GitHub Action on the designer repo will upload `library.dxf` + `manifest.json` to `s3://dhc-ontology/<manifest.version>/dxf/` whenever the manifest version bumps. The NF C 15-100 ontology module will then reference blocks by manifest version. Tracked in ADR 0014.
- **Real IMAGE entities.** Bump `dxfWriter.js` to AC1015 (R2000) and emit `IMAGE` + `IMAGEDEF` objects inside an `OBJECTS` section. Swap `d.imagePlaceholder` for a real `d.image` call in `buildLibrary.js::registerPictureBlocks`.
- **Blockly → DXF compiler.** Use `manifest.tbox` as a lookup to pick blocks directly from A-Box node types, retiring the heuristics in `fromAbox.js`.
