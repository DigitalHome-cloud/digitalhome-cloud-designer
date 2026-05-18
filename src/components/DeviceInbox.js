import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSmartHome } from "../context/SmartHomeContext";
import { generateClient } from "aws-amplify/api";
import {
  listDeviceModels,
  listDeviceInstanceBySmartHomeId,
} from "../graphql/queries";
import {
  createDeviceModel,
  updateDeviceModel,
  createDeviceInstance,
  updateDeviceInstance,
} from "../graphql/mutations";
import { readInbox, writeInbox } from "../utils/s3";
import { CSV_TEMPLATE, rowsToInbox } from "../utils/csvTemplate";
import DeviceModelForm from "./DeviceModelForm";
import DeviceInstanceForm from "./DeviceInstanceForm";

/**
 * CSV mass-import inbox. Upload one combined CSV → devices/inbox.json, then a
 * two-stage review: Stage 1 Models (match by modelNumber), Stage 2 Devices
 * (match by serialNumber). Existing → prefilled modify, new → create.
 * Progress (`_status`) is persisted back to inbox.json after every action so
 * it survives reloads.
 */
const ownerIdOf = (user) =>
  user?.idTokenPayload?.sub || user?.userId || user?.username || null;

const StatusPill = ({ s }) => {
  const map = {
    pending: ["#64748b", "pending"],
    done: ["#16a34a", "done"],
    skipped: ["#b45309", "skipped"],
  };
  const [bg, label] = map[s] || map.pending;
  return (
    <span
      className="dhc-nav-pill"
      style={{ background: bg, color: "#fff", borderColor: bg }}
    >
      {label}
    </span>
  );
};

