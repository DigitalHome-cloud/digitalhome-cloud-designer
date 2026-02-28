/**
 * NF C 15-100: Protection device sizing
 * - Lighting circuits: 10A breaker
 * - Socket circuits: 16A breaker
 * - Dedicated circuits: 20A or 32A (based on equipment)
 *
 * For NFC 15-100 module circuit blocks, the mandated ratedCurrent is
 * pre-filled as a field on the circuit block itself — validate that
 * the attached protection device matches.
 */

function isCircuitBlock(block) {
  return block.type === "dhc_circuit" || block.type.startsWith("dhc_nfc15100_");
}

function inferCircuitType(circuit) {
  // Look at the equipment children to infer circuit type
  const equipmentTypes = new Set();
  for (const input of circuit.inputList) {
    if (input.name === "FEEDSEQUIPMENT") {
      let child = input.connection?.targetBlock();
      while (child) {
        equipmentTypes.add(child.type);
        child = child.getNextBlock();
      }
    }
  }

  if (equipmentTypes.has("dhc_light")) return "lighting";
  if (equipmentTypes.has("dhc_socket")) return "sockets";
  if (equipmentTypes.has("dhc_heater")) return "dedicated";
  if (equipmentTypes.size === 1) return "dedicated";
  return "mixed";
}

export function validateProtectionDeviceSizing(workspace) {
  const violations = [];
  const allBlocks = workspace.getAllBlocks(false);

  const circuits = allBlocks.filter(isCircuitBlock);

  for (const circuit of circuits) {
    const circuitLabel = circuit.getFieldValue("LABEL") || "unnamed";

    // Find attached protection device
    let protectionDevice = null;
    for (const input of circuit.inputList) {
      if (input.name === "HASPROTECTION") {
        protectionDevice = input.connection?.targetBlock();
        break;
      }
    }

    if (!protectionDevice) {
      violations.push({
        severity: "warning",
        message: `Circuit "${circuitLabel}" has no protection device.`,
        blockId: circuit.id,
        ruleId: "nfc15100-protection-missing",
      });
      continue;
    }

    const protectionRating = Number(protectionDevice.getFieldValue("RATED_CURRENT")) || 0;

    // NFC 15-100 module circuits have mandated ratedCurrent as a direct field
    if (circuit.type.startsWith("dhc_nfc15100_")) {
      const mandatedRating = Number(circuit.getFieldValue("RATED_CURRENT")) || 0;
      if (mandatedRating > 0 && protectionRating !== mandatedRating) {
        violations.push({
          severity: "error",
          message: `Circuit "${circuitLabel}" requires ${mandatedRating}A protection, but has ${protectionRating}A.`,
          blockId: protectionDevice.id,
          ruleId: "nfc15100-protection-sizing",
        });
      }
    } else {
      // Core Circuit: infer type from equipment children
      const circuitType = inferCircuitType(circuit);

      if (circuitType === "lighting" && protectionRating > 10) {
        violations.push({
          severity: "error",
          message: `Circuit "${circuitLabel}" (lighting) has ${protectionRating}A breaker, max 10A required.`,
          blockId: protectionDevice.id,
          ruleId: "nfc15100-protection-sizing",
        });
      } else if (circuitType === "sockets" && protectionRating > 16) {
        violations.push({
          severity: "error",
          message: `Circuit "${circuitLabel}" (sockets) has ${protectionRating}A breaker, max 16A required.`,
          blockId: protectionDevice.id,
          ruleId: "nfc15100-protection-sizing",
        });
      } else if (circuitType === "dedicated" && protectionRating < 20) {
        violations.push({
          severity: "warning",
          message: `Circuit "${circuitLabel}" (dedicated) has ${protectionRating}A breaker, typically needs 20A or 32A.`,
          blockId: protectionDevice.id,
          ruleId: "nfc15100-protection-sizing",
        });
      }
    }
  }

  return violations;
}
