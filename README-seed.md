# digitalhome-cloud-modeler (seed)

DHC Modeler: Schema / Ontology editing for DigitalHome.Cloud.

This seed includes:

- Shared DHC branding (header, footer, dark theme)
- i18n-ready setup (EN via `gatsby-plugin-react-i18next`)
- A three-panel workspace layout for the future Blockly-based modeler:
  - Ontology Palette (left)
  - Model Canvas / Blockly area (center)
  - Inspector (right)

## Getting Started

1. Copy these files into your `digitalhome-cloud-modeler` repository.
2. Merge the provided `gatsby-config.js` with your existing one (keep image/sharp plugins, etc.).
3. Install dependencies:

```bash
yarn add gatsby-plugin-react-i18next react-i18next i18next gatsby-source-filesystem
```

4. Run the development server:

```bash
yarn develop
```

You should see the DHC-branded Modeler workspace at:

- http://localhost:8000

From here you can integrate Blockly into the `Canvas` component (`WorkspaceShell.js`) and connect the palette/inspector to your ontology structures.
