#!/usr/bin/env node
import { register } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
register("./loader.mjs", pathToFileURL(here + "/"));
await import(pathToFileURL(path.join(here, "generate-devoir1.mjs")).href);
