/**
 * Device taxonomy — single source for the inventory category/sub-type nav,
 * filters and forms. App-level only (NOT the T-Box ontology). The `category`
 * id matches the backend `DeviceCategory` enum in
 * repos/core/amplify/data/resource.ts; `deviceType` is a sub-type label
 * stored verbatim on DeviceModel / DeviceInstance.
 *
 * Verbatim from todo/deviveInventory.md.
 */
export const DEVICE_CATEGORIES = [
  {
    id: "COMPUTING_IT",
    label: "Computing & IT Devices",
    subTypes: [
      {
        label: "End-User Devices",
        examples: ["Laptops", "Desktops", "Tablets", "Smartphones", "Thin clients"],
      },
      {
        label: "Infrastructure",
        examples: ["Servers", "Network switches", "Routers", "Firewalls", "Wireless access points"],
      },
      {
        label: "Peripherals",
        examples: ["Monitors", "Docking stations", "Keyboards", "Mice", "External hard drives"],
      },
      {
        label: "Storage",
        examples: ["NAS devices", "SAN arrays"],
      },
    ],
  },
  {
    id: "CONTROLLERS_AUTOMATION",
    label: "Controllers & Automation",
    subTypes: [
      {
        label: "Industrial Controllers",
        examples: ["Programmable Logic Controllers (PLCs)", "Distributed Control Systems (DCS)"],
      },
      {
        label: "Smart Home Hubs",
        examples: ["Central gateways (lighting, locks, thermostats)"],
      },
      {
        label: "Microcontrollers",
        examples: ["Arduino", "Raspberry Pi", "ESP32"],
      },
      {
        label: "Access Control",
        examples: ["Badge readers", "Biometric scanners", "Electronic gate controllers"],
      },
    ],
  },
  {
    id: "FACILITIES_APPLIANCES",
    label: "Facilities & Appliances",
    subTypes: [
      {
        label: "HVAC Systems",
        examples: ["Air conditioners", "Furnaces", "Heat pumps", "Smart thermostats"],
      },
      {
        label: "Kitchen Appliances",
        examples: ["Refrigerators", "Microwaves", "Ovens", "Dishwashers", "Coffee makers"],
      },
      {
        label: "Utility Equipment",
        examples: ["Water heaters", "Water softeners", "Sump pumps"],
      },
      {
        label: "Power Management",
        examples: ["UPS", "Generators", "Smart power strips"],
      },
    ],
  },
  {
    id: "MEDIA_COMMUNICATION",
    label: "Media & Communication",
    subTypes: [
      {
        label: "AV Equipment",
        examples: ["Televisions", "Projectors", "Soundbars", "AV receivers", "Media players"],
      },
      {
        label: "Telecom",
        examples: ["VoIP phones", "Conference stations", "Intercoms"],
      },
      {
        label: "Digital Signage",
        examples: ["Display screens", "Media players", "Electronic billboards"],
      },
    ],
  },
  {
    id: "SECURITY_MONITORING",
    label: "Security & Monitoring",
    subTypes: [
      {
        label: "Surveillance",
        examples: ["IP cameras", "Analog cameras", "Network Video Recorders (NVR)"],
      },
      {
        label: "Environmental Sensors",
        examples: ["Smoke detectors", "Carbon monoxide alarms", "Leak sensors"],
      },
    ],
  },
];

/** Flat [{category, categoryLabel, deviceType}] for filter dropdowns. */
export const DEVICE_TYPE_OPTIONS = DEVICE_CATEGORIES.flatMap((c) =>
  c.subTypes.map((s) => ({
    category: c.id,
    categoryLabel: c.label,
    deviceType: s.label,
  }))
);

export const CATEGORY_LABEL = Object.fromEntries(
  DEVICE_CATEGORIES.map((c) => [c.id, c.label])
);
