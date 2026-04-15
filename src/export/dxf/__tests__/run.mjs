#!/usr/bin/env node
/**
 * Point d'entrée du test.
 * Enregistre le resolver ESM (loader.mjs) puis lance generate-samples.mjs.
 * Usage :
 *   node src/export/dxf/__tests__/run.mjs
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
register("./loader.mjs", pathToFileURL(here + "/"));
await import(pathToFileURL(path.join(here, "generate-samples.mjs")).href);
