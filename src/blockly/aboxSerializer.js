/**
 * aboxSerializer.js
 *
 * Converts a Blockly workspace into A-Box TTL and JSON representations.
 * Instance IRIs: dhc-instance:{smartHomeId}/{blockType}/{blockId}
 */
import * as Blockly from "blockly";

const DHC_NS = "https://digitalhome.cloud/ontology#";
const DHC_INSTANCE_NS = "https://digitalhome.cloud/instance#";

/**
 * Get the ontology class IRI for a block type.
 * Block types follow the pattern dhc_class_name → dhc:ClassName
 */
function blockTypeToClass(blockType) {
  if (!blockType.startsWith("dhc_")) return null;
  // Convert snake_case to PascalCase
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
      if (input.type === Blockly.inputTypes.STATEMENT) {
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
      if (input.type === Blockly.inputTypes.VALUE) {
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
      if (input.type === Blockly.inputTypes.STATEMENT) {
        let child = input.connection?.targetBlock();
        while (child) {
          processBlock(child);
          child = child.getNextBlock();
        }
      }
      if (input.type === Blockly.inputTypes.VALUE) {
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
    if (blockDef.match(/floor|space|zone|area|real_estate/)) designView = "spatial";
    else if (blockDef.match(/circuit|distribution|protection|wiring|socket|switch|light|heater/)) designView = "electrical";

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
      if (input.type === Blockly.inputTypes.STATEMENT) {
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
      if (input.type === Blockly.inputTypes.VALUE) {
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
