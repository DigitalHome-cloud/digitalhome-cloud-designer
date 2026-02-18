// Blocks for DigitalHome.Cloud Ontology Designer
// These blocks are designed to model an OWL/RDFS ontology in Blockly.
//
// Integration notes:
// - Make sure to load this file *after* loading Blockly itself.
// - Also load `dhc_ontology_theme.js` and set the workspace theme to `DhcOntologyTheme`.
// - Code generation is up to your existing generator; these blocks only define structure.

import * as Blockly from 'blockly/core';

Blockly.defineBlocksWithJsonArray([
  {
    "type": "ontology_root",
    "message0": "Ontology root (owl:Thing) %1 base IRI %2",
    "args0": [
      {
        "type": "field_label_serializable",
        "name": "TITLE",
        "text": "DigitalHome.Cloud"
      },
      {
        "type": "field_input",
        "name": "BASE_IRI",
        "text": "https://digitalhome.cloud/schema/core#"
      }
    ],
    "message1": "Classes %1",
    "args1": [
      {
        "type": "input_statement",
        "name": "CLASSES",
        "check": "OntologyClass"
      }
    ],
    "style": "ontology_root_style",
    "tooltip": "Root container for the ontology. Represents owl:Thing and holds all top-level classes.",
    "helpUrl": ""
  },
  {
    "type": "ontology_class",
    "message0": "Class %1 IRI suffix %2",
    "args0": [
      {
        "type": "field_input",
        "name": "NAME",
        "text": "ClassName"
      },
      {
        "type": "field_input",
        "name": "IRI_SUFFIX",
        "text": "ClassName"
      }
    ],
    "message1": "label %1",
    "args1": [
      {
        "type": "field_input",
        "name": "LABEL",
        "text": "Human readable label"
      }
    ],
    "message2": "comment %1",
    "args2": [
      {
        "type": "field_multiline_input",
        "name": "COMMENT",
        "text": ""
      }
    ],
    "message3": "Subclasses %1",
    "args3": [
      {
        "type": "input_statement",
        "name": "SUBCLASSES",
        "check": "OntologyClass"
      }
    ],
    "previousStatement": "OntologyClass",
    "nextStatement": "OntologyClass",
    "style": "ontology_class_style",
    "tooltip": "Define an OWL class in the DigitalHome.Cloud ontology. Nest classes to express rdfs:subClassOf.",
    "helpUrl": ""
  },
  {
    "type": "ontology_object_property",
    "message0": "Object property %1 IRI suffix %2",
    "args0": [
      {
        "type": "field_input",
        "name": "NAME",
        "text": "hasPart"
      },
      {
        "type": "field_input",
        "name": "IRI_SUFFIX",
        "text": "hasPart"
      }
    ],
    "message1": "domain %1",
    "args1": [
      {
        "type": "field_input",
        "name": "DOMAIN",
        "text": "dhc:Equipment"
      }
    ],
    "message2": "range %1",
    "args2": [
      {
        "type": "field_input",
        "name": "RANGE",
        "text": "dhc:Equipment"
      }
    ],
    "message3": "comment %1",
    "args3": [
      {
        "type": "field_multiline_input",
        "name": "COMMENT",
        "text": ""
      }
    ],
    "style": "ontology_object_property_style",
    "tooltip": "Define an OWL object property with domain and range.",
    "helpUrl": ""
  },
  {
    "type": "ontology_data_property",
    "message0": "Data property %1 IRI suffix %2",
    "args0": [
      {
        "type": "field_input",
        "name": "NAME",
        "text": "hasPowerRating"
      },
      {
        "type": "field_input",
        "name": "IRI_SUFFIX",
        "text": "hasPowerRating"
      }
    ],
    "message1": "domain %1",
    "args1": [
      {
        "type": "field_input",
        "name": "DOMAIN",
        "text": "dhc:Equipment"
      }
    ],
    "message2": "range datatype %1",
    "args2": [
      {
        "type": "field_input",
        "name": "RANGE",
        "text": "xsd:decimal"
      }
    ],
    "message3": "comment %1",
    "args3": [
      {
        "type": "field_multiline_input",
        "name": "COMMENT",
        "text": ""
      }
    ],
    "style": "ontology_data_property_style",
    "tooltip": "Define an OWL data property with a datatype range.",
    "helpUrl": ""
  },
  {
    "type": "ontology_individual",
    "message0": "Individual %1 IRI suffix %2 of class %3",
    "args0": [
      {
        "type": "field_input",
        "name": "NAME",
        "text": "InstanceName"
      },
      {
        "type": "field_input",
        "name": "IRI_SUFFIX",
        "text": "InstanceName"
      },
      {
        "type": "field_input",
        "name": "CLASS",
        "text": "dhc:Equipment"
      }
    ],
    "message1": "label %1",
    "args1": [
      {
        "type": "field_input",
        "name": "LABEL",
        "text": "Instance label"
      }
    ],
    "message2": "comment %1",
    "args2": [
      {
        "type": "field_multiline_input",
        "name": "COMMENT",
        "text": ""
      }
    ],
    "style": "ontology_individual_style",
    "tooltip": "Define an OWL individual (instance) of a given class.",
    "helpUrl": ""
  },
  {
    "type": "ontology_annotation",
    "message0": "Annotation on %1 property %2 value %3 language %4",
    "args0": [
      {
        "type": "field_input",
        "name": "TARGET_IRI",
        "text": "dhc:Equipment"
      },
      {
        "type": "field_input",
        "name": "PROPERTY",
        "text": "rdfs:label"
      },
      {
        "type": "field_multiline_input",
        "name": "VALUE",
        "text": "Text"
      },
      {
        "type": "field_input",
        "name": "LANG",
        "text": "en"
      }
    ],
    "style": "ontology_annotation_style",
    "tooltip": "Generic annotation assertion, e.g., rdfs:label, rdfs:comment with an optional language tag.",
    "helpUrl": ""
  }
]);
