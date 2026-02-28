/**
 * NFC 14-100: Delivery chain validation
 *
 * If any NFC 14-100 module blocks are present, validates the
 * electrical delivery chain completeness:
 *   - EnergyDelivery must exist
 *   - NF14EnergyMeter must exist
 *   - NF14EmergencyDisconnect must exist
 *   - At least one DistributionBoard must exist
 */

export function validateDeliveryChain(workspace) {
  const violations = [];
  const allBlocks = workspace.getAllBlocks(false);

  // Check if any NFC 14-100 blocks are present
  const nfc14100Blocks = allBlocks.filter((b) =>
    b.type.startsWith("dhc_nfc14100_")
  );

  if (nfc14100Blocks.length === 0) {
    return violations;
  }

  // Check for required delivery chain components
  const hasEnergyDelivery = allBlocks.some(
    (b) => b.type === "dhc_energy_delivery"
  );
  const hasNF14Meter = allBlocks.some(
    (b) => b.type === "dhc_nfc14100_nf14_energy_meter"
  );
  const hasNF14Disconnect = allBlocks.some(
    (b) => b.type === "dhc_nfc14100_nf14_emergency_disconnect"
  );
  const hasDistributionBoard = allBlocks.some(
    (b) => b.type === "dhc_distribution_board"
  );

  if (!hasEnergyDelivery) {
    violations.push({
      severity: "error",
      message:
        "NFC 14-100 delivery chain incomplete: Energy Delivery block is required.",
      blockId: nfc14100Blocks[0].id,
      ruleId: "nfc14100-delivery-chain",
    });
  }

  if (!hasNF14Meter) {
    violations.push({
      severity: "error",
      message:
        "NFC 14-100 delivery chain incomplete: NF14 Energy Meter is required.",
      blockId: nfc14100Blocks[0].id,
      ruleId: "nfc14100-delivery-chain",
    });
  }

  if (!hasNF14Disconnect) {
    violations.push({
      severity: "error",
      message:
        "NFC 14-100 delivery chain incomplete: NF14 Emergency Disconnect is required.",
      blockId: nfc14100Blocks[0].id,
      ruleId: "nfc14100-delivery-chain",
    });
  }

  if (!hasDistributionBoard) {
    violations.push({
      severity: "error",
      message:
        "NFC 14-100 delivery chain incomplete: Distribution Board is required.",
      blockId: nfc14100Blocks[0].id,
      ruleId: "nfc14100-delivery-chain",
    });
  }

  return violations;
}
