import React, { useState, useMemo } from "react";
import { DEVICE_CATEGORIES } from "../constants/deviceTypes";
import { uploadCatalogueAsset, catalogueAssetPath } from "../utils/s3";

/**
 * Create / view / edit a DeviceModel (catalogue). Reused by DeviceCatalogue
 * and Inbox Stage-1. `modelNumber` is the identifier → read-only on edit.
 *
 * v3: capability checkboxes (Actor/Sensor/Controller/IOT — flat booleans,
 * mapped via manifest, NOT T-Box); multi-doc + single-image upload to
 * public/catalogue/devices/<deviceType>/<modelNumber>/{docs,img}; a small
 * client-generated data-URL `thumbnail` for list views; mode = view | edit
 * with an in-form toggle.
 *
 * Non-rendered schema fields (region, standards, compatibleClasses,
 * s3SpecsPath) are preserved from `item` on save.
 */
const PASSTHROUGH = ["region", "standards", "compatibleClasses", "s3SpecsPath"];
const CAPS = [
  ["hasActorCapability", "Actor"],
  ["hasSensorCapability", "Sensor"],
  ["hasControllerCapability", "Controller"],
  ["hasIOTCapability", "IOT (connectable)"],
];
const THUMB_MAX = 96;

// Downscale an image File → small JPEG data URL (browser-only; called from a
// change handler, never at SSR).
function makeThumbnail(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, THUMB_MAX / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try {
        resolve(c.toDataURL("image/jpeg", 0.6));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

const DeviceModelForm = ({
  item,
  mode = "edit",
  canEdit = true,
  onSave,
  onCancel,
}) => {
  const isEdit = !!item?.modelNumber;
  const [editing, setEditing] = useState(mode !== "view" && canEdit);

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
  const [caps, setCaps] = useState(() =>
    Object.fromEntries(CAPS.map(([k]) => [k, !!item?.[k]]))
  );
  const [docFiles, setDocFiles] = useState([]); // File[]
  const [imageFile, setImageFile] = useState(null); // File | null
  const [thumb, setThumb] = useState(item?.thumbnail || null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const ro = !editing; // read-only (view mode)
  const subTypes = useMemo(
    () => DEVICE_CATEGORIES.find((c) => c.id === category)?.subTypes || [],
    [category]
  );
  const canSubmit =
    !!modelNumber.trim() && !!brand.trim() && !!deviceType && !saving;

  const onImage = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    try {
      setThumb(await makeThumbnail(f));
    } catch {
      setSubmitError("Could not generate a preview from that image.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setSubmitError(null);
    try {
      const mn = modelNumber.trim();
      let s3DocPath = item?.s3DocPath || null;
      let s3ImgPath = item?.s3ImgPath || null;

      // Uploads go to the world-readable, admin-write public/catalogue prefix.
      for (const df of docFiles) {
        await uploadCatalogueAsset(
          deviceType,
          mn,
          "docs",
          df.name,
          df,
          df.type || "application/octet-stream"
        );
        s3DocPath = catalogueAssetPath(deviceType, mn, "docs", "").replace(
          /\/$/,
          ""
        );
      }
      if (imageFile) {
        const ext = (imageFile.name.split(".").pop() || "img").toLowerCase();
        await uploadCatalogueAsset(
          deviceType,
          mn,
          "img",
          `cover.${ext}`, // single fixed name → one image (re-upload replaces)
          imageFile,
          imageFile.type || "application/octet-stream"
        );
        s3ImgPath = catalogueAssetPath(deviceType, mn, "img", "").replace(
          /\/$/,
          ""
        );
      }

      const passthrough = {};
      for (const k of PASSTHROUGH)
        if (item && item[k] != null) passthrough[k] = item[k];

      await onSave({
        modelNumber: mn,
        brand: brand.trim(),
        category,
        deviceType,
        description: description.trim() || null,
        ...caps,
        s3DocPath,
        s3ImgPath,
        thumbnail: thumb || null,
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
            ? "Add catalogue model"
            : ro
            ? `View model ${item.modelNumber}`
            : `Modify model ${item.modelNumber}`}
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

      <div className="dhc-form-field">
        <label className="dhc-form-label">Model number</label>
        <input
          className="dhc-form-input"
          value={modelNumber}
          onChange={(e) => setModelNumber(e.target.value)}
          placeholder="ACME-NVR-8CH"
          readOnly={isEdit || ro}
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
          readOnly={ro}
          required
        />
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}
      >
        <div className="dhc-form-field">
          <label className="dhc-form-label">Category</label>
          <select
            className="dhc-form-input"
            value={category}
            disabled={ro}
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
            disabled={ro}
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
          readOnly={ro}
        />
      </div>

      <div className="dhc-form-field">
        <label className="dhc-form-label">Capabilities</label>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {CAPS.map(([k, lbl]) => (
            <label
              key={k}
              style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem" }}
            >
              <input
                type="checkbox"
                checked={!!caps[k]}
                disabled={ro}
                onChange={(e) =>
                  setCaps((c) => ({ ...c, [k]: e.target.checked }))
                }
              />
              {lbl}
            </label>
          ))}
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}
      >
        <div className="dhc-form-field">
          <label className="dhc-form-label">Image (one)</label>
          {!ro && (
            <input type="file" accept="image/*" onChange={onImage} />
          )}
          {thumb ? (
            <img
              src={thumb}
              alt="preview"
              style={{
                marginTop: "0.4rem",
                width: 64,
                height: 64,
                objectFit: "cover",
                borderRadius: "0.4rem",
                border: "1px solid rgba(148,163,184,0.3)",
              }}
            />
          ) : (
            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
              {item?.s3ImgPath ? "image uploaded" : "no image"}
            </span>
          )}
        </div>
        <div className="dhc-form-field">
          <label className="dhc-form-label">Docs (one or more)</label>
          {!ro && (
            <input
              type="file"
              multiple
              onChange={(e) => setDocFiles(Array.from(e.target.files || []))}
            />
          )}
          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
            {docFiles.length
              ? `${docFiles.length} file(s) to upload`
              : item?.s3DocPath
              ? "docs uploaded"
              : "no docs"}
          </span>
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

export default DeviceModelForm;
