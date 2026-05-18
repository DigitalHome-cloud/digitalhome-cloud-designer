import React, { useState, useMemo } from "react";
import { DEVICE_CATEGORIES } from "../constants/deviceTypes";

// DeviceLifecycle enum (backend) → display labels.
const LIFECYCLE = [
  { value: "NEW", label: "New" },
  { value: "ACTIVE", label: "Active" },
  { value: "END_OF_LIFE", label: "End of life" },
  { value: "DECOMMISSIONED", label: "Decommissioned" },
];

/**
 * Create / edit a DeviceInstance — **model-first**: pick a Category, then an
 * existing DeviceModel from the catalogue (filtered by category); the chosen
 * model drives `modelNumber` + `deviceType`. You cannot record a device for a
 * model that doesn't exist (add it in Catalogue/Inbox first). Editing a
 * legacy instance whose model is no longer in the catalogue falls back to a
 * read-only modelNumber so the row stays editable.
 *
 * Props: { item, models, onSave, onCancel }. `models` = DeviceModel[] from
 * the catalogue. smartHomeId + owners are injected by the caller.
 */
const DeviceInstanceForm = ({
  item,
  models = [],
  mode = "edit",
  canEdit = true,
  onSave,
  onCancel,
}) => {
  const isEdit = !!item;
  const [editing, setEditing] = useState(mode !== "view" && canEdit);
  const ro = !editing;
  const knownModel = models.find((m) => m.modelNumber === item?.modelNumber);
  const legacy = isEdit && !!item?.modelNumber && !knownModel;

  const initialCat =
    (models.find((m) => m.modelNumber === item?.modelNumber)?.category &&
      DEVICE_CATEGORIES.find(
        (c) =>
          c.id ===
          models.find((m) => m.modelNumber === item?.modelNumber)?.category
      )?.id) ||
    DEVICE_CATEGORIES.find((c) =>
      c.subTypes.some((s) => s.label === item?.deviceType)
    )?.id ||
    DEVICE_CATEGORIES[0].id;

  const [category, setCategory] = useState(initialCat);
  const [modelNumber, setModelNumber] = useState(item?.modelNumber || "");
  const [serialNumber, setSerialNumber] = useState(item?.serialNumber || "");
  const [purchaseDate, setPurchaseDate] = useState(item?.purchaseDate || "");
  const [installationDate, setInstallationDate] = useState(
    item?.installationDate || ""
  );
  const [firmwareVersion, setFirmwareVersion] = useState(
    item?.firmwareVersion || ""
  );
  const [lifecycleState, setLifecycleState] = useState(
    item?.lifecycleState || "NEW"
  );
  const [location, setLocation] = useState(item?.location || "");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const modelsInCat = useMemo(
    () => models.filter((m) => m.category === category),
    [models, category]
  );

  const selectedModel = models.find((m) => m.modelNumber === modelNumber);
  // deviceType is driven by the chosen model (or kept from a legacy instance).
  const deviceType = legacy
    ? item.deviceType
    : selectedModel?.deviceType || "";

  const canSubmit =
    !!modelNumber.trim() &&
    !!serialNumber.trim() &&
    !!deviceType &&
    !saving &&
    (legacy || !!selectedModel);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setSubmitError(null);
    try {
      await onSave({
        ...(isEdit ? { id: item.id } : {}),
        modelNumber: modelNumber.trim(),
        serialNumber: serialNumber.trim(),
        deviceType,
        purchaseDate: purchaseDate || null,
        installationDate: installationDate || null,
        firmwareVersion: firmwareVersion.trim() || null,
        lifecycleState,
        location: location.trim() || null,
      });
    } catch (err) {
      setSubmitError(err?.errors?.[0]?.message || err?.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="dhc-manager-form" onSubmit={handleSubmit}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "0 0 1rem",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1rem" }}>
          {!isEdit
            ? "Add device"
            : ro
            ? `View device ${item.serialNumber}`
            : `Modify device ${item.serialNumber}`}
        </h3>
        {isEdit && canEdit && (
          <button
            type="button"
            className="dhc-button-ghost"
            onClick={() => setEditing((v) => !v)}
          >
            {ro ? "Modify" : "View"}
          </button>
        )}
      </div>

      {legacy && (
        <p
          style={{
            fontSize: "0.75rem",
            color: "#fbbf24",
            margin: "-0.5rem 0 1rem",
          }}
        >
          This device references model <code>{item.modelNumber}</code> which is
          no longer in the catalogue — model/type are read-only.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.6rem",
        }}
      >
        {/* ── model-first: Category → Model → derived deviceType ── */}
        <div className="dhc-form-field">
          <label className="dhc-form-label">Category</label>
          <select
            className="dhc-form-input"
            value={category}
            disabled={legacy || ro}
            onChange={(e) => {
              setCategory(e.target.value);
              setModelNumber("");
            }}
          >
            {DEVICE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="dhc-form-field">
          <label className="dhc-form-label">Model</label>
          {legacy ? (
            <input
              className="dhc-form-input"
              value={item.modelNumber}
              readOnly
              style={{ fontFamily: "monospace", opacity: 0.8 }}
            />
          ) : (
            <select
              className="dhc-form-input"
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
              disabled={ro}
              required
            >
              <option value="">— select a model —</option>
              {modelsInCat.map((m) => (
                <option key={m.modelNumber} value={m.modelNumber}>
                  {m.modelNumber} — {m.brand}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!legacy && modelsInCat.length === 0 && (
        <p
          style={{
            fontSize: "0.78rem",
            color: "#fbbf24",
            margin: "0.25rem 0 0.75rem",
          }}
        >
          No models in this category yet. Add one in the <strong>Catalogue</strong>{" "}
          tab (or via the <strong>Inbox</strong>) before recording a device.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.6rem",
        }}
      >
        <div className="dhc-form-field">
          <label className="dhc-form-label">Device type (from model)</label>
          <input
            className="dhc-form-input"
            value={deviceType || "—"}
            readOnly
            style={{ opacity: 0.8 }}
          />
        </div>
        <div className="dhc-form-field">
          <label className="dhc-form-label">Serial number</label>
          <input
            className="dhc-form-input"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="SN-000123"
            readOnly={isEdit || ro}
            required
          />
        </div>
        <div className="dhc-form-field">
          <label className="dhc-form-label">Purchase date</label>
          <input
            className="dhc-form-input"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            readOnly={ro}
          />
        </div>
        <div className="dhc-form-field">
          <label className="dhc-form-label">Installation date</label>
          <input
            className="dhc-form-input"
            type="date"
            value={installationDate}
            onChange={(e) => setInstallationDate(e.target.value)}
            readOnly={ro}
          />
        </div>
        <div className="dhc-form-field">
          <label className="dhc-form-label">Firmware version</label>
          <input
            className="dhc-form-input"
            value={firmwareVersion}
            onChange={(e) => setFirmwareVersion(e.target.value)}
            placeholder="2.4.1"
            readOnly={ro}
          />
        </div>
        <div className="dhc-form-field">
          <label className="dhc-form-label">Lifecycle</label>
          <select
            className="dhc-form-input"
            value={lifecycleState}
            onChange={(e) => setLifecycleState(e.target.value)}
            disabled={ro}
          >
            {LIFECYCLE.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="dhc-form-field">
          <label className="dhc-form-label">Location</label>
          <input
            className="dhc-form-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Server room / Living room"
            readOnly={ro}
          />
        </div>
      </div>

      {submitError && (
        <div className="dhc-form-error" style={{ marginTop: "0.5rem" }}>
          {submitError}
        </div>
      )}

      <div className="dhc-form-actions">
        {!ro && (
          <button
            type="submit"
            className="dhc-button-primary"
            disabled={!canSubmit}
          >
            {saving ? (isEdit ? "Saving…" : "Adding…") : isEdit ? "Save" : "Add"}
          </button>
        )}
        <button type="button" className="dhc-button-ghost" onClick={onCancel}>
          {ro ? "Close" : "Cancel"}
        </button>
      </div>
    </form>
  );
};

export default DeviceInstanceForm;
