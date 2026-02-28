/**
 * NF C 15-100 Validation Engine
 *
 * Runs all NF C 15-100 rules against the Blockly workspace and returns
 * an array of violations: [{ severity, message, blockId, ruleId }]
 */

import { validateMaxPointsPerCircuit } from "./rules/maxPointsPerCircuit";
import { validateProtectionDeviceSizing } from "./rules/protectionDeviceSizing";
import { validateWireCrossSection } from "./rules/wireCrossSection";
import { validateDeliveryChain } from "./rules/deliveryChain";

const RULES = [
  validateMaxPointsPerCircuit,
  validateProtectionDeviceSizing,
  validateWireCrossSection,
  validateDeliveryChain,
];

/**
 * Validate the workspace against all NF C 15-100 rules.
 * @param {Blockly.Workspace} workspace
 * @returns {Array<{ severity: string, message: string, blockId: string, ruleId: string }>}
 */
export function validateWorkspace(workspace) {
  if (!workspace) return [];

  const violations = [];

  for (const rule of RULES) {
    try {
      const results = rule(workspace);
      violations.push(...results);
    } catch (err) {
      console.error("[Validation] Rule failed:", err);
    }
  }

  return violations;
}
