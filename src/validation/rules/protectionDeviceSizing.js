/**
 * NF C 15-100: Protection device sizing
 * - Lighting circuits: 10A breaker
 * - Socket circuits: 16A breaker
 * - Dedicated circuits: 20A or 32A (based on equipment)
 *
 * Checks that the protection device rating matches the circuit's equipment type.
 */

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

const EXPECTED_RATINGS = {
  lighting: 10,
  sockets: 16,
  dedicated: 20, // 20 or 32 — we check >= 20
};

export function validateProtectionDeviceSizing(workspace) {
  const violations = [];
  const allBlocks = workspace.getAllBlocks(false);

  const circuits = allBlocks.filter((b) => b.type === "dhc_circuit");

  for (const circuit of circuits) {
    const circuitLabel = circuit.getFieldValue("LABEL") || "unnamed";
    const circuitType = inferCircuitType(circuit);

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

    const ratedCurrent = Number(protectionDevice.getFieldValue("RATED_CURRENT")) || 0;

    if (circuitType === "lighting" && ratedCurrent > 10) {
      violations.push({
        severity: "error",
        message: `Circuit "${circuitLabel}" (lighting) has ${ratedCurrent}A breaker, max 10A required.`,
        blockId: protectionDevice.id,
        ruleId: "nfc15100-protection-sizing",
      });
    } else if (circuitType === "sockets" && ratedCurrent > 16) {
      violations.push({
        severity: "error",
        message: `Circuit "${circuitLabel}" (sockets) has ${ratedCurrent}A breaker, max 16A required.`,
        blockId: protectionDevice.id,
        ruleId: "nfc15100-protection-sizing",
      });
    } else if (circuitType === "dedicated" && ratedCurrent < 20) {
      violations.push({
        severity: "warning",
        message: `Circuit "${circuitLabel}" (dedicated) has ${ratedCurrent}A breaker, typically needs 20A or 32A.`,
        blockId: protectionDevice.id,
        ruleId: "nfc15100-protection-sizing",
      });
    }
  }

  return violations;
}
