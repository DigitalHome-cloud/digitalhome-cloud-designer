import * as Blockly from "blockly";
import "./blocks/dhc";

let workspaceRef = null;
let selectionCallback = null;

// DHC Dark Theme
export const dhcTheme = Blockly.Theme.defineTheme("dhcTheme", {
  base: Blockly.Themes.Classic,
  blockStyles: {
    dhc_class_block: {
      colourPrimary: "#22c55e",
      colourSecondary: "#16a34a",
      colourTertiary: "#052e16",
    },
    dhc_object_property_block: {
      colourPrimary: "#0ea5e9",
      colourSecondary: "#0369a1",
      colourTertiary: "#082f49",
    },
    dhc_data_property_block: {
      colourPrimary: "#eab308",
      colourSecondary: "#ca8a04",
      colourTertiary: "#422006",
    },
    dhc_equipment_block: {
      colourPrimary: "#a855f7",
      colourSecondary: "#7e22ce",
      colourTertiary: "#3b0764",
    },
  },
  categoryStyles: {
    classes: { colour: "#22c55e" },
    objectProperties: { colour: "#0ea5e9" },
    dataProperties: { colour: "#eab308" },
  },
  componentStyles: {
    workspaceBackgroundColour: "#020617",
    toolboxBackgroundColour: "#020617",
    toolboxForegroundColour: "#e5e7eb",
    flyoutBackgroundColour: "#020617",
    flyoutForegroundColour: "#e5e7eb",
    flyoutOpacity: 1,
    scrollbarColour: "#22c55e",
    insertionMarkerColour: "#22c55e",
    insertionMarkerOpacity: 0.6,
    cursorColour: "#38bdf8",
    selectedGlowColour: "#38bdf8",
    selectedGlowSize: 6,
  },
});

/**
 * Initialise the Blockly workspace in the given DOM container.
 * @param {HTMLElement} container
 * @param {object} options — { onSelectionChange, toolboxConfig, readOnly }
 */
export function initModelerWorkspace(container, options = {}) {
  if (!container) return null;

  const { onSelectionChange, toolboxConfig, readOnly = false } = options;
  selectionCallback =
    typeof onSelectionChange === "function" ? onSelectionChange : null;

  if (workspaceRef) {
    workspaceRef.dispose();
    workspaceRef = null;
  }

  const config = {
    theme: dhcTheme,
    trashcan: !readOnly,
    readOnly,
    grid: {
      spacing: 20,
      length: 2,
      colour: "#1f2937",
      snap: true,
    },
    zoom: {
      controls: true,
      wheel: true,
      startScale: 1.0,
      maxScale: 2,
      minScale: 0.5,
    },
  };

  if (toolboxConfig) {
    config.toolbox = toolboxConfig;
  }

  workspaceRef = Blockly.inject(container, config);

  workspaceRef.addChangeListener((event) => {
    if (!selectionCallback) return;
    if (event.type !== Blockly.Events.SELECTED) return;
    const id = event.newElementId;
    const block = id ? workspaceRef.getBlockById(id) : null;
    selectionCallback(block || null);
  });

  return workspaceRef;
}

/**
 * Update the toolbox on the existing workspace.
 * @param {object} toolboxConfig — Blockly categoryToolbox config
 */
export function updateToolbox(toolboxConfig) {
  if (!workspaceRef || !toolboxConfig) return;
  // Only update if the workspace was initialised with a toolbox
  if (!workspaceRef.options.languageTree) return;
  workspaceRef.updateToolbox(toolboxConfig);
}

export function getWorkspace() {
  return workspaceRef;
}

/**
 * Export the current workspace state as serialized JSON.
 */
export function exportWorkspaceJson() {
  if (!workspaceRef) return null;
  if (Blockly.serialization && Blockly.serialization.workspaces) {
    return Blockly.serialization.workspaces.save(workspaceRef);
  }
  const xmlDom = Blockly.Xml.workspaceToDom(workspaceRef);
  return { xml: Blockly.Xml.domToText(xmlDom) };
}

/**
 * Load a saved workspace state from JSON.
 * @param {object} json — workspace state from exportWorkspaceJson()
 */
export function loadDesignWorkspace(json) {
  if (!workspaceRef || !json) return;
  workspaceRef.clear();
  if (json.xml) {
    const xmlDom = Blockly.utils.xml.textToDom(json.xml);
    Blockly.Xml.domToWorkspace(xmlDom, workspaceRef);
  } else if (Blockly.serialization && Blockly.serialization.workspaces) {
    Blockly.serialization.workspaces.load(json, workspaceRef);
  }
}

/**
 * Center the workspace view on a specific block.
 * @param {string} blockId
 */
export function centerOnBlock(blockId) {
  if (!workspaceRef) return;
  workspaceRef.centerOnBlock(blockId);
  const block = workspaceRef.getBlockById(blockId);
  if (block) {
    block.select();
  }
}

/**
 * Set read-only mode on the workspace.
 */
export function setReadOnly(readOnly) {
  if (!workspaceRef) return;
  // Blockly doesn't have a direct setReadOnly — we use options
  workspaceRef.options.readOnly = readOnly;
}
