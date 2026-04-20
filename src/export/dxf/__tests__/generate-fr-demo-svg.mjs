#!/usr/bin/env node
/**
 * Exercise the SVG path : fixture Blockly JSON → fromAbox → renderUnifilaireSvg.
 * Sortie : /tmp/dhc-test-fr-demo-unifilaire.svg
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DXF_DIR = path.resolve(__dirname, "..");

const { aboxToUnifilaireInput } = await import(pathToFileURL(path.join(DXF_DIR, "fromAbox.js")).href);
const { renderUnifilaireSvg } = await import(pathToFileURL(path.join(DXF_DIR, "unifilaire.js")).href);

const fixturePath = path.join(__dirname, "fixtures", "fr-demo-blockly.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const neutral = aboxToUnifilaireInput(fixture, fixture.smartHomeId || "FR-DEMO");
const svg = renderUnifilaireSvg(neutral);

const out = "/tmp/dhc-test-fr-demo-unifilaire.svg";
fs.writeFileSync(out, svg);
console.log(`  → ${out}  (${(svg.length / 1024).toFixed(1)} KB)`);

let fail = 0;
function assert(cond, msg) { if (!cond) { console.error(`  ✗ ${msg}`); fail++; } }
assert(svg.startsWith("<svg"), "doit commencer par <svg");
assert(svg.trim().endsWith("</svg>"), "doit se terminer par </svg>");
assert(svg.includes("viewBox="), "viewBox manquant");
assert(svg.includes("<symbol id=\"blk-FRAME_"), "symbole frame manquant");
assert(svg.includes("<use href=\"#blk-AGCP\""), "insertion AGCP manquante");
assert(svg.includes("Schéma unifilaire"), "titre cartouche manquant");
assert(svg.includes("<text"), "au moins un <text> attendu");

if (fail === 0) console.log("\n✓ FR-DEMO SVG : tous les contrôles passent.");
else { console.error(`\n✗ ${fail} erreurs`); process.exit(1); }
