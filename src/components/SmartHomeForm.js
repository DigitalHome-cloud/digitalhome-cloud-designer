import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

// Launch markets — extend as we expand.
const COUNTRY_CODES = [
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "BE", label: "Belgium" },
];

const PARTS_REGEX = {
  postalCode: /^\d{3,5}$/,
  streetCode: /^[A-Z]{3}$/,
  houseNumber: /^\d{1,5}$/,
  suffix: /^\d{2}$/,
};

// Derive a 3-letter streetCode from the address line:
//   - 1 alphabetic word  → first 3 letters of that word ("Marienplatz" → MAR)
//   - 2 words            → 1st letter of word 1 + first 2 of word 2 ("King Street" → KST)
//   - 3+ words           → 1st letter of each of the first 3 words ("Rue de la Loi" → RDL)
// Strips diacritics via NFD so "Mörikestraße" → MOR (ASCII-only,
// Cognito-group-safe charset).
function deriveStreetCode(addressLine1) {
  if (!addressLine1) return "";
  // NFD splits "ö" into "o" + combining diacritic (U+0300–U+036F);
  // dropping the combining marks gives ASCII letters we can use.
  const stripped = addressLine1
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const words = stripped.match(/[A-Za-z]+/g) || [];
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  if (words.length === 2) {
    return (words[0][0] + words[1].slice(0, 2)).toUpperCase();
  }
  return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
}

