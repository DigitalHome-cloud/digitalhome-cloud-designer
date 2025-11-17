# DHC Modeler – 2-panel workspace layout

This update removes the separate React "Ontology Palette" sidebar and gives
more room to the Blockly workspace. The Blockly toolbox (categories + flyout)
is now the primary palette, as in a classic Blockly setup.

Included:

- `src/components/WorkspaceShell.js`
  - Two columns: Blockly workspace + Inspector
- `src/styles/global.css`
  - Only the relevant workspace/inspector styles (merge into your existing CSS)

How to use:

1. Replace `src/components/WorkspaceShell.js` in your project with the one from this bundle.
2. Merge the workspace-related parts of `src/styles/global.css` into your main CSS file.
3. Run `yarn develop` and open http://localhost:8000.
4. The left panel is now the full Blockly workspace; the Blockly toolbox is visible within it.
