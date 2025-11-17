import * as Blockly from "blockly";

console.log("[DHC] Loading block definitions. Blockly.VERSION =", Blockly.VERSION);

/**
 * OWL:Thing - top of the class hierarchy
 */
Blockly.Blocks["owl_thing"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Class")
      .appendField("owl:Thing");
    this.appendDummyInput()
      .appendField("IRI")
      .appendField(
        new Blockly.FieldTextInput(
          "http://www.w3.org/2002/07/owl#Thing"
        ),
        "IRI"
      );
    this.setStyle("dhc_class_block");  // reuse class style
    this.setTooltip("OWL Thing: top of the class hierarchy");
    this.setHelpUrl("https://www.w3.org/TR/owl-ref/#owl_Thing");
    this.setOutput(true, "Class");
  },
};

/**
 * DHC Class block
 */
Blockly.Blocks["dhc_class"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Class")
      .appendField(
        new Blockly.FieldTextInput("NewClass"),
        "LABEL"
      );
    this.appendDummyInput()
      .appendField("IRI")
      .appendField(
        new Blockly.FieldTextInput(
          "https://digitalhome.cloud/schema/core#NewClass"
        ),
        "IRI"
      );
    this.setStyle("dhc_class_block");   // 👈 use themed style
    this.setTooltip("Define a class in the DHC ontology");
    this.setHelpUrl("");
    this.setOutput(true, "Class");
  },
};

/**
 * DHC Object Property block
 */
Blockly.Blocks["dhc_object_property"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Object property")
      .appendField(
        new Blockly.FieldTextInput("hasPart"),
        "LABEL"
      );
    this.appendValueInput("DOMAIN")
      .setCheck("Class")
      .appendField("Domain");
    this.appendValueInput("RANGE")
      .setCheck("Class")
      .appendField("Range");
    this.setStyle("dhc_object_property_block");  // 👈 themed style
    this.setTooltip(
      "Relate one class to another (e.g. EquipmentType hasPart EquipmentType)"
    );
    this.setHelpUrl("");
    this.setOutput(true, "ObjectProperty");
  },
};

/**
 * DHC Data Property block
 */
Blockly.Blocks["dhc_data_property"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Data property")
      .appendField(
        new Blockly.FieldTextInput("capacity"),
        "LABEL"
      );
    this.appendDummyInput()
      .appendField("Range")
      .appendField(
        new Blockly.FieldDropdown([
          ["string", "xsd:string"],
          ["integer", "xsd:integer"],
          ["decimal", "xsd:decimal"],
          ["boolean", "xsd:boolean"],
        ]),
        "RANGE"
      );
    this.setStyle("dhc_data_property_block");   // 👈 themed style
    this.setTooltip("Attach scalar values to a class");
    this.setHelpUrl("");
    this.setOutput(true, "DataProperty");
  },
};

/**
 * DHC EquipmentType block
 */
Blockly.Blocks["dhc_equipment_type"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("EquipmentType")
      .appendField(
        new Blockly.FieldTextInput("Socket"),
        "LABEL"
      );
    this.appendDummyInput()
      .appendField("Base class")
      .appendField(
        new Blockly.FieldTextInput("dhc:EquipmentType"),
        "BASE"
      );
    this.setStyle("dhc_equipment_block");       // 👈 themed style
    this.setTooltip("Specialised equipment type in the DHC model");
    this.setHelpUrl("");
    this.setOutput(true, "Class");
  },
};

console.log(
  "[DHC] Blocks registered:",
  Object.keys(Blockly.Blocks).filter((k) => k.startsWith("dhc_"))
);