const SmartHomeForm = ({ item, onSave, onCancel }) => {
  // editing mode: only city, addressLine1, addressLine2 are mutable.
  // Everything else (smartHomeId, country, postalCode, streetCode, houseNumber,
  // suffix, isDemo) is locked because it's encoded in the smartHomeId or in
  // the storage-routing decision and changing those would break invariants.
  const isEdit = !!item;

  // The isDemo flag routes storage to Public/ instead of Private/. Only
  // members of dhc-devops-engineers can flip it — everyone else creates
  // real (Private/) homes by default and never sees the option.
  const { hasGroup } = useAuth();
  const canSetDemo = hasGroup("dhc-devops-engineers");

  const [country, setCountry] = useState(item?.country || "DE");
  const [city, setCity] = useState(item?.city || "");
  const [addressLine1, setAddressLine1] = useState(item?.addressLine1 || "");
  const [addressLine2, setAddressLine2] = useState(item?.addressLine2 || "");
  const [isDemo, setIsDemo] = useState(!!item?.isDemo);
  const [postalCode, setPostalCode] = useState(item?.postalCode || "");
  const [houseNumber, setHouseNumber] = useState(item?.houseNumber || "");
  const [suffix, setSuffix] = useState(item?.suffix || "01");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const streetCode = useMemo(
    () => deriveStreetCode(addressLine1),
    [addressLine1]
  );

  const computedId = useMemo(() => {
    if (
      !country ||
      !postalCode ||
      !streetCode ||
      !houseNumber ||
      !suffix
    ) {
      return "";
    }
    return `${country}-${postalCode}-${streetCode}${houseNumber}-${suffix}`;
  }, [country, postalCode, streetCode, houseNumber, suffix]);

  const fieldErrors = useMemo(() => {
    const errs = {};
    if (postalCode && !PARTS_REGEX.postalCode.test(postalCode)) {
      errs.postalCode = "Must be 3–5 digits";
    }
    if (addressLine1 && !PARTS_REGEX.streetCode.test(streetCode)) {
      errs.streetCode = "Need at least 3 letters in the street name";
    }
    if (houseNumber && !PARTS_REGEX.houseNumber.test(houseNumber)) {
      errs.houseNumber = "Must be 1–5 digits";
    }
    if (suffix && !PARTS_REGEX.suffix.test(suffix)) {
      errs.suffix = "Must be 2 digits (e.g. 01)";
    }
    return errs;
  }, [postalCode, streetCode, houseNumber, suffix, addressLine1]);

  const canSubmit = isEdit
    ? !!city.trim() && !!addressLine1.trim() && !saving
    : !!country &&
      !!city.trim() &&
      !!addressLine1.trim() &&
      PARTS_REGEX.postalCode.test(postalCode) &&
      PARTS_REGEX.streetCode.test(streetCode) &&
      PARTS_REGEX.houseNumber.test(houseNumber) &&
      PARTS_REGEX.suffix.test(suffix) &&
      !saving;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setSubmitError(null);
    try {
      if (isEdit) {
        await onSave({
          smartHomeId: item.smartHomeId,
          city: city.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || null,
        });
      } else {
        await onSave({
          country,
          postalCode,
          streetCode,
          houseNumber,
          suffix,
          city: city.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || null,
          isDemo,
        });
      }
    } catch (err) {
      setSubmitError(err?.errors?.[0]?.message || err?.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="dhc-manager-form" onSubmit={handleSubmit}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>
        {isEdit ? `Modify DigitalHome ${item.smartHomeId}` : "Create DigitalHome"}
      </h3>
      {isEdit && (
        <p
          style={{
            fontSize: "0.75rem",
            color: "#9ca3af",
            margin: "-0.5rem 0 1rem",
          }}
        >
          Only City and Address lines can be changed. Country, postal code,
          street code, house # and demo flag are encoded in the SmartHome ID
          and stay fixed.
        </p>
      )}

      <div className="dhc-form-field">
        <label className="dhc-form-label">Country</label>
        <select
          className="dhc-form-input"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          disabled={isEdit}
          required
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="dhc-form-field">
        <label className="dhc-form-label">City</label>
        <input
          className="dhc-form-input"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Munich"
          required
        />
      </div>

      <div className="dhc-form-field">
        <label className="dhc-form-label">Address line 1</label>
        <input
          className="dhc-form-input"
          type="text"
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          placeholder="Marienplatz 12"
          required
        />
      </div>

      <div className="dhc-form-field">
        <label className="dhc-form-label">Address line 2 (optional)</label>
        <input
          className="dhc-form-input"
          type="text"
          value={addressLine2}
          onChange={(e) => setAddressLine2(e.target.value)}
          placeholder="Apt 4"
        />
      </div>

      {canSetDemo && (
        <div className="dhc-form-field">
          <label
            className="dhc-form-label"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <input
              type="checkbox"
              checked={isDemo}
              onChange={(e) => setIsDemo(e.target.checked)}
              disabled={isEdit}
            />
            Is demo home (storage goes to Public/, otherwise Private/)
            <span
              className="dhc-nav-pill"
              style={{
                marginLeft: "0.4rem",
                background: "rgba(239,68,68,0.15)",
                borderColor: "rgba(239,68,68,0.4)",
                color: "#fca5a5",
              }}
            >
              devops only
            </span>
          </label>
        </div>
      )}

      <hr style={{ margin: "1.25rem 0", borderColor: "rgba(255,255,255,0.08)" }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "0.6rem",
        }}
      >
        <div className="dhc-form-field">
          <label className="dhc-form-label">Postal code</label>
          <input
            className="dhc-form-input"
            type="text"
            value={postalCode}
            onChange={(e) =>
              setPostalCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))
            }
            placeholder="80331"
            readOnly={isEdit}
            required
          />
          {fieldErrors.postalCode && (
            <div className="dhc-form-error">{fieldErrors.postalCode}</div>
          )}
        </div>

        <div className="dhc-form-field">
          <label className="dhc-form-label">Street code (auto)</label>
          <input
            className="dhc-form-input"
            type="text"
            value={streetCode}
            readOnly
            placeholder="MAR"
            style={{ fontFamily: "monospace", opacity: 0.8 }}
            title="First 3 letters of the street name (Address line 1)"
          />
          {fieldErrors.streetCode && (
            <div className="dhc-form-error">{fieldErrors.streetCode}</div>
          )}
        </div>

        <div className="dhc-form-field">
          <label className="dhc-form-label">House #</label>
          <input
            className="dhc-form-input"
            type="text"
            value={houseNumber}
            onChange={(e) =>
              setHouseNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))
            }
            placeholder="12"
            readOnly={isEdit}
            required
          />
          {fieldErrors.houseNumber && (
            <div className="dhc-form-error">{fieldErrors.houseNumber}</div>
          )}
        </div>

        <div className="dhc-form-field">
          <label className="dhc-form-label">Suffix</label>
          <input
            className="dhc-form-input"
            type="text"
            value={suffix}
            onChange={(e) =>
              setSuffix(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))
            }
            placeholder="01"
            readOnly={isEdit}
            required
          />
          {fieldErrors.suffix && (
            <div className="dhc-form-error">{fieldErrors.suffix}</div>
          )}
        </div>
      </div>

      <div className="dhc-form-field">
        <label className="dhc-form-label">DigitalHome ID (computed)</label>
        <input
          className="dhc-form-input"
          type="text"
          value={computedId || "—"}
          readOnly
          style={{ fontFamily: "monospace", opacity: 0.8 }}
        />
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
          {saving ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save" : "Create"}
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
