/**
 * NF C 15-100: Wire cross-section rules
 * - 1.5mm² for 10A/16A circuits (lighting)
 * - 2.5mm² for 16–20A circuits (sockets, dedicated)
 * - 6mm² for 32A circuits (heavy dedicated: oven, EV charger)
 * - 10mm² for 40A circuits (IRVE, large floor heating)
 *
 * For NFC 15-100 module circuit blocks, the mandated cross-section is
 * pre-filled as a CROSS_SECTION field on the circuit block itself.
 */

const CURRENT_TO_CROSS_SECTION = [
  { maxCurrent: 10, minCrossSection: 1.5 },
  { maxCurrent: 16, minCrossSection: 1.5 },
  { maxCurrent: 20, minCrossSection: 2.5 },
  { maxCurrent: 25, minCrossSection: 4 },
  { maxCurrent: 32, minCrossSection: 6 },
  { maxCurrent: 40, minCrossSection: 10 },
  { maxCurrent: 50, minCrossSection: 16 },
];

function isCircuitBlock(block) {
  return block.type === "dhc_circuit" || block.type.startsWith("dhc_nfc15100_");
}

export function validateWireCrossSection(workspace) {
  const violations = [];
  const allBlocks = workspace.getAllBlocks(false);

  const circuits = allBlocks.filter(isCircuitBlock);

  for (const circuit of circuits) {
    const circuitLabel = circuit.getFieldValue("LABEL") || "unnamed";

    // NFC 15-100 module circuits have mandated cross-section as a direct field
    if (circuit.type.startsWith("dhc_nfc15100_")) {
      const mandatedCrossSection = Number(circuit.getFieldValue("CROSS_SECTION")) || 0;
      const mandatedRating = Number(circuit.getFieldValue("RATED_CURRENT")) || 0;

      if (mandatedCrossSection > 0 && mandatedRating > 0) {
        const rule = CURRENT_TO_CROSS_SECTION.find(
          (r) => mandatedRating <= r.maxCurrent
        );
        if (rule && mandatedCrossSection < rule.minCrossSection) {
          violations.push({
            severity: "error",
            message: `Circuit "${circuitLabel}": ${mandatedCrossSection}mm² wire insufficient for ${mandatedRating}A, needs at least ${rule.minCrossSection}mm².`,
            blockId: circuit.id,
            ruleId: "nfc15100-wire-cross-section",
          });
        }
      }
      continue;
    }

    // Core Circuit: check wiring segments against protection device rating
    let protectionDevice = null;
    for (const input of circuit.inputList) {
      if (input.name === "HASPROTECTION") {
        protectionDevice = input.connection?.targetBlock();
        break;
      }
    }

    if (!protectionDevice) continue;

    const ratedCurrent = Number(protectionDevice.getFieldValue("RATED_CURRENT")) || 0;

    for (const input of circuit.inputList) {
      if (input.name === "HASWIRING") {
        let wiring = input.connection?.targetBlock();
        while (wiring) {
          const crossSection = Number(wiring.getFieldValue("CROSS_SECTION")) || 0;

          if (crossSection > 0 && ratedCurrent > 0) {
            const rule = CURRENT_TO_CROSS_SECTION.find(
              (r) => ratedCurrent <= r.maxCurrent
            );

            if (rule && crossSection < rule.minCrossSection) {
              violations.push({
                severity: "error",
                message: `Circuit "${circuitLabel}": ${crossSection}mm² wire too small for ${ratedCurrent}A, needs at least ${rule.minCrossSection}mm².`,
                blockId: wiring.id,
                ruleId: "nfc15100-wire-cross-section",
              });
            }
          }

          wiring = wiring.getNextBlock();
        }
      }
    }
  }

  return violations;
}
