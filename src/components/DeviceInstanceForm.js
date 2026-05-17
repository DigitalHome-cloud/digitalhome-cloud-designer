import React, { useState, useMemo } from "react";
import { DEVICE_CATEGORIES } from "../constants/deviceTypes";

const STATUS_OPTIONS = ["Active", "Inactive", "Faulty", "Decommissioned"];

/**
 * Create / edit a DeviceInstance. Mirrors SmartHomeForm: controlled fields,
 * a `canSubmit` guard, inline submit error. smartHomeId + owners are injected
 * by DeviceInventoryManager (not user-editable).
 */
const DeviceInstanceForm = ({ item, onSave, onCancel }) => {
  const isEdit = !!item;
  const [modelNumber, setModelNumber] = useState(item?.modelNumber || "");
  const [serialNumber, setSerialNumber] = useState(item?.serialNumber || "");
  const initialCat =
    DEVICE_CATEGORIES.find((c) =>
      c.subTypes.some((s) => s.label === item?.deviceType)
    )?.id || DEVICE_CATEGORIES[0].id;
  const [category, setCategory] = useState(initialCat);
  const [deviceType, setDeviceType] = useState(
    item?.deviceType ||
      DEVICE_CATEGORIES.find((c) => c.id === initialCat).subTypes[0].label
  );
  const [purchaseDate, setPurchaseDate] = useState(item?.purchaseDate || "");
  const [installationDate, setInstallationDate] = useState(
    item?.installationDate || ""
  );
  const [firmwareVersion, setFirmwareVersion] = useState(
    item?.firmwareVersion || ""
  );
  const [status, setStatus] = useState(item?.status || "Active");
  const [location, setLocation] = useState(item?.location || "");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const subTypes = useMemo(
    () => DEVICE_CATEGORIES.find((c) => c.id === category)?.subTypes || [],
    [category]
  );

  const canSubmit =
    !!modelNumber.trim() && !!serialNumber.trim() && !!deviceType && !saving;

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
        status,
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
      <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>
        {isEdit ? `Modify device ${item.serialNumber}` : "Add device"}
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.6rem",
        }}
      >
        <div className="dhc-form-field">
          <label className="dhc-form-label">Model number</label>
          <input
            className="dhc-form-input"
            value={modelNumber}
            onChange={(e) => setModelNumber(e.target.value)}
            placeholder="ACME-NVR-8CH"
            required
          />
        </div>
        <div className="dhc-form-field">
          <label className="dhc-form-label">Serial number</label>
          <input
            className="dhc-form-input"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="SN-000123"
            readOnly={isEdit}
            required
          />
        </div>
        <div className="dhc-form-field">
          <label className="dhc-form-label">Category</label>
          <select
            className="dhc-form-input"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              const c = DEVICE_CATEGORIES.find(
                (x) => x.id === e.target.value
              );
              setDeviceType(c.subTypes[0].label);
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
          <label className="dhc-form-label">Device type</label>
          <select
            className="dhc-form-input"
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
          >
            {subTypes.map((s) => (
              <option key={s.label} value={s.label}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="dhc-form-field">
          <label className="dhc-form-label">Purchase date</label>
          <input
            className="dhc-form-input"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </div>
        <div className="dhc-form-field">
          <label className="dhc-form-label">Installation date</label>
          <input
            className="dhc-form-input"
            type="date"
            value={installationDate}
            onChange={(e) => setInstallationDate(e.target.value)}
          />
        </div>
        <div className="dhc-form-field">
          <label className="dhc-form-label">Firmware version</label>
          <input
            className="dhc-form-input"
            value={firmwareVersion}
            onChange={(e) => setFirmwareVersion(e.target.value)}
            placeholder="2.4.1"
          />
        </div>
        <div className="dhc-form-field">
          <label className="dhc-form-label">Status</label>
          <select
            className="dhc-form-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
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
          />
        </div>
      </div>

      {submitError && (
        <div className="dhc-form-error" style={{ marginTop: "0.5rem" }}>
          {submitError}
        </div>
      )}

      <div className="dhc-form-actions">
        <button
          type="submit"
          className="dhc-button-primary"
          disabled={!canSubmit}
        >
          {saving ? (isEdit ? "Saving…" : "Adding…") : isEdit ? "Save" : "Add"}
        </button>
        <button
          type="button"
          className="dhc-button-ghost"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default DeviceInstanceForm;