const DeviceInbox = () => {
  const { isAuthenticated, user, hasGroup } = useAuth();
  const { activeHome } = useSmartHome();
  const homeId = activeHome?.id || "";
  const isAdmin = hasGroup("dhc-admins");

  const [inbox, setInbox] = useState(null); // {importedAt, models, devices, skipped}
  const [models, setModels] = useState([]); // existing catalogue
  const [devices, setDevices] = useState([]); // existing instances (this home)
  const [stage, setStage] = useState("models"); // 'models' | 'devices'
  const [editing, setEditing] = useState(null); // {kind, row}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [note, setNote] = useState(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !homeId || typeof window === "undefined") return;
    setLoading(true);
    setError(null);
    try {
      const client = generateClient();
      const [mRes, dRes] = await Promise.all([
        client.graphql({ query: listDeviceModels }),
        client.graphql({
          query: listDeviceInstanceBySmartHomeId,
          variables: { smartHomeId: homeId },
        }),
      ]);
      setModels(mRes.data.listDeviceModels.items || []);
      setDevices(dRes.data.listDeviceInstanceBySmartHomeId.items || []);
      const existing = await readInbox(homeId);
      if (existing) setInbox(existing);
    } catch (err) {
      console.error("[DeviceInbox] load failed:", err);
      setError("Failed to load the inbox / catalogue.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, homeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "device-inventory-template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setNote(null);
    try {
      const Papa = (await import("papaparse")).default;
      const text = await file.text();
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });
      if (parsed.errors?.length) {
        setError(
          `CSV parse error (row ${parsed.errors[0].row}): ${parsed.errors[0].message}`
        );
        return;
      }
      const next = {
        importedAt: new Date().toISOString(),
        ...rowsToInbox(parsed.data),
      };
      await writeInbox(homeId, next);
      setInbox(next);
      setStage("models");
      setNote(
        `Imported ${next.models.length} model(s), ${next.devices.length} device(s)` +
          (next.skipped?.length
            ? ` — ${next.skipped.length} row(s) skipped (no modelNumber/serialNumber)`
            : "")
      );
    } catch (err) {
      setError(err?.message || String(err));
    }
  };

  const persist = async (nextInbox) => {
    setInbox(nextInbox);
    try {
      await writeInbox(homeId, nextInbox);
    } catch (err) {
      setError(`Saved locally but inbox.json write failed: ${err.message}`);
    }
  };

  const markRow = (kind, key, status) => {
    const list = kind === "model" ? "models" : "devices";
    const idField = kind === "model" ? "modelNumber" : "serialNumber";
    const next = {
      ...inbox,
      [list]: inbox[list].map((r) =>
        r[idField] === key ? { ...r, _status: status } : r
      ),
    };
    return persist(next);
  };

  const saveModel = async ({ _isEdit, ...input }) => {
    const client = generateClient();
    const exists = models.some((m) => m.modelNumber === input.modelNumber);
    await client.graphql({
      query: exists ? updateDeviceModel : createDeviceModel,
      variables: { input },
    });
    await markRow("model", input.modelNumber, "done");
    setEditing(null);
    const mRes = await client.graphql({ query: listDeviceModels });
    setModels(mRes.data.listDeviceModels.items || []);
  };

  const saveDevice = async (args) => {
    const client = generateClient();
    const existing = devices.find(
      (d) => d.serialNumber === args.serialNumber
    );
    if (existing) {
      const { id, ...rest } = args;
      await client.graphql({
        query: updateDeviceInstance,
        variables: { input: { id: existing.id, ...rest } },
      });
    } else {
      const ownerId = ownerIdOf(user);
      await client.graphql({
        query: createDeviceInstance,
        variables: {
          input: {
            smartHomeId: homeId,
            owners: ownerId ? [ownerId] : [],
            ...args,
          },
        },
      });
    }
    await markRow("device", args.serialNumber, "done");
    setEditing(null);
    const dRes = await client.graphql({
      query: listDeviceInstanceBySmartHomeId,
      variables: { smartHomeId: homeId },
    });
    setDevices(dRes.data.listDeviceInstanceBySmartHomeId.items || []);
  };

  if (!homeId) {
    return (
      <div className="dhc-manager-list">
        <p
          style={{
            textAlign: "center",
            padding: "1.5rem",
            color: "#9ca3af",
            fontSize: "0.9rem",
          }}
        >
          Select a SmartHome (Manager) to use the device import inbox.
        </p>
      </div>
    );
  }

  const modelRows = inbox?.models || [];
  const deviceRows = inbox?.devices || [];
  const modelsPending = modelRows.some((r) => r._status === "pending");

  return (
    <div className="dhc-manager-list">
      {/* Upload bar */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <span className="dhc-nav-pill" title="Active SmartHome">
          {homeId}
        </span>
        <button
          type="button"
          className="dhc-button-ghost"
          onClick={downloadTemplate}
        >
          Download CSV template
        </button>
        <label
          className="dhc-button-primary"
          style={{ cursor: "pointer", display: "inline-block" }}
        >
          Upload CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleUpload}
            style={{ display: "none" }}
            disabled={!isAuthenticated}
          />
        </label>
        <div style={{ flex: 1 }} />
        {inbox && (
          <>
            <button
              type="button"
              className={
                stage === "models"
                  ? "dhc-button-primary"
                  : "dhc-button-ghost"
              }
              onClick={() => setStage("models")}
            >
              1 · Models ({modelRows.length})
            </button>
            <button
              type="button"
              className={
                stage === "devices"
                  ? "dhc-button-primary"
                  : "dhc-button-ghost"
              }
              onClick={() => setStage("devices")}
              disabled={modelsPending}
              title={
                modelsPending
                  ? "Resolve all model rows first"
                  : undefined
              }
            >
              2 · Devices ({deviceRows.length})
            </button>
          </>
        )}
      </div>

      {note && (
        <p style={{ color: "#4ade80", fontSize: "0.85rem" }}>{note}</p>
      )}
      {error && (
        <p style={{ color: "#fca5a5", fontSize: "0.85rem" }}>{error}</p>
      )}
      {loading && (
        <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Loading…</p>
      )}

      {!inbox && !loading && (
        <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
          No inbox yet. Download the template, fill it in, and upload the CSV.
        </p>
      )}

      {editing && editing.kind === "model" && (
        <div style={{ marginBottom: "1.5rem" }}>
          <DeviceModelForm
            item={editing.row}
            onSave={saveModel}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}
      {editing && editing.kind === "device" && (
        <div style={{ marginBottom: "1.5rem" }}>
          <DeviceInstanceForm
            item={editing.row}
            models={models}
            onSave={saveDevice}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {inbox && !editing && stage === "models" && (
        <table className="dhc-manager-table">
          <thead>
            <tr>
              <th>Model #</th>
              <th>Brand</th>
              <th>Type</th>
              <th>In catalogue</th>
              <th>Row</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modelRows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "1.5rem", color: "#9ca3af" }}>
                  No model rows in this import.
                </td>
              </tr>
            ) : (
              modelRows.map((r) => {
                const exists = models.some(
                  (m) => m.modelNumber === r.modelNumber
                );
                return (
                  <tr key={r.modelNumber}>
                    <td style={{ fontFamily: "monospace" }}>
                      {r.modelNumber}
                    </td>
                    <td>{r.brand}</td>
                    <td>{r.deviceType}</td>
                    <td>
                      <span className="dhc-nav-pill">
                        {exists ? "exists → modify" : "new → create"}
                      </span>
                    </td>
                    <td>
                      <StatusPill s={r._status} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="dhc-button-ghost"
                        disabled={!isAdmin}
                        title={
                          !isAdmin
                            ? "Catalogue writes require dhc-admins"
                            : undefined
                        }
                        onClick={() =>
                          setEditing({ kind: "model", row: r })
                        }
                        style={{ marginRight: "0.4rem" }}
                      >
                        Process
                      </button>
                      <button
                        type="button"
                        className="dhc-button-ghost"
                        onClick={() =>
                          markRow("model", r.modelNumber, "skipped")
                        }
                      >
                        Skip
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}

      {inbox && !editing && stage === "devices" && (
        <table className="dhc-manager-table">
          <thead>
            <tr>
              <th>Serial</th>
              <th>Model #</th>
              <th>Type</th>
              <th>State</th>
              <th>Row</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deviceRows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "1.5rem", color: "#9ca3af" }}>
                  No device rows in this import.
                </td>
              </tr>
            ) : (
              deviceRows.map((r) => {
                const exists = devices.some(
                  (d) => d.serialNumber === r.serialNumber
                );
                return (
                  <tr key={r.serialNumber}>
                    <td style={{ fontFamily: "monospace" }}>
                      {r.serialNumber}
                    </td>
                    <td>{r.modelNumber}</td>
                    <td>{r.deviceType}</td>
                    <td>
                      <span className="dhc-nav-pill">
                        {exists ? "exists → modify" : "new → create"}
                      </span>
                    </td>
                    <td>
                      <StatusPill s={r._status} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="dhc-button-ghost"
                        onClick={() =>
                          setEditing({ kind: "device", row: r })
                        }
                        style={{ marginRight: "0.4rem" }}
                      >
                        Process
                      </button>
                      <button
                        type="button"
                        className="dhc-button-ghost"
                        onClick={() =>
                          markRow("device", r.serialNumber, "skipped")
                        }
                      >
                        Skip
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DeviceInbox;
