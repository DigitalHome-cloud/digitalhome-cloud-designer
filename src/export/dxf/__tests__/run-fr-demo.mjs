#!/usr/bin/env node
/**
 * Génère le schéma unifilaire FR-DEMO depuis la fixture Blockly.
 *
 *   node src/export/dxf/__tests__/run-fr-demo.mjs
 *
 * Sortie : /tmp/dhc-test-fr-demo-unifilaire.dxf
 */
import { register } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
register("./loader.mjs", pathToFileURL(here + "/"));
await import(pathToFileURL(path.join(here, "generate-fr-demo.mjs")).href);
