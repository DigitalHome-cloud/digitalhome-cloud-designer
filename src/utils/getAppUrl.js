/**
 * getAppUrl.js — Environment namespace routing
 *
 * Detects the current environment (DEV / STAGE / PROD) from
 * window.location.hostname and returns the correct URL for the
 * target app within the same namespace.
 *
 * Duplicated across portal, designer, modeler (no shared package).
 */

const APP_PORTS = {
  portal: 8000,
  designer: 8001,
  modeler: 8002,
};

const APP_HOSTS = {
  portal: "portal.digitalhome.cloud",
  designer: "designer.digitalhome.cloud",
  modeler: "modeler.digitalhome.cloud",
};

/**
 * Detect environment namespace from the current hostname.
 * @returns {"dev"|"stage"|"prod"}
 */
function detectNamespace() {
  if (typeof window === "undefined") return "prod";
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") return "dev";
  if (hostname.startsWith("stage-")) return "stage";
  return "prod";
}

/**
 * Get the URL for a target app, staying within the same namespace.
 * @param {string} appName — "portal", "designer", or "modeler"
 * @returns {string} — base URL (no trailing slash)
 */
export function getAppUrl(appName) {
  const ns = detectNamespace();

  switch (ns) {
    case "dev":
      return `http://localhost:${APP_PORTS[appName]}`;
    case "stage":
      return `https://stage-${APP_HOSTS[appName]}`;
    default:
      return `https://${APP_HOSTS[appName]}`;
  }
}
