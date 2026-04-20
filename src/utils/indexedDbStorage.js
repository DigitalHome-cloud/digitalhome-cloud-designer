const DB_NAME = "dhc-local";
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("manifests")) {
        db.createObjectStore("manifests", { keyPath: "smartHomeId" });
      }
      if (!db.objectStoreNames.contains("aboxes")) {
        db.createObjectStore("aboxes", { keyPath: "@id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, stores, mode = "readonly") {
  const t = db.transaction(stores, mode);
  return stores.length === 1 ? t.objectStore(stores[0]) : stores.map((s) => t.objectStore(s));
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalHome(smartHomeId, { manifest, realEstate, roleAssignment }) {
  const db = await openDb();
  const [mStore, aStore] = tx(db, ["manifests", "aboxes"], "readwrite");
  await Promise.all([
    reqToPromise(mStore.put({ ...manifest, smartHomeId, storage: "local" })),
    reqToPromise(aStore.put(realEstate)),
    reqToPromise(aStore.put(roleAssignment)),
  ]);
  db.close();
}

export async function listLocalHomes() {
  const db = await openDb();
  const store = tx(db, ["manifests"]);
  const result = await reqToPromise(store.getAll());
  db.close();
  return result;
}

export async function getLocalHome(smartHomeId) {
  const db = await openDb();
  const store = tx(db, ["manifests"]);
  const manifest = await reqToPromise(store.get(smartHomeId));
  if (!manifest) {
    db.close();
    return null;
  }
  const aStore = tx(db, ["aboxes"]);
  const realEstate = await reqToPromise(aStore.get(`urn:dh:${smartHomeId}`));
  const roleAssignment = await reqToPromise(aStore.get(`urn:dh:${smartHomeId}:roleassign:owner:01`));
  db.close();
  return { manifest, realEstate, roleAssignment };
}

export async function deleteLocalHome(smartHomeId) {
  const db = await openDb();
  const [mStore, aStore] = tx(db, ["manifests", "aboxes"], "readwrite");
  await Promise.all([
    reqToPromise(mStore.delete(smartHomeId)),
    reqToPromise(aStore.delete(`urn:dh:${smartHomeId}`)),
    reqToPromise(aStore.delete(`urn:dh:${smartHomeId}:roleassign:owner:01`)),
  ]);
  db.close();
}

export async function exportHomeBundle(smartHomeId) {
  const home = await getLocalHome(smartHomeId);
  if (!home) throw new Error(`Local home ${smartHomeId} not found`);

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  zip.file("bundle.json", JSON.stringify({
    bundleFormat: "dhc-bundle/1",
    smartHomeId,
    aboxVersion: "1.2.0",
    exportedAt: new Date().toISOString(),
    exportedByTier: "welcome",
  }, null, 2));

  zip.file("manifest.json", JSON.stringify(home.manifest, null, 2));

  const abox = zip.folder("abox");
  abox.file("realestate.jsonld", JSON.stringify(home.realEstate, null, 2));

  const roles = abox.folder("roleassignments");
  if (home.roleAssignment) {
    roles.file("owner-01.jsonld", JSON.stringify(home.roleAssignment, null, 2));
  }

  abox.folder("areas").file(".gitkeep", "");
  abox.folder("spaces").file(".gitkeep", "");
  abox.folder("equipment").file(".gitkeep", "");
  zip.folder("plans").file(".gitkeep", "");
  zip.folder("documents").file(".gitkeep", "");
  zip.folder("exports").file(".gitkeep", "");

  const blob = await zip.generateAsync({ type: "blob" });
  return blob;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
