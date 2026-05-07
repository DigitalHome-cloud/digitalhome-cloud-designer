/**
 * S3 utilities for fetching/saving design artifacts and toolbox definitions.
 * Uses Amplify Storage v6 (uploadData, downloadData, getUrl).
 *
 * Tenant data path scheme (audit finding C-2):
 *   - Demo SmartHomes (DE-DEMO-01, FR-DEMO-01, BE-DEMO-01):
 *       public/smarthomes/{demoId}/design/...
 *     Any authenticated user can read+write — intentional, demo data is shared
 *     and reset by admins if vandalized.
 *   - Real SmartHomes:
 *       private/{cognito-identity-id}/smarthomes/{realId}/design/...
 *     Owner-only access at the IAM level. Single-owner-per-home is the working
 *     v1 assumption. When multi-owner ships, replace direct uploadData /
 *     downloadData calls below with AppSync mutation calls that return signed
 *     URLs (the architecture ADR-0010 originally promised).
 *
 * Ontology / toolbox paths stay under public/ontology/... — those are
 * intentionally world-readable across all tenants.
 */
import { uploadData, downloadData, getUrl } from "aws-amplify/storage";
import { isDemoSmartHome } from "../context/SmartHomeContext";

const S3_PREFIX_ONTOLOGY = "ontology";
const S3_PREFIX_SMARTHOMES = "smarthomes";

/**
 * Returns the S3 path for a design artifact, choosing the public/private
 * split based on whether the SmartHome is a demo. For real homes we return
 * a path-resolver function so Amplify Storage v6 can substitute the caller's
 * Cognito Identity ID at upload/download time.
 */
function designPath(smartHomeId, fileName) {
  if (isDemoSmartHome(smartHomeId)) {
    return `public/${S3_PREFIX_SMARTHOMES}/${smartHomeId}/design/${fileName}`;
  }
  return ({ identityId }) =>
    `private/${identityId}/${S3_PREFIX_SMARTHOMES}/${smartHomeId}/design/${fileName}`;
}

/**
 * Fetch Blockly toolbox definitions (blocks + toolbox config) from S3.
 * Always public — the compiled toolbox is shared across all tenants.
 * @param {string} version — ontology version (e.g. "1.0.0") or "latest"
 */
export async function fetchToolboxFromS3(version = "latest") {
  const prefix = `${S3_PREFIX_ONTOLOGY}/${version === "latest" ? "latest" : `v${version}`}`;

  try {
    const [blocksResult, toolboxResult] = await Promise.all([
      downloadData({ path: `public/${prefix}/blockly-blocks.json` }).result,
      downloadData({ path: `public/${prefix}/blockly-toolbox.json` }).result,
    ]);

    const blocksJson = await blocksResult.body.text();
    const toolboxJson = await toolboxResult.body.text();

    return {
      blocks: JSON.parse(blocksJson),
      toolbox: JSON.parse(toolboxJson),
    };
  } catch (err) {
    console.warn("[S3] Failed to fetch toolbox from S3, will use local fallback:", err.message);
    return null;
  }
}

/**
 * Fetch a saved design workspace from S3.
 * @param {string} smartHomeId
 */
export async function fetchDesignFromS3(smartHomeId) {
  try {
    const result = await downloadData({
      path: designPath(smartHomeId, "workspace.json"),
    }).result;
    const json = await result.body.text();
    return JSON.parse(json);
  } catch (err) {
    console.warn("[S3] No saved design found for", smartHomeId, err.message);
    return null;
  }
}

/**
 * Save design artifacts to S3.
 * @param {string} smartHomeId
 * @param {{ workspaceJson: object, aboxTtl: string, aboxJson: object }} artifacts
 */
export async function saveDesignToS3(smartHomeId, { workspaceJson, aboxTtl, aboxJson }) {
  await Promise.all([
    uploadData({
      path: designPath(smartHomeId, "workspace.json"),
      data: JSON.stringify(workspaceJson, null, 2),
      options: { contentType: "application/json" },
    }).result,
    uploadData({
      path: designPath(smartHomeId, "abox.ttl"),
      data: aboxTtl,
      options: { contentType: "text/turtle" },
    }).result,
    uploadData({
      path: designPath(smartHomeId, "abox.json"),
      data: JSON.stringify(aboxJson, null, 2),
      options: { contentType: "application/json" },
    }).result,
  ]);
}

/**
 * Fetch the A-Box JSON for the 3D viewer.
 * @param {string} smartHomeId
 */
export async function fetchABoxFromS3(smartHomeId) {
  try {
    const result = await downloadData({
      path: designPath(smartHomeId, "abox.json"),
    }).result;
    const json = await result.body.text();
    return JSON.parse(json);
  } catch (err) {
    console.warn("[S3] No A-Box data found for", smartHomeId, err.message);
    return null;
  }
}
