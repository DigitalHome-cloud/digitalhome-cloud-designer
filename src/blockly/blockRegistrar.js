/**
 * blockRegistrar.js
 *
 * Takes an array of Blockly block definition JSON objects (from blockly-blocks.json)
 * and registers each as a Blockly block type.
 */
import * as Blockly from "blockly";

let registered = false;

/**
 * Register all block definitions from the generated JSON.
 * Safe to call multiple times — only registers once.
 * @param {Array} blockDefs — array of block definition objects from blockly-blocks.json
 */
export function registerBlocks(blockDefs) {
  if (registered) return;
  if (!blockDefs || !Array.isArray(blockDefs)) return;

  for (const def of blockDefs) {
    if (Blockly.Blocks[def.type]) continue; // already registered

    Blockly.Blocks[def.type] = {
      init: function () {
        this.jsonInit(def);
      },
    };
  }

  registered = true;
  console.log(`[DHC] Registered ${blockDefs.length} dynamic block types`);
}

/**
 * Reset the registration flag (useful for testing / hot reload).
 */
export function resetBlockRegistration() {
  registered = false;
}
