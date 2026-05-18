/**
 * Predefined combined CSV spec for the Device Inventory inbox import.
 * One row = one device + its model's metadata. The importer derives the
 * unique model set (by modelNumber) and device set (by serialNumber) into
 * devices/inbox.json `{ models:[], devices:[] }`.
 *
 * Single source of truth for: the column order, the downloadable template,
 * and the row → {model, device} normalisation.
 */
import { DEVICE_CATEGORIES } from "../constants/deviceTypes";

// Model columns then device columns (header order of the template).
export const MODEL_COLUMNS = [
  "modelNumber",
  "brand",
  "category",
  "deviceType",
  "description",
  "region",
  "standards",
  "compatibleClasses",
  "hasActorCapability",
  "hasSensorCapability",
  "hasControllerCapability",
];
export const DEVICE_COLUMNS = [
  "serialNumber",
  "purchaseDate",
  "installationDate",
  "firmwareVersion",
  "lifecycleState",
  "location",
];
export const CSV_COLUMNS = [...MODEL_COLUMNS, ...DEVICE_COLUMNS];

const LIFECYCLE_VALUES = ["NEW", "ACTIVE", "END_OF_LIFE", "DECOMMISSIONED"];

/** A downloadable example (header + one sample row). */
export const CSV_TEMPLATE =
  CSV_COLUMNS.join(",") +
  "\n" +
  [
    "ACME-NVR-8CH", // modelNumber
    "ACME", // brand
    "Security & Monitoring", // category (label or enum id)
    "Surveillance", // deviceType (a sub-type label)
    "8-channel NVR", // description
    "EU", // region
    "brick:Camera;brick:NVR", // standards (;-separated)
    "brick:Network_Video_Recorder", // compatibleClasses (;-separated)
    "false", // hasActorCapability
    "true", // hasSensorCapability
    "true", // hasControllerCapability
    "SN-NVR-0001", // serialNumber
    "2026-01-15", // purchaseDate (YYYY-MM-DD)
    "2026-02-01", // installationDate
    "2.4.1", // firmwareVersion
    "ACTIVE", // lifecycleState (NEW|ACTIVE|END_OF_LIFE|DECOMMISSIONED)
    "Server room", // location
  ].join(",") +
  "\n";

const bool = (v) =>
  v == null || v === ""
    ? null
    : /^(true|1|yes|y)$/i.test(String(v).trim());

const arr = (v) =>
  v == null || String(v).trim() === ""
    ? null
    : String(v)
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);

/** Accepts an enum id ("COMPUTING_IT") or a human label → enum id. */
export function normalizeCategory(value) {
  if (!value) return DEVICE_CATEGORIES[0].id;
  const v = String(value).trim();
  const byId = DEVICE_CATEGORIES.find((c) => c.id === v.toUpperCase());
  if (byId) return byId.id;
  const byLabel = DEVICE_CATEGORIES.find(
    (c) => c.label.toLowerCase() === v.toLowerCase()
  );
  return byLabel ? byLabel.id : DEVICE_CATEGORIES[0].id;
}

/** Accepts "End of life", "end_of_life", "ACTIVE" … → enum value. */
export function normalizeLifecycle(value) {
  if (!value) return "NEW";
  const v = String(value).trim().toUpperCase().replace(/[\s-]+/g, "_");
  return LIFECYCLE_VALUES.includes(v) ? v : "NEW";
}

/**
 * Parsed CSV rows (header:true objects) → deduped inbox payload.
 * Models keyed by modelNumber, devices by serialNumber; rows missing the
 * key are skipped and reported.
 */
export function rowsToInbox(rows) {
  const models = new Map();
  const devices = new Map();
  const skipped = [];

  rows.forEach((r, i) => {
    const modelNumber = (r.modelNumber || "").trim();
    const serialNumber = (r.serialNumber || "").trim();

    if (modelNumber && !models.has(modelNumber)) {
      models.set(modelNumber, {
        modelNumber,
        brand: (r.brand || "").trim(),
        category: normalizeCategory(r.category),
        deviceType: (r.deviceType || "").trim(),
        description: (r.description || "").trim() || null,
        region: (r.region || "").trim() || null,
        standards: arr(r.standards),
        compatibleClasses: arr(r.compatibleClasses),
        hasActorCapability: bool(r.hasActorCapability),
        hasSensorCapability: bool(r.hasSensorCapability),
        hasControllerCapability: bool(r.hasControllerCapability),
        _status: "pending",
      });
    }

    if (serialNumber) {
      if (!devices.has(serialNumber)) {
        devices.set(serialNumber, {
          serialNumber,
          modelNumber,
          deviceType: (r.deviceType || "").trim(),
          purchaseDate: (r.purchaseDate || "").trim() || null,
          installationDate: (r.installationDate || "").trim() || null,
          firmwareVersion: (r.firmwareVersion || "").trim() || null,
          lifecycleState: normalizeLifecycle(r.lifecycleState),
          location: (r.location || "").trim() || null,
          _status: "pending",
        });
      }
    } else if (!modelNumber) {
      skipped.push(i + 2); // +2: 1-based + header row
    }
  });

  return {
    models: [...models.values()],
    devices: [...devices.values()],
    skipped,
  };
}
