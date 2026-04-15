/**
 * ESM resolver hook: lets Node resolve extensionless relative imports
 * the same way webpack/Gatsby does (append `.js`, or `/index.js`).
 * Registered by run.mjs so the test script can import real source files.
 */
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.[cm]?js$/.test(specifier)) {
    const parent = context.parentURL ? new URL(context.parentURL) : null;
    if (parent) {
      const asFile = new URL(specifier + ".js", parent);
      if (safeExists(asFile)) return nextResolve(specifier + ".js", context);
      const asIndex = new URL(specifier + "/index.js", parent);
      if (safeExists(asIndex)) return nextResolve(specifier + "/index.js", context);
    }
  }
  return nextResolve(specifier, context);
}

function safeExists(url) {
  try { return existsSync(fileURLToPath(url)) && statSync(fileURLToPath(url)).isFile(); }
  catch { return false; }
}
