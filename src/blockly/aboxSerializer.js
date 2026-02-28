/**
 * aboxSerializer.js
 *
 * Converts a Blockly workspace into A-Box TTL and JSON representations.
 * Instance IRIs: dhc-instance:{smartHomeId}/{blockType}/{blockId}
 */
import * as Blockly from "blockly";

const INPUT_TYPES = Blockly.inputs?.inputTypes || { VALUE: 1, STATEMENT: 3 };
const DHC_NS = "https://digitalhome.cloud/ontology#";
const DHC_NFC14100_NS = "https://digitalhome.cloud/ontology/nfc14100#";
const DHC_NFC15100_NS = "https://digitalhome.cloud/ontology/nfc15100#";
const DHC_INSTANCE_NS = "https://digitalhome.cloud/instance#";

// Module prefix mappings: block type prefix → ontology namespace prefix
const MODULE_PREFIXES = {
  dhc_nfc14100_: "dhc-nfc14100",
  dhc_nfc15100_: "dhc-nfc15100",
};

// Block type → ontology class lookup map, populated from block definitions
const blockTypeClassMap = new Map();

/**
 * Initialize the block type → class map from loaded block definitions.
 * Called once when block definitions are registered.
 */
export function initBlockTypeMap(blockDefs) {
  blockTypeClassMap.clear();
  for (const def of blockDefs) {
    if (def.type && def.ontologyClass) {
      blockTypeClassMap.set(def.type, def.ontologyClass);
    }
  }
}

/**
 * Get the ontology class IRI for a block type.
 * Uses the lookup map populated by initBlockTypeMap(), with a fallback
 * that converts snake_case to PascalCase.
 */
