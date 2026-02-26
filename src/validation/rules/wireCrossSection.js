/**
 * NF C 15-100: Wire cross-section rules
 * - 1.5mm² for 10A circuits (lighting)
 * - 2.5mm² for 16–20A circuits (sockets, dedicated)
 * - 6mm² for 32A circuits (heavy dedicated: oven, EV charger)
 */

const CURRENT_TO_CROSS_SECTION = [
  { maxCurrent: 10, minCrossSection: 1.5 },
  { maxCurrent: 20, minCrossSection: 2.5 },
  { maxCurrent: 32, minCrossSection: 6 },
];

export function validateWireCrossSection(workspace) {
  const violations = [];
  const allBlocks = workspace.getAllBlocks(false);

  const circuits = allBlocks.filter((b) => b.type === "dhc_circuit");

  for (const circuit of circuits) {
    const circuitLabel = circuit.getFieldValue("LABEL") || "unnamed";

    // Find protection device to get rated current
    let protectionDevice = null;
    for (const input of circuit.inputList) {
      if (input.name === "HASPROTECTION") {
        protectionDevice = input.connection?.targetBlock();
        break;
      }
    }

    if (!protectionDevice) continue;

    const ratedCurrent = Number(protectionDevice.getFieldValue("RATED_CURRENT")) || 0;

    // Find wiring segments
    for (const input of circuit.inputList) {
      if (input.name === "HASWIRING") {
        let wiring = input.connection?.targetBlock();
        while (wiring) {
          const crossSection = Number(wiring.getFieldValue("CROSS_SECTION")) || 0;

          if (crossSection > 0 && ratedCurrent > 0) {
            // Find minimum required cross section for this current
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
