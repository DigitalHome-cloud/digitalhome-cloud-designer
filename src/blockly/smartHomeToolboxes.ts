// src/blockly/smartHomeToolboxes.ts
// Smart Home Designer: Toolbox definitions for different design views.

export type SmartHomeDesignView = "spatial" | "electrical" | "network" | "all";

export const smartHomeToolboxes: Record<SmartHomeDesignView, string> = {
  spatial: `
  <xml id="toolbox" style="display: none">
    <category name="Spaces" colour="#0ea5e9">
      <block type="dhc_space">
        <field name="NAME">Space</field>
      </block>
      <block type="dhc_floor">
        <field name="LEVEL">1</field>
      </block>
      <block type="dhc_zone">
        <field name="NAME">Zone</field>
      </block>
    </category>
    <category name="Structure" colour="#22c55e">
      <block type="dhc_wall"></block>
      <block type="dhc_window"></block>
      <block type="dhc_door"></block>
    </category>
    <category name="Logic" colour="#a855f7">
      <block type="controls_if"></block>
      <block type="logic_compare"></block>
    </category>
  </xml>
  `,

  electrical: `
  <xml id="toolbox" style="display: none">
    <category name="Circuits" colour="#f97316">
      <block type="dhc_circuit">
        <field name="NAME">C1</field>
      </block>
      <block type="dhc_distribution_board"></block>
      <block type="dhc_protection_device"></block>
    </category>
    <category name="Equipment" colour="#e11d48">
      <block type="dhc_socket"></block>
      <block type="dhc_switch"></block>
      <block type="dhc_light"></block>
      <block type="dhc_heater"></block>
    </category>
    <category name="Logic" colour="#a855f7">
      <block type="controls_if"></block>
      <block type="logic_operation"></block>
      <block type="logic_boolean"></block>
    </category>
  </xml>
  `,

  network: `
  <xml id="toolbox" style="display: none">
    <category name="Network" colour="#6366f1">
      <block type="dhc_network_segment"></block>
      <block type="dhc_wifi_ap"></block>
      <block type="dhc_lan_switch"></block>
      <block type="dhc_gateway"></block>
    </category>
    <category name="Protocols" colour="#22c55e">
      <block type="dhc_zigbee_segment"></block>
      <block type="dhc_homematic_segment"></block>
      <block type="dhc_bluetooth_segment"></block>
    </category>
    <category name="Logic" colour="#a855f7">
      <block type="controls_if"></block>
      <block type="logic_compare"></block>
    </category>
  </xml>
  `,

  all: `
  <xml id="toolbox" style="display: none">
    <category name="Spaces" colour="#0ea5e9">
      <block type="dhc_space"></block>
      <block type="dhc_floor"></block>
      <block type="dhc_zone"></block>
    </category>
    <category name="Electrical" colour="#f97316">
      <block type="dhc_circuit"></block>
      <block type="dhc_distribution_board"></block>
      <block type="dhc_socket"></block>
      <block type="dhc_switch"></block>
      <block type="dhc_light"></block>
      <block type="dhc_heater"></block>
    </category>
    <category name="Network" colour="#6366f1">
      <block type="dhc_network_segment"></block>
      <block type="dhc_wifi_ap"></block>
      <block type="dhc_lan_switch"></block>
      <block type="dhc_gateway"></block>
      <block type="dhc_zigbee_segment"></block>
      <block type="dhc_homematic_segment"></block>
      <block type="dhc_bluetooth_segment"></block>
    </category>
    <category name="Logic" colour="#a855f7">
      <block type="controls_if"></block>
      <block type="logic_operation"></block>
      <block type="logic_boolean"></block>
      <block type="logic_compare"></block>
    </category>
  </xml>
  `,
};
