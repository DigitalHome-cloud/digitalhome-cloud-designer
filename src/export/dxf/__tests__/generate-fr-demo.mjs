#!/usr/bin/env node
/**
 * Exercise the full pipeline : fixture Blockly JSON → fromAbox → renderUnifilaire.
 * Sortie : /tmp/dhc-test-fr-demo-unifilaire.dxf
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DXF_DIR = path.resolve(__dirname, "..");

const { aboxToUnifilaireInput } = await import(pathToFileURL(path.join(DXF_DIR, "fromAbox.js")).href);
const { renderUnifilaire } = await import(pathToFileURL(path.join(DXF_DIR, "unifilaire.js")).href);

const fixturePath = path.join(__dirname, "fixtures", "fr-demo-blockly.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const neutral = aboxToUnifilaireInput(fixture, fixture.smartHomeId || "FR-DEMO");
const dxf = renderUnifilaire(neutral);

const out = "/tmp/dhc-test-fr-demo-unifilaire.dxf";
fs.writeFileSync(out, dxf);
console.log(`  → ${out}  (${(dxf.length / 1024).toFixed(1)} KB, ${dxf.split("\n").length} lignes)`);

// Contrôles structurels
let fail = 0;
function assert(cond, msg) { if (!cond) { console.error(`  ✗ ${msg}`); fail++; } }
assert(dxf.trim().endsWith("EOF"), "doit se terminer par EOF");
for (const kw of ["SECTION", "ENDSEC", "BLOCKS", "ENTITIES", "TABLES", "LAYER"]) assert(dxf.includes(kw), `section ${kw} manquante`);
assert(!/[\u00C0-\u024F]/.test(dxf), "caractères accentués non échappés");
assert(dxf.includes("\\U+"), "échappements \\U+XXXX absents");
assert(dxf.includes("$DWGCODEPAGE"), "$DWGCODEPAGE absent");
assert(dxf.includes("\nBLOCK\n8\n0\n2\nFRAME_"), "bloc FRAME_* non inséré comme BLOCK");

// Circuits représentés
assert(neutral.boards[0].circuits.length >= 8, `attendu ≥ 8 circuits, obtenu ${neutral.boards[0].circuits.length}`);
assert(neutral.boards[0].rcds.length === 3, `attendu 3 DDR, obtenu ${neutral.boards[0].rcds.length}`);

if (fail === 0) console.log("\n✓ FR-DEMO unifilaire : tous les contrôles passent.");
else { console.error(`\n✗ ${fail} erreurs`); process.exit(1); }
