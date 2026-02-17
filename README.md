# DigitalHome.Cloud Ontology Designer Blocks

This package contains starter blocks and a custom Blockly theme for the
DigitalHome.Cloud Ontology Designer.

## Contents

- `blocks/ontology_blocks.js`  
  Core blocks for modelling an OWL/RDFS ontology:
  - `ontology_root` – root container (represents `owl:Thing`) and base IRI
  - `ontology_class` – OWL classes with nested subclasses (DigitalHome.Cloud style)
  - `ontology_object_property` – object properties with domain/range
  - `ontology_data_property` – data properties with datatype range
  - `ontology_individual` – individuals (instances) of a class
  - `ontology_annotation` – generic annotation assertions (e.g. `rdfs:label`)

- `theme/dhc_ontology_theme.js`  
  A Blockly theme with:
  - Cool dark blue workspace
  - White / light text
  - Different border/secondary tones per block *type* (class, property, individual…)

## Visual style

All blocks share a cool dark-blue based palette. Types are distinguished via
their **border/secondary** colour:

- Classes → bright blue
- Object properties → teal
- Data properties → violet
- Individuals → sky blue
- Annotations → neutral grey

The main workspace uses a dark background to make the blocks pop, with bold,
light text for readability.

## Usage

1. Install Blockly in your project (if not already done).
2. Bundle these files with your front-end (e.g. via `webpack`, `vite`, etc.).
3. Load the theme and blocks after Blockly:

```ts
import * as Blockly from 'blockly/core';
import { DhcOntologyTheme } from './theme/dhc_ontology_theme';
import './blocks/ontology_blocks';

const workspace = Blockly.inject('blocklyDiv', {
  toolbox,
  theme: DhcOntologyTheme,
});
```

4. Hook these block types into your existing code generator so they emit
   the `dhc-core.ttl` / `dhc-core-electrical.ttl` fragments you need.

You can safely extend or rename the block types to better reflect your final
ontology schema while keeping the same colour coding.