function blockTypeToClass(blockType) {
  if (!blockType.startsWith("dhc_")) return null;

  // Use lookup map if available
  if (blockTypeClassMap.has(blockType)) {
    return blockTypeClassMap.get(blockType);
  }

  // Fallback: convert snake_case to PascalCase
  for (const [prefix, ontPrefix] of Object.entries(MODULE_PREFIXES)) {
    if (blockType.startsWith(prefix)) {
      const localName = blockType
        .replace(prefix, "")
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");
      return `${ontPrefix}:${localName}`;
    }
  }

  const localName = blockType
    .replace("dhc_", "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return `dhc:${localName}`;
}

/**
 * Generate an instance IRI from a block.
 */
function instanceIri(smartHomeId, blockType, blockId) {
  return `dhc-instance:${smartHomeId}/${blockType}/${blockId}`;
}

/**
 * Map a Blockly field name to an ontology datatype property.
 * Field names are UPPER_SNAKE_CASE → camelCase
 */
function fieldToProperty(fieldName) {
  if (fieldName === "LABEL") return "rdfs:label";
  // Convert UPPER_SNAKE to camelCase
  const parts = fieldName.toLowerCase().split("_");
  const camel = parts[0] + parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  return `dhc:${camel}`;
}

/**
 * Map a statement input name to an ontology object property.
 */
function inputToProperty(inputName) {
  // HASSPACE → hasSpace, FEEDSEQUIPMENT → feedsEquipment, etc.
  const parts = inputName.toLowerCase().split("");
  // The input names are like HASSPACE, HASCIRCUIT — just lower the first char
  const lower = inputName.charAt(0).toLowerCase() + inputName.slice(1).toLowerCase();
  // Insert capitals at word boundaries (HAS→has, SPACE→Space)
  const propertyMap = {
    HASAREA: "hasArea",
    HASFLOOR: "hasFloor",
    HASSPACE: "hasSpace",
    HASCIRCUIT: "hasCircuit",
    FEEDSEQUIPMENT: "feedsEquipment",
    HASEQUIPMENT: "hasEquipment",
    HASBUILDINGELEMENT: "hasBuildingElement",
    HASWIRING: "hasWiring",
    BELONGSTOZONE: "belongsToZone",
    HASEQUIPMENTTYPE: "hasEquipmentType",
    HASPROTECTION: "hasProtection",
    HASCIRCUITTYPE: "hasCircuitType",
    CONNECTEDTONETWORK: "connectedToNetwork",
    HASPART: "hasPart",
    FEEDS: "feeds",
    LOCATEDIN: "locatedIn",
  };
  return `dhc:${propertyMap[inputName] || lower}`;
}

/**
 * Serialize workspace to A-Box TTL.
 * @param {Blockly.Workspace} workspace
 * @param {string} smartHomeId
 * @returns {string} TTL string
 */
export function serializeToTTL(workspace, smartHomeId) {
  if (!workspace) return "";

  const lines = [];
  lines.push(`@prefix dhc: <${DHC_NS}> .`);
  lines.push(`@prefix dhc-nfc14100: <${DHC_NFC14100_NS}> .`);
  lines.push(`@prefix dhc-nfc15100: <${DHC_NFC15100_NS}> .`);
  lines.push(`@prefix dhc-instance: <${DHC_INSTANCE_NS}> .`);
  lines.push(`@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .`);
  lines.push(`@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .`);
  lines.push(`@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .`);
  lines.push("");

  const topBlocks = workspace.getTopBlocks(true);

  function processBlock(block) {
    const blockType = block.type;
    const ontologyClass = blockTypeToClass(blockType);
    if (!ontologyClass) return;

    const iri = instanceIri(smartHomeId, blockType, block.id);
    lines.push(`${iri}`);
    lines.push(`  a ${ontologyClass} ;`);

    // Datatype fields
    const fields = block.inputList
      .flatMap((input) => input.fieldRow)
      .filter((f) => f.name && f.name !== "");

    for (const field of fields) {
      const prop = fieldToProperty(field.name);
      const value = field.getValue();
      if (value === undefined || value === null || value === "") continue;

      if (typeof value === "number" || !isNaN(Number(value))) {
        lines.push(`  ${prop} ${value} ;`);
      } else if (typeof value === "boolean" || value === "TRUE" || value === "FALSE") {
        lines.push(`  ${prop} ${String(value).toLowerCase()} ;`);
      } else {
        const escaped = String(value).replace(/"/g, '\\"');
        lines.push(`  ${prop} "${escaped}" ;`);
      }
    }

    // Statement inputs (containment)
    for (const input of block.inputList) {
      if (input.type === INPUT_TYPES.STATEMENT) {
        let child = input.connection?.targetBlock();
        while (child) {
          const childIri = instanceIri(smartHomeId, child.type, child.id);
          const prop = inputToProperty(input.name);
          lines.push(`  ${prop} ${childIri} ;`);
          child = child.getNextBlock();
        }
      }
    }

    // Value inputs (references)
    for (const input of block.inputList) {
      if (input.type === INPUT_TYPES.VALUE) {
        const connected = input.connection?.targetBlock();
        if (connected) {
          const connIri = instanceIri(smartHomeId, connected.type, connected.id);
          const prop = inputToProperty(input.name);
          lines.push(`  ${prop} ${connIri} ;`);
        }
      }
    }

    // Replace last ; with .
    if (lines.length > 0) {
      const lastIdx = lines.length - 1;
      lines[lastIdx] = lines[lastIdx].replace(/;\s*$/, ".");
    }
    lines.push("");

    // Process children recursively
    for (const input of block.inputList) {
      if (input.type === INPUT_TYPES.STATEMENT) {
        let child = input.connection?.targetBlock();
        while (child) {
          processBlock(child);
          child = child.getNextBlock();
        }
      }
      if (input.type === INPUT_TYPES.VALUE) {
        const connected = input.connection?.targetBlock();
        if (connected) {
          processBlock(connected);
        }
      }
    }
  }

  for (const block of topBlocks) {
    processBlock(block);
  }

  return lines.join("\n");
}

/**
 * Serialize workspace to A-Box JSON (graph format).
 * @param {Blockly.Workspace} workspace
 * @param {string} smartHomeId
 * @returns {{ nodes: Array, links: Array }}
 */
export function serializeToJSON(workspace, smartHomeId) {
  if (!workspace) return { nodes: [], links: [] };

  const nodes = [];
  const links = [];
  const topBlocks = workspace.getTopBlocks(true);

  function processBlock(block) {
    const blockType = block.type;
    const ontologyClass = blockTypeToClass(blockType);
    if (!ontologyClass) return;

    const iri = instanceIri(smartHomeId, blockType, block.id);
    const label =
      block.getFieldValue("LABEL") || ontologyClass.replace("dhc:", "");

    // Collect all field values
    const properties = {};
    const fields = block.inputList
      .flatMap((input) => input.fieldRow)
      .filter((f) => f.name && f.name !== "");

    for (const field of fields) {
      properties[field.name] = field.getValue();
    }

    // Determine designView from block definition
    const blockDef = block.type;
    let designView = "shared";
    if (blockDef.startsWith("dhc_nfc14100_") || blockDef.startsWith("dhc_nfc15100_")) designView = "electrical";
    else if (blockDef.match(/floor|space|zone|area|real_estate/)) designView = "spatial";
    else if (blockDef.match(/circuit|distribution|protection|wiring|socket|switch|light|heater|energy|emergency|electrical/)) designView = "electrical";

    nodes.push({
      id: iri,
      blockId: block.id,
      type: ontologyClass,
      label,
      designView,
      properties,
    });

    // Statement inputs (containment links)
    for (const input of block.inputList) {
      if (input.type === INPUT_TYPES.STATEMENT) {
        let child = input.connection?.targetBlock();
        while (child) {
          const childIri = instanceIri(smartHomeId, child.type, child.id);
          links.push({
            source: iri,
            target: childIri,
            label: inputToProperty(input.name).replace("dhc:", ""),
            type: "containment",
          });
          processBlock(child);
          child = child.getNextBlock();
        }
      }
      if (input.type === INPUT_TYPES.VALUE) {
        const connected = input.connection?.targetBlock();
        if (connected) {
          const connIri = instanceIri(smartHomeId, connected.type, connected.id);
          links.push({
            source: iri,
            target: connIri,
            label: inputToProperty(input.name).replace("dhc:", ""),
            type: "reference",
          });
          processBlock(connected);
        }
      }
    }
  }

  for (const block of topBlocks) {
    processBlock(block);
  }

  return { nodes, links };
}
