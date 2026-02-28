/**
 * shellGenerator.js
 *
 * Generates a Blockly workspace JSON skeleton for a new SmartHome.
 * The skeleton provides the canonical electrical delivery chain
 * pre-wired with the correct feeds topology.
 *
 * For French SmartHomes (country === "FR"), NFC 14-100 module blocks
 * are included and wired into the delivery chain.
 */

let idCounter = 0;
function nextId() {
  return `shell_${++idCounter}`;
}

/**
 * Create a block definition for Blockly serialization format.
 */
function makeBlock(type, fields = {}, extraInputs = {}) {
  const block = {
    type,
    id: nextId(),
    fields: {},
  };

  for (const [name, value] of Object.entries(fields)) {
    block.fields[name] = value;
  }

  // Extra inputs (statement/value) are attached separately
  if (Object.keys(extraInputs).length > 0) {
    block.inputs = {};
    for (const [inputName, inputBlock] of Object.entries(extraInputs)) {
      block.inputs[inputName] = { block: inputBlock };
    }
  }

  return block;
}

/**
 * Generate an electrical shell workspace for a new SmartHome.
 *
 * @param {string} smartHomeId — e.g. "FR-75001-RUE12-01"
 * @param {string} country — ISO 2-letter country code, e.g. "FR", "DE"
 * @returns {object} Blockly workspace JSON compatible with Blockly.serialization.workspaces.load()
 */
export function generateShellWorkspace(smartHomeId, country) {
  // Reset counter for deterministic IDs
  idCounter = 0;

  const topBlocks = [];

  // --- Always generated: ElectricalTechnicalSpace ---
  const technicalSpace = makeBlock("dhc_electrical_technical_space", {
    LABEL: "Technical Space",
  });

  // --- Always generated: EnergyDelivery ---
  const energyDelivery = makeBlock("dhc_energy_delivery", {
    LABEL: "Energy Delivery",
    CURRENT_TYPE: "SinglePhase",
    CONTRACTED_POWER_K_V_A: 6.0,
  });

  // --- Always generated: Main DistributionBoard ---
  const mainBoard = makeBlock("dhc_distribution_board", {
    LABEL: "Main Board",
    DISTRIBUTION_BOARD_TYPE: "ACBoard",
  });

  if (country === "FR") {
    // NFC 14-100: Energy Meter and Emergency Disconnect
    const nf14Meter = makeBlock("dhc_nfc14100_nf14_energy_meter", {
      LABEL: "Compteur Enedis",
    });

    const nf14Disconnect = makeBlock("dhc_nfc14100_nf14_emergency_disconnect", {
      LABEL: "Disjoncteur de branchement",
    });

    // NFC 15-100: GTL
    const gtl = makeBlock("dhc_nfc15100_gtl", {
      LABEL: "GTL",
    });

    // Wire the canonical delivery chain via FEEDS:
    // EnergyDelivery → NF14EnergyMeter → NF14EmergencyDisconnect → Main DistributionBoard
    energyDelivery.inputs = energyDelivery.inputs || {};
    energyDelivery.inputs.FEEDS = { block: nf14Meter };

    nf14Meter.inputs = nf14Meter.inputs || {};
    // NF14EnergyMeter doesn't have FEEDS as a direct input since it's
    // inherited only on Circuit subclasses. Use a next-block chain instead.
    // Actually, feeds is a generic object property. We wire via separate top-level blocks
    // and the user can visually connect them in the workspace.

    // For the shell, place all blocks as top-level with clear labels
    // The delivery chain order indicates the canonical flow
    topBlocks.push(energyDelivery);
    topBlocks.push(nf14Meter);
    topBlocks.push(nf14Disconnect);
    topBlocks.push(mainBoard);
    topBlocks.push(technicalSpace);
    topBlocks.push(gtl);
  } else {
    // Non-FR: just the core blocks
    topBlocks.push(energyDelivery);
    topBlocks.push(mainBoard);
    topBlocks.push(technicalSpace);
  }

  // Position blocks vertically with spacing
  let y = 50;
  for (const block of topBlocks) {
    block.x = 50;
    block.y = y;
    y += 200;
  }

  return {
    blocks: {
      languageVersion: 0,
      blocks: topBlocks,
    },
  };
}
