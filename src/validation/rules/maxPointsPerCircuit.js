/**
 * NF C 15-100: Max points per circuit
 * - Lighting circuits: max 8 points
 * - Socket circuits: max 8 points
 * - Dedicated circuits: 1 point
 *
 * Supports both Core Circuit blocks and NFC 15-100 module circuit subclasses.
 */

function isCircuitBlock(block) {
  return block.type === "dhc_circuit" || block.type.startsWith("dhc_nfc15100_");
}

export function validateMaxPointsPerCircuit(workspace) {
  const violations = [];
  const allBlocks = workspace.getAllBlocks(false);

  const circuits = allBlocks.filter(isCircuitBlock);

  for (const circuit of circuits) {
    const maxPoints = Number(circuit.getFieldValue("MAX_POINTS")) || 8;

    // Count equipment children in the feedsEquipment statement input
    let equipmentCount = 0;
    for (const input of circuit.inputList) {
      if (input.name === "FEEDSEQUIPMENT") {
        let child = input.connection?.targetBlock();
        while (child) {
          equipmentCount++;
          child = child.getNextBlock();
        }
      }
    }

    if (equipmentCount > maxPoints) {
      violations.push({
        severity: "error",
        message: `Circuit "${circuit.getFieldValue("LABEL") || "unnamed"}" has ${equipmentCount} points but max is ${maxPoints}.`,
        blockId: circuit.id,
        ruleId: "nfc15100-max-points",
      });
    }
  }

  return violations;
}
