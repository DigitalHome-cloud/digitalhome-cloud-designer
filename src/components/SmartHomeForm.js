import React, { useState, useEffect } from "react";
import {
  validateSmartHomeId,
  parseSmartHomeId,
} from "../utils/smartHomeIdValidator";

const SmartHomeForm = ({ item, onSave, onCancel }) => {
  const isEdit = !!item;
  const [smartHomeId, setSmartHomeId] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [idError, setIdError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setSmartHomeId(item.id || "");
      setAddress(item.address || "");
      setDescription(item.description || "");
      setOwnerName(item.ownerName || "");
    }
  }, [item]);

  const handleIdChange = (e) => {
    const val = e.target.value;
    setSmartHomeId(val);
    if (val.length > 3) {
      const result = validateSmartHomeId(val);
      setIdError(result.valid ? null : result.error);
    } else {
      setIdError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateSmartHomeId(smartHomeId);
    if (!validation.valid) {
      setIdError(validation.error);
      return;
    }

    const parsed = parseSmartHomeId(smartHomeId);
    if (!parsed) return;

    setSaving(true);
    try {
      await onSave({
        id: smartHomeId.trim().toUpperCase(),
        country: parsed.country,
        zip: parsed.zip,
        streetCode: parsed.streetCode,
        houseNumber: parsed.houseNumber,
        suffix: parsed.suffix,
        address,
        description,
        ownerName,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="dhc-manager-form" onSubmit={handleSubmit}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>
        {isEdit ? "Edit SmartHome" : "Create SmartHome"}
      </h3>

      <div className="dhc-form-field">
        <label className="dhc-form-label">SmartHome ID</label>
        <input
          className="dhc-form-input"
          type="text"
          value={smartHomeId}
          onChange={handleIdChange}
          placeholder="DE-80331-MAR12-01"
          disabled={isEdit}
          required
        />
        {idError && <div className="dhc-form-error">{idError}</div>}
      </div>

      <div className="dhc-form-field">
        <label className="dhc-form-label">Address</label>
        <input
          className="dhc-form-input"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Marienplatz 12, 80331 Munich"
        />
      </div>

      <div className="dhc-form-field">
        <label className="dhc-form-label">Owner Name</label>
        <input
          className="dhc-form-input"
          type="text"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
        />
      </div>

      <div className="dhc-form-field">
        <label className="dhc-form-label">Description</label>
        <textarea
          className="dhc-form-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="dhc-form-actions">
        <button
          type="submit"
          className="dhc-button-primary"
          disabled={saving}
        >
          {saving ? "Saving..." : isEdit ? "Update" : "Create"}
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

export default SmartHomeForm;
