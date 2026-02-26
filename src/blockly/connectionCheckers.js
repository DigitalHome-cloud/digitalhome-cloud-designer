/**
 * connectionCheckers.js
 *
 * Enforces nesting rules for SmartHome design blocks.
 * These are soft checks — the toolbox generator sets basic connection type
 * checks via previousStatement/check, but this module provides additional
 * validation beyond what Blockly's built-in type checking supports.
 *
 * Nesting rules:
 *   - Floor → Space children (via hasSpace)
 *   - Space → Equipment children (via hasEquipment)
 *   - DistributionBoard → Circuit children (via hasCircuit)
 *   - Circuit → Equipment + ProtectionDevice children
 */

/**
 * Validate that a block is in a valid parent context.
 * Returns an array of { message, severity } objects.
 * @param {Blockly.Block} block
 * @returns {Array<{ message: string, severity: string }>}
 */
export function checkBlockContext(block) {
  const issues = [];
  const type = block.type;
  const parent = block.getParent();

  // Equipment blocks should be inside a Space (spatial) or Circuit (electrical)
  const equipmentTypes = [
    "dhc_socket",
    "dhc_switch",
    "dhc_light",
    "dhc_heater",
    "dhc_equipment",
  ];

  if (equipmentTypes.includes(type) && parent) {
    const parentType = parent.type;
    const validParents = ["dhc_space", "dhc_circuit"];
    if (!validParents.includes(parentType)) {
      issues.push({
        message: `${getLabel(block)} should be inside a Space or Circuit, not ${getLabel(parent)}.`,
        severity: "warning",
      });
    }
  }

  // ProtectionDevice should be inside a Circuit
  if (type === "dhc_protection_device" && parent) {
    if (parent.type !== "dhc_circuit") {
      issues.push({
        message: `${getLabel(block)} should be attached to a Circuit.`,
        severity: "warning",
      });
    }
  }

  // Circuit should be inside a DistributionBoard
  if (type === "dhc_circuit" && parent) {
    if (parent.type !== "dhc_distribution_board") {
      issues.push({
        message: `${getLabel(block)} should be inside a Distribution Board.`,
        severity: "warning",
      });
    }
  }

  // Space should be inside a Floor or Area
  if (type === "dhc_space" && parent) {
    if (parent.type !== "dhc_floor" && parent.type !== "dhc_area") {
      issues.push({
        message: `${getLabel(block)} should be inside a Floor or Area.`,
        severity: "warning",
      });
    }
  }

  return issues;
}

function getLabel(block) {
  return block.getFieldValue("LABEL") || block.type.replace("dhc_", "").replace(/_/g, " ");
}
