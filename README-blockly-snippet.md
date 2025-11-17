# DHC Modeler – Blockly integration snippet

This bundle contains the minimal Blockly integration for the DHC Modeler mock:

- `src/blockly/blocks/dhc.js` – example DHC blocks:
  - `dhc_class`
  - `dhc_object_property`
  - `dhc_data_property`
  - `dhc_equipment_type`
- `src/blockly/toolbox.js` – toolbox XML definition
- `src/blockly/workspace.js` – helper to initialise the workspace
- `src/components/WorkspaceShell.js` – updated to mount the workspace

## Usage

1. In your `digitalhome-cloud-modeler` repo, install Blockly:

```bash
yarn add blockly
# or
npm install blockly
```

2. Copy the files from this snippet into your project:

- `src/blockly/**`
- `src/components/WorkspaceShell.js` (overwrite existing)

3. Run the dev server:

```bash
yarn develop
```

You should now see a Blockly workspace in the center panel with a small toolbox.
