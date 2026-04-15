#!/usr/bin/env node
/**
 * Génère des fichiers DXF de test dans /tmp pour vérification visuelle
 * dans LibreCAD / QCAD / AutoCAD.
 *
 * Lancement :
 *   node src/export/dxf/__tests__/generate-samples.mjs
 *
 * Produit :
 *   /tmp/dhc-test-library.dxf        — bibliothèque complète (A4/A3/A2/A1 + symboles)
 *   /tmp/dhc-test-unifilaire-min.dxf — unifilaire minimal (3 circuits)
 *   /tmp/dhc-test-unifilaire-full.dxf— unifilaire typique maison F4
 *   /tmp/dhc-test-frame-A4.dxf       — gabarit A4 DLAB5 seul
 *   /tmp/dhc-test-frame-A3.dxf       — gabarit A3 DLAB5 seul
 *   /tmp/dhc-test-frame-A2.dxf       — gabarit A2 DLAB5 seul
 *   /tmp/dhc-test-frame-A1.dxf       — gabarit A1 DLAB5 seul
 *
 * Le script vérifie aussi structurellement chaque fichier (sections DXF,
 * EOF, échappement des caractères accentués en \U+XXXX).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DXF_DIR = path.resolve(__dirname, "..");

// Node ESM requires explicit .js extensions; Gatsby/webpack does not.
// We resolve each module by URL to avoid touching source files.
const { renderUnifilaire } = await import(pathToFileURL(path.join(DXF_DIR, "unifilaire.js")).href);
const { createDxf } = await import(pathToFileURL(path.join(DXF_DIR, "dxfWriter.js")).href);
const { drawDlab5Frame } = await import(pathToFileURL(path.join(DXF_DIR, "library/frames.js")).href);
const { buildDxfLibrary } = await import(pathToFileURL(path.join(DXF_DIR, "library/buildLibrary.js")).href);
const { NFC15100_SYMBOLS } = await import(pathToFileURL(path.join(DXF_DIR, "library/symbolsNfc15100.js")).href);
const { CIRCUIT_CATALOGUE } = await import(pathToFileURL(path.join(DXF_DIR, "library/circuits.js")).href);

// ---------- helpers ----------

const OUT = "/tmp";
const results = [];

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERT: ${msg}`);
}

function structuralChecks(name, dxf) {
  assert(dxf.trim().endsWith("EOF"), `${name}: should end with EOF`);
  for (const kw of ["SECTION", "ENDSEC", "BLOCKS", "ENTITIES", "TABLES", "LAYER"]) {
    assert(dxf.includes(kw), `${name}: missing ${kw}`);
  }
  const rawAccent = /[\u00C0-\u024F]/.test(dxf);
  assert(!rawAccent, `${name}: non-ASCII bytes leaked into DXF — escape broken`);
  assert(dxf.includes("\\U+"), `${name}: no \\U+XXXX escapes (French text missing?)`);
  assert(dxf.includes("$DWGCODEPAGE"), `${name}: $DWGCODEPAGE header missing`);
}

function write(name, dxf) {
  const p = path.join(OUT, name);
  fs.writeFileSync(p, dxf);
  const kb = (dxf.length / 1024).toFixed(1);
  console.log(`  → ${p}  (${kb} KB, ${dxf.split("\n").length} lignes)`);
  results.push({ name, bytes: dxf.length });
}

// ---------- échantillons ----------

const boardFull = {
  smartHomeId: "FR-80000-ROU12-01",
  delivery: { supplyType: "monophase", agcp: { rating: 60, label: "AGCP 500 mA sélectif" } },
  boards: [{
    id: "TGBT",
    label: "Tableau général — Maison F4",
    rcds: [
      { id: "DDR1", label: "DDR 30 mA type AC", sensitivity: 30, type: "AC", feeds: ["C1", "C2", "C3"] },
      { id: "DDR2", label: "DDR 30 mA type A", sensitivity: 30, type: "A", feeds: ["C4", "C5", "C6", "C7"] },
      { id: "DDR3", label: "DDR 30 mA type F", sensitivity: 30, type: "F", feeds: ["C8"] },
    ],
    circuits: [
      { id: "C1", label: "Éclairage séjour", breaker: { rating: 16, curve: "C" }, wire: { section: 1.5 } },
      { id: "C2", label: "Éclairage chambres", breaker: { rating: 16, curve: "C" }, wire: { section: 1.5 } },
      { id: "C3", label: "Éclairage extérieur", breaker: { rating: 10, curve: "C" }, wire: { section: 1.5 } },
      { id: "C4", label: "Prises séjour", breaker: { rating: 16, curve: "C" }, wire: { section: 2.5 } },
      { id: "C5", label: "Prises cuisine", breaker: { rating: 20, curve: "C" }, wire: { section: 2.5 } },
      { id: "C6", label: "Prises chambres", breaker: { rating: 16, curve: "C" }, wire: { section: 2.5 } },
      { id: "C7", label: "Lave-linge dédié", breaker: { rating: 20, curve: "C" }, wire: { section: 2.5 } },
      { id: "C8", label: "Plaque de cuisson", breaker: { rating: 32, curve: "C" }, wire: { section: 6 } },
    ],
  }],
};

const boardMin = {
  smartHomeId: "FR-DEMO-01",
  delivery: { agcp: { rating: 45, label: "AGCP" } },
  boards: [{
    id: "TGBT", label: "Tableau studio",
    rcds: [{ id: "DDR1", label: "DDR 30 mA", sensitivity: 30, type: "A", feeds: ["C1", "C2", "C3"] }],
    circuits: [
      { id: "C1", label: "Éclairage", breaker: { rating: 16, curve: "C" }, wire: { section: 1.5 } },
      { id: "C2", label: "Prises", breaker: { rating: 16, curve: "C" }, wire: { section: 2.5 } },
      { id: "C3", label: "Chauffe-eau", breaker: { rating: 20, curve: "C" }, wire: { section: 2.5 } },
    ],
  }],
};

function renderSingleFrame(size) {
  const dxf = createDxf();
  drawDlab5Frame(dxf, {
    size,
    cartouche: {
      title: `Gabarit ${size} — DLAB5`,
      project: "Bibliothèque NF C 15-100",
      smartHomeId: "—",
      scale: "1:1",
      author: "DLAB5",
      checkedBy: "Bureau d'études",
      revision: "A",
      page: "1/1",
    },
  });
  return dxf.toString();
}

// ---------- exécution ----------

console.log("Génération des fichiers DXF de test :");

const samples = [
  ["dhc-test-library.dxf", buildDxfLibrary({ author: "DLAB5" })],
  ["dhc-test-unifilaire-min.dxf", renderUnifilaire(boardMin)],
  ["dhc-test-unifilaire-full.dxf", renderUnifilaire(boardFull)],
  ["dhc-test-frame-A4.dxf", renderSingleFrame("A4")],
  ["dhc-test-frame-A3.dxf", renderSingleFrame("A3")],
  ["dhc-test-frame-A2.dxf", renderSingleFrame("A2")],
  ["dhc-test-frame-A1.dxf", renderSingleFrame("A1")],
];

let fail = 0;
for (const [name, dxf] of samples) {
  try {
    structuralChecks(name, dxf);
    write(name, dxf);
  } catch (e) {
    console.error(`  ✗ ${name}: ${e.message}`);
    fail++;
  }
}

// Vérification : toutes les symboles NF C 15-100 sont présents dans la
// bibliothèque en tant que BLOCK.
const libText = samples[0][1];
const missingBlocks = NFC15100_SYMBOLS.filter(
  (n) => !libText.includes(`\nBLOCK\n8\n0\n2\n${n}\n`),
);
if (missingBlocks.length) {
  console.error(`  ✗ Symboles manquants dans la bibliothèque: ${missingBlocks.join(", ")}`);
  fail++;
} else {
  console.log(`\n  ✓ ${NFC15100_SYMBOLS.length} symboles NF C 15-100 présents comme BLOCK`);
}

const missingCircuits = CIRCUIT_CATALOGUE
  .map((c) => c.name)
  .filter((n) => !libText.includes(`\nBLOCK\n8\n0\n2\n${n}\n`));
if (missingCircuits.length) {
  console.error(`  ✗ Circuits manquants dans la bibliothèque: ${missingCircuits.join(", ")}`);
  fail++;
} else {
  console.log(`  ✓ ${CIRCUIT_CATALOGUE.length} blocs circuit NF C 15-100 présents comme BLOCK`);
}

// Vérification : les gabarits (FRAME_A4..A1) sont enregistrés comme BLOCK.
const missingFrames = ["FRAME_A4", "FRAME_A3", "FRAME_A2", "FRAME_A1"].filter(
  (n) => !libText.includes(`\nBLOCK\n8\n0\n2\n${n}\n`),
);
if (missingFrames.length) {
  console.error(`  ✗ Gabarits manquants: ${missingFrames.join(", ")}`);
  fail++;
} else {
  console.log(`  ✓ 4 gabarits (A4/A3/A2/A1) présents comme BLOCK`);
}

// Parité manifeste ↔ blocs enregistrés (symboles + circuits).
const { MANIFEST } = await import(pathToFileURL(path.join(DXF_DIR, "library/index.js")).href);
const manifestBlockNames = new Set(MANIFEST.blocks.map((b) => b.name));
const registeredNames = new Set([
  ...NFC15100_SYMBOLS,
  ...CIRCUIT_CATALOGUE.map((c) => c.name),
  "FRAME_A4", "FRAME_A3", "FRAME_A2", "FRAME_A1",
  // extra terminal blocks registered by circuits.js (manifest lists them so
  // bureaux d'études see their T-box mapping alongside other symbols)
  "BOX_HEATING", "BOX_IRVE",
]);
const orphanManifest = [...manifestBlockNames].filter((n) => {
  const entry = MANIFEST.blocks.find((b) => b.name === n);
  return !registeredNames.has(n) && entry.kind !== "picture";
});
if (orphanManifest.length) {
  console.error(`  ✗ Manifest entries sans draw-fn: ${orphanManifest.join(", ")}`);
  fail++;
} else {
  console.log(`  ✓ Parité manifest ↔ registre (${manifestBlockNames.size} entrées)`);
}

// Vérification : échappement Unicode
// library → é è É (titres, mentions)
// unifilaire → é è ² (mm², Éclairage, séjour)
const expectations = [
  { sample: 0, label: "library", codes: { "00E9": "é", "00E8": "è", "00C9": "É" } },
  { sample: 2, label: "unifilaire", codes: { "00E9": "é", "00B2": "²" } },
];
for (const { sample, label, codes } of expectations) {
  const text = samples[sample][1];
  for (const [code, ch] of Object.entries(codes)) {
    if (!text.includes(`\\U+${code}`)) {
      console.error(`  ✗ ${label}: échappement \\U+${code} (${ch}) manquant`);
      fail++;
    }
  }
}
if (fail === 0) {
  console.log(`  ✓ Échappements Unicode vérifiés (é è É ² présents où attendus)`);
}

// Résumé
console.log("\nRésumé :");
console.log(`  fichiers générés  : ${results.length}`);
console.log(`  taille totale     : ${(results.reduce((a, b) => a + b.bytes, 0) / 1024).toFixed(1)} KB`);
console.log(`  symboles          : ${NFC15100_SYMBOLS.length}`);
console.log(`  erreurs           : ${fail}`);

if (fail > 0) process.exit(1);
console.log("\n✓ Tous les tests passent. Ouvrir les fichiers dans LibreCAD / QCAD pour vérification visuelle.");
