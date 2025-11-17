import * as Blockly from "blockly";
import { dhcToolbox } from "./toolbox";
import "./blocks/dhc";

let workspaceRef = null;
let selectionCallback = null;

// 🌙 DHC Dark Theme
const dhcTheme = Blockly.Theme.defineTheme("dhcTheme", {
  base: Blockly.Themes.Classic,
  blockStyles: {
    dhc_class_block: {
      colourPrimary: "#22c55e",   // green
      colourSecondary: "#16a34a",
      colourTertiary: "#052e16",
    },
    dhc_object_property_block: {
      colourPrimary: "#0ea5e9",   // cyan/blue
      colourSecondary: "#0369a1",
      colourTertiary: "#082f49",
    },
    dhc_data_property_block: {
      colourPrimary: "#eab308",   // amber
      colourSecondary: "#ca8a04",
      colourTertiary: "#422006",
    },
    dhc_equipment_block: {
      colourPrimary: "#a855f7",   // purple
      colourSecondary: "#7e22ce",
      colourTertiary: "#3b0764",
    },
  },
  categoryStyles: {
    classes: {
      colour: "#22c55e",
    },
    objectProperties: {
      colour: "#0ea5e9",
    },
    dataProperties: {
      colour: "#eab308",
    },
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
 */
export function initModelerWorkspace(container, options = {}) {
  if (!container) return null;

  const { onSelectionChange } = options;
  selectionCallback =
    typeof onSelectionChange === "function" ? onSelectionChange : null;

  if (workspaceRef) {
    workspaceRef.dispose();
    workspaceRef = null;
  }

  console.log("[DHC] Injecting Blockly into:", container);
  console.log("[DHC] Toolbox JSON:", dhcToolbox);
  console.log(
    "[DHC] Available dhc_* blocks before inject:",
    Object.keys(Blockly.Blocks).filter((k) => k.startsWith("dhc_"))
  );

  workspaceRef = Blockly.inject(container, {
    toolbox: dhcToolbox,
    theme: dhcTheme,       // 👈 apply our theme
    trashcan: true,
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
  });

  console.log("[DHC] Workspace after inject:", workspaceRef);

  workspaceRef.addChangeListener((event) => {
    if (!selectionCallback) return;
    if (event.type !== Blockly.Events.SELECTED) return;
    const id = event.newElementId;
    const block = id ? workspaceRef.getBlockById(id) : null;
    selectionCallback(block || null);
  });

  return workspaceRef;
}

export function getWorkspace() {
  return workspaceRef;
}

export function exportWorkspaceJson() {
  if (!workspaceRef) return null;
  if (!Blockly.serialization || !Blockly.serialization.workspaces) {
    const xmlDom = Blockly.Xml.workspaceToDom(workspaceRef);
    const xmlText = Blockly.Xml.domToText(xmlDom);
    return { xml: xmlText };
  }
  return Blockly.serialization.workspaces.save(workspaceRef);
}
