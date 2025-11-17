// src/blockly/toolbox.js

export const dhcToolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "OWL",
      colour: "200",
      contents: [
        { kind: "block", type: "owl_thing" },
      ],
    },
    {
      kind: "category",
      name: "DHC Core",
      colour: "260",
      contents: [
        {
          kind: "block",
          type: "dhc_class",
          fields: {
            LABEL: "RealEstate",
            IRI: "https://digitalhome.cloud/schema/core#RealEstate",
          },
        },
        {
          kind: "block",
          type: "dhc_class",
          fields: {
            LABEL: "Space",
            IRI: "https://digitalhome.cloud/schema/core#Space",
          },
        },
        {
          kind: "block",
          type: "dhc_class",
          fields: {
            LABEL: "Equipment",
            IRI: "https://digitalhome.cloud/schema/core#Equipment",
          },
        },
        {
          kind: "block",
          type: "dhc_class",
          fields: {
            LABEL: "EquipmentType",
            IRI: "https://digitalhome.cloud/schema/core#EquipmentType",
          },
        },
        {
          kind: "block",
          type: "dhc_class",
          fields: {
            LABEL: "Zone",
            IRI: "https://digitalhome.cloud/schema/core#Zone",
          },
        },
      ],
    },
    {
      kind: "category",
      name: "Classes",
      colour: "210",
      contents: [
        { kind: "block", type: "dhc_class" },
        { kind: "block", type: "dhc_equipment_type" },
      ],
    },
    {
      kind: "category",
      name: "Object properties",
      colour: "160",
      contents: [
        { kind: "block", type: "dhc_object_property" },
      ],
    },
    {
      kind: "category",
      name: "Data properties",
      colour: "140",
      contents: [
        { kind: "block", type: "dhc_data_property" },
      ],
    },
  ],
};
