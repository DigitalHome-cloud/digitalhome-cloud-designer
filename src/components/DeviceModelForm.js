import React, { useState, useMemo } from "react";
import { DEVICE_CATEGORIES } from "../constants/deviceTypes";

/**
 * Create / edit a DeviceModel (catalogue). Reused by DeviceCatalogue and the
 * Inbox Stage-1 (model) review. `modelNumber` is the identifier → read-only
 * when editing. Fields not rendered here (region, standards,
 * compatibleClasses, capability flags, s3* paths) are preserved from `item`
 * so a CSV-prefilled model keeps its extra metadata on save.
 */
const PASSTHROUGH = [
  "region",
  "standards",
  "compatibleClasses",
  "hasActorCapability",
  "hasSensorCapability",
  "hasControllerCapability",
  "s3DocPath",
  "s3ImgPath",
  "s3SpecsPath",
];

const DeviceModelForm = ({ item, onSave, onCancel }) => {
  const isEdit = !!item?.modelNumber;
  const [modelNumber, setModelNumber] = useState(item?.modelNumber || "");
  const initialCat =
    (DEVICE_CATEGORIES.find((c) => c.id === item?.category) ||
      DEVICE_CATEGORIES.find((c) =>
        c.subTypes.some((s) => s.label === item?.deviceType)
      ) ||
      DEVICE_CATEGORIES[0]).id;
  const [category, setCategory] = useState(initialCat);
  const [deviceType, setDeviceType] = useState(
    item?.deviceType ||
      DEVICE_CATEGORIES.find((c) => c.id === initialCat).subTypes[0].label
  );
  const [brand, setBrand] = useState(item?.brand || "");
  const [description, setDescription] = useState(item?.description || "");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const subTypes = useMemo(
    () => DEVICE_CATEGORIES.find((c) => c.id === category)?.subTypes || [],
    [category]
  );

  const canSubmit =
    !!modelNumber.trim() && !!brand.trim() && !!deviceType && !saving;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setSubmitError(null);
    try {
      const passthrough = {};
      for (const k of PASSTHROUGH) {
        if (item && item[k] != null) passthrough[k] = item[k];
      }
      await onSave({
        modelNumber: modelNumber.trim(),
        brand: brand.trim(),
        category,
        deviceType,
        description: description.trim() || null,
        ...passthrough,
        _isEdit: isEdit,
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
        {isEdit ? `Modify model ${item.modelNumber}` : "Add catalogue model"}
      </h3>

      <div className="dhc-form-field">
        <label className="dhc-form-label">Model number</label>
        <input
          className="dhc-form-input"
          value={modelNumber}
          onChange={(e) => setModelNumber(e.target.value)}
          placeholder="ACME-NVR-8CH"
          readOnly={isEdit}
          required
        />
      </div>
      <div className="dhc-form-field">
        <label className="dhc-form-label">Brand</label>
        <input
          className="dhc-form-input"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="ACME"
          required
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.6rem",
        }}
      >
        <div className="dhc-form-field">
          <label className="dhc-form-label">Category</label>
          <select
            className="dhc-form-input"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              const c = DEVICE_CATEGORIES.find((x) => x.id === e.target.value);
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
      </div>
      <div className="dhc-form-field">
        <label className="dhc-form-label">Description</label>
        <input
          className="dhc-form-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {submitError && (
        <div className="dhc-form-error" style={{ marginTop: "0.5rem" }}>
          {submitError}
        </div>
      )}

      <div className="dhc-form-actions">
        <button type="submit" className="dhc-button-primary" disabled={!canSubmit}>
          {saving ? (isEdit ? "Saving…" : "Adding…") : isEdit ? "Save" : "Add"}
        </button>
        <button type="button" className="dhc-button-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default DeviceModelForm;
