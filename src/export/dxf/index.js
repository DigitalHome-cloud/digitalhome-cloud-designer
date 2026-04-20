/**
 * Public API for the NF C 15-100 DXF export module.
 *
 * v1 ships `exportUnifilaire`. Panel layout and architectural diagrams
 * follow the same signature: (input) => string (DXF text).
 */

import { aboxToUnifilaireInput } from "./fromAbox";
import { renderUnifilaire, renderUnifilaireSvg } from "./unifilaire";
import { buildDxfLibrary } from "./library/buildLibrary";

export { aboxToUnifilaireInput, renderUnifilaire, renderUnifilaireSvg, buildDxfLibrary };
export * from "./library";

export function exportUnifilaire(input) {
  return renderUnifilaire(input);
}

export function exportUnifilaireFromAbox(aboxJson, smartHomeId) {
  return renderUnifilaire(aboxToUnifilaireInput(aboxJson, smartHomeId));
}

export function exportUnifilaireSvg(input) {
  return renderUnifilaireSvg(input);
}

export function exportUnifilaireFromAboxSvg(aboxJson, smartHomeId) {
  return renderUnifilaireSvg(aboxToUnifilaireInput(aboxJson, smartHomeId));
}

export function exportLibrary(opts) {
  return buildDxfLibrary(opts);
}

export function downloadDxf(dxfText, filename) {
  if (typeof window === "undefined") return;
  const blob = new Blob([dxfText], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
