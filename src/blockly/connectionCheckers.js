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
 * Check if a block type is a Circuit subclass (Core or NFC module circuit).
 */
function isCircuitType(type) {
  return type === "dhc_circuit" || type.startsWith("dhc_nfc15100_");
}

/**
 * Check if a block type is an ElectricalTechnicalSpace subclass.
 */
function isElectricalTechnicalSpaceType(type) {
  return type === "dhc_electrical_technical_space" || type.startsWith("dhc_nfc15100_gtl");
}

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
    // Also allow NFC module circuit types as valid parents
    if (!validParents.includes(parentType) && !isCircuitType(parentType)) {
      issues.push({
        message: `${getLabel(block)} should be inside a Space or Circuit, not ${getLabel(parent)}.`,
        severity: "warning",
      });
    }
  }

  // ProtectionDevice should be inside a Circuit (Core or NFC module)
  if (type === "dhc_protection_device" && parent) {
    if (!isCircuitType(parent.type)) {
      issues.push({
        message: `${getLabel(block)} should be attached to a Circuit.`,
        severity: "warning",
      });
    }
  }

  // Circuit (Core or NFC module) should be inside a DistributionBoard
  if (isCircuitType(type) && parent) {
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

  // ElectricalTechnicalSpace / GTL can be inside Floor, Area, or Space
  if (isElectricalTechnicalSpaceType(type) && parent) {
    const validParents = ["dhc_floor", "dhc_area", "dhc_space"];
    if (!validParents.includes(parent.type)) {
      issues.push({
        message: `${getLabel(block)} should be inside a Floor, Area, or Space.`,
        severity: "warning",
      });
    }
  }

  return issues;
}

function getLabel(block) {
  return block.getFieldValue("LABEL") || block.type.replace("dhc_", "").replace(/_/g, " ");
}
