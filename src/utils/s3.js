/**
 * S3 utilities for fetching/saving design artifacts and toolbox definitions.
 * Uses Amplify Storage v6 (uploadData, downloadData, getUrl).
 */
import { uploadData, downloadData, getUrl } from "aws-amplify/storage";

const S3_PREFIX_ONTOLOGY = "ontology";
const S3_PREFIX_SMARTHOMES = "smarthomes";

/**
 * Fetch Blockly toolbox definitions (blocks + toolbox config) from S3.
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
  const prefix = `public/${S3_PREFIX_SMARTHOMES}/${smartHomeId}/design`;

  try {
    const result = await downloadData({ path: `${prefix}/workspace.json` }).result;
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
  const prefix = `public/${S3_PREFIX_SMARTHOMES}/${smartHomeId}/design`;

  await Promise.all([
    uploadData({
      path: `${prefix}/workspace.json`,
      data: JSON.stringify(workspaceJson, null, 2),
      options: { contentType: "application/json" },
    }).result,
    uploadData({
      path: `${prefix}/abox.ttl`,
      data: aboxTtl,
      options: { contentType: "text/turtle" },
    }).result,
    uploadData({
      path: `${prefix}/abox.json`,
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
  const prefix = `public/${S3_PREFIX_SMARTHOMES}/${smartHomeId}/design`;

  try {
    const result = await downloadData({ path: `${prefix}/abox.json` }).result;
    const json = await result.body.text();
    return JSON.parse(json);
  } catch (err) {
    console.warn("[S3] No A-Box data found for", smartHomeId, err.message);
    return null;
  }
}
