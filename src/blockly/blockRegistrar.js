/**
 * blockRegistrar.js
 *
 * Takes an array of Blockly block definition JSON objects (from blockly-blocks.json)
 * and registers each as a Blockly block type.
 */
import * as Blockly from "blockly";
import { initBlockTypeMap } from "./aboxSerializer";

let registered = false;

/**
 * Register all block definitions from the generated JSON.
 * Safe to call multiple times — only registers once.
 * @param {Array} blockDefs — array of block definition objects from blockly-blocks.json
 * @returns {{ successCount: number, failCount: number, errors: Array }}
 */
export function registerBlocks(blockDefs) {
  if (registered) return { successCount: 0, failCount: 0, errors: [] };
  if (!blockDefs || !Array.isArray(blockDefs)) return { successCount: 0, failCount: 0, errors: [] };

  let successCount = 0;
  let failCount = 0;
  const errors = [];

  for (const def of blockDefs) {
    if (Blockly.Blocks[def.type]) {
      successCount++;
      continue; // already registered
    }

    try {
      Blockly.Blocks[def.type] = {
        init: function () {
          this.jsonInit(def);
        },
      };
      successCount++;
    } catch (err) {
      failCount++;
      errors.push({ type: def.type, error: err.message });
      console.error(`[DHC] Failed to register block "${def.type}":`, err.message);
    }
  }

  // Build the block type → ontology class lookup map for A-Box serialization
  initBlockTypeMap(blockDefs);

  registered = true;

  if (failCount > 0) {
    console.warn(`[DHC] Block registration: ${successCount} ok, ${failCount} failed`);
  } else {
    console.log(`[DHC] Registered ${successCount} dynamic block types`);
  }

  return { successCount, failCount, errors };
}

/**
 * Reset the registration flag (useful for testing / hot reload).
 */
export function resetBlockRegistration() {
  registered = false;
}
