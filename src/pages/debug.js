import * as React from "react";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import { useSmartHome } from "../context/SmartHomeContext";
import frDemoAbox from "../data/demo/FR-DEMO-abox.json";
import dxfManifest from "../export/dxf/library/manifest.json";
import { useAuth } from "../context/AuthContext";
import { generateShellWorkspace } from "../utils/shellGenerator";

/**
 * Content/artifact inspector. For the active SmartHome, list the data files
 * that back each view (A-Box, workspace, TTL, toolbox, manifest, generated
 * DXF) and show where each one lives — bundled locally or on S3 under the
 * Amplify Storage `public/` prefix.
 */

const BUCKET_ENV = typeof process !== "undefined" ? process.env.GATSBY_S3_BUCKET || "" : "";
const REGION_ENV = typeof process !== "undefined" ? process.env.GATSBY_AWS_REGION || "eu-west-1" : "eu-west-1";

function s3UrlHint(key) {
  if (!BUCKET_ENV) return `s3://<bucket>/${key}`;
  return `https://${BUCKET_ENV}.s3.${REGION_ENV}.amazonaws.com/${key}`;
}

function formatBytes(n) {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function ArtifactRow({ artifact, canUpload }) {
  const [status, setStatus] = React.useState(artifact.initialStatus || "unknown");
  const [size, setSize] = React.useState(artifact.initialSize ?? null);
  const [preview, setPreview] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const check = React.useCallback(async () => {
    if (!artifact.s3Key) return;
    setStatus("checking");
    setError(null);
    try {
      const { downloadData } = await import("aws-amplify/storage");
      const result = await downloadData({ path: artifact.s3Key }).result;
      const text = await result.body.text();
      setSize(text.length);
      setPreview(text.slice(0, 600));
      setStatus("present");
    } catch (err) {
      setStatus("missing");
      setError(err.message || String(err));
    }
  }, [artifact.s3Key]);

  const upload = React.useCallback(async () => {
    if (!artifact.s3Key || !artifact.getLocal) return;
    setBusy(true);
    setError(null);
    try {
      const text = artifact.getLocal();
      const { uploadData } = await import("aws-amplify/storage");
      await uploadData({
        path: artifact.s3Key,
        data: text,
        options: { contentType: artifact.contentType || "application/json" },
      }).result;
      setSize(text.length);
      setPreview(text.slice(0, 600));
      setStatus("present");
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }, [artifact.s3Key, artifact.getLocal, artifact.contentType]);

  return (
    <>
      <tr>
        <td>
          <strong>{artifact.name}</strong>
          <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>{artifact.role}</div>
        </td>
        <td>
          <span className="dhc-nav-pill">
            {artifact.location}
          </span>
        </td>
        <td>
          <code style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>
            {artifact.path}
          </code>
          {artifact.s3Key && (
            <div style={{ fontSize: "0.7rem", opacity: 0.6, marginTop: "0.25rem" }}>
              {s3UrlHint(artifact.s3Key)}
            </div>
          )}
        </td>
        <td>
          <StatusPill status={status} />
          {size != null && (
            <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>{formatBytes(size)}</div>
          )}
        </td>
        <td>
          {artifact.s3Key && (
            <button
              type="button"
              className="dhc-button-ghost"
              onClick={check}
              style={{ marginRight: "0.25rem" }}
            >
              Probe
            </button>
          )}
          {artifact.getLocal && (
            <button
              type="button"
              className="dhc-button-ghost"
              onClick={() => {
                try {
                  const text = artifact.getLocal();
                  setPreview(text.slice(0, 600));
                  setSize(text.length);
                } catch (e) {
                  setError(e.message);
                }
              }}
              style={{ marginRight: "0.25rem" }}
            >
              Show
            </button>
          )}
          {artifact.s3Key && artifact.getLocal && canUpload && (
            <button
              type="button"
              className="dhc-button-primary"
              onClick={upload}
              disabled={busy}
              title="Upload bundled artifact to S3 (authenticated only)"
            >
              {busy ? "Uploading…" : "Upload to S3"}
            </button>
          )}
        </td>
      </tr>
      {(preview || error) && (
        <tr>
          <td colSpan={5} style={{ background: "rgba(15, 23, 42, 0.6)" }}>
            {error && <p style={{ color: "#fca5a5", fontSize: "0.8rem" }}>{error}</p>}
            {preview && (
              <pre style={{
                fontSize: "0.7rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxHeight: "200px",
                overflow: "auto",
                margin: 0,
              }}>{preview}{preview.length >= 600 ? "\n…" : ""}</pre>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function StatusPill({ status }) {
  const color = {
    present: "#16a34a",
    missing: "#b91c1c",
    checking: "#2563eb",
    bundled: "#0891b2",
    generated: "#7c3aed",
    unknown: "#64748b",
  }[status] || "#64748b";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.15rem 0.5rem",
        background: color,
        color: "white",
        borderRadius: "0.3rem",
        fontSize: "0.7rem",
        fontWeight: 600,
        textTransform: "uppercase",
      }}
    >
      {status}
    </span>
  );
}

const DebugPage = () => {
  const { activeHome } = useSmartHome();
  const { isAuthenticated } = useAuth();
  const id = activeHome.id;
  const isDemo = activeHome.isDemo;
  const country = id ? id.split("-")[0] || "FR" : "FR";

  // Step-1 layout (abox.md): real homes go to Private/, demo homes to Public/.
  // Both use the same `DigitalHomes/<id>/{designtime,data}/...` shape.
  const root = isDemo ? "Public" : "Private";
  const homePrefix = id ? `${root}/DigitalHomes/${id}` : "";
  const designtimePrefix = id ? `${homePrefix}/designtime` : "";
  const dataPrefix = id ? `${homePrefix}/data` : "";

  const isDemoWithBundle = id === "FR-DEMO-01";

  const perHome = id
    ? [
        {
          name: "A-Box TTL",
          role: "Step-1 turtle authored by createDigitalHome Lambda",
          location: "S3",
          path: `${designtimePrefix}/abox.ttl`,
          s3Key: `${designtimePrefix}/abox.ttl`,
          contentType: "text/turtle",
        },
        {
          name: "A-Box graph (JSON-LD)",
          role: "Step-1 JSON-LD with inline @context — same triples as abox.ttl",
          location: "S3",
          path: `${designtimePrefix}/graph.jsonld`,
          s3Key: `${designtimePrefix}/graph.jsonld`,
          contentType: "application/ld+json",
        },
        {
          name: "Data folder placeholder",
          role: "Marker so .../data/ exists; runtime telemetry will land here",
          location: "S3",
          path: `${dataPrefix}/.keep`,
          s3Key: `${dataPrefix}/.keep`,
          contentType: "application/octet-stream",
        },
        {
          name: "A-Box JSON (legacy)",
          role: "Pre-step-1 viewer/drawing/BOM consumer — to be replaced by graph.jsonld in step 2",
          location: "S3",
          path: `public/smarthomes/${id}/design/abox.json`,
          s3Key: `public/smarthomes/${id}/design/abox.json`,
          contentType: "application/json",
          ...(isDemoWithBundle
            ? { getLocal: () => JSON.stringify(frDemoAbox, null, 2) }
            : {}),
        },
        {
          name: "Blockly workspace (legacy)",
          role: "Pre-step-1 design workspace — replaced by step-2 spatial designer",
          location: "S3",
          path: `public/smarthomes/${id}/design/workspace.json`,
          s3Key: `public/smarthomes/${id}/design/workspace.json`,
          contentType: "application/json",
          getLocal: () =>
            JSON.stringify(generateShellWorkspace(id, country), null, 2),
        },
      ]
    : [];

  const shared = [
    {
      name: "Blockly toolbox",
      role: "Toolbox config generated from T-Box",
      location: "S3",
      path: "public/ontology/latest/blockly-toolbox.json",
      s3Key: "public/ontology/latest/blockly-toolbox.json",
    },
    {
      name: "Blockly blocks",
      role: "Block definitions generated from T-Box",
      location: "S3",
      path: "public/ontology/latest/blockly-blocks.json",
      s3Key: "public/ontology/latest/blockly-blocks.json",
    },
    {
      name: "DXF block manifest",
      role: "Catalogue of frames / symbols / circuits + IEC/NFC refs",
      location: "Local",
      path: "src/export/dxf/library/manifest.json",
      initialStatus: "bundled",
      initialSize: JSON.stringify(dxfManifest).length,
      getLocal: () => JSON.stringify(dxfManifest, null, 2),
    },
    {
      name: "DXF unifilaire",
      role: "Generated client-side from A-Box (not persisted)",
      location: "Generated",
      path: `(client) exportUnifilaireFromAbox(abox, "${id}")`,
      initialStatus: "generated",
    },
    {
      name: "DXF library.dxf",
      role: "Generated client-side from manifest; future S3 sync under s3://dhc-ontology/<version>/dxf/",
      location: "Generated",
      path: "(client) exportLibrary()  /  s3://dhc-ontology/<manifest.version>/dxf/library.dxf (future)",
      initialStatus: "generated",
    },
  ];

  return (
    <Layout>
      <main className="dhc-main">
        <section className="dhc-hero">
          <h1 className="dhc-hero-title">Debug — Content Artifacts</h1>
          <p className="dhc-hero-subtitle">
            {id ? (
              <>
                Active DigitalHome <code>{id}</code>{" "}
                <span className="dhc-nav-pill" style={{ marginLeft: "0.4rem" }}>
                  {isDemo ? "Public/ (demo)" : "Private/ (real)"}
                </span>
                <br />
                Step-1 files live under <code>{homePrefix}/</code>. Probe currently fails for <code>Private/</code> and <code>Public/DigitalHomes/</code> paths because storage rules haven&apos;t been opened to clients — verify via AWS Console or CLI for now.
              </>
            ) : (
              <>No DigitalHome selected. Create one in the Manager to see its S3 layout.</>
            )}
          </p>
        </section>

        <div className="dhc-manager-list">
          <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.5rem" }}>
            Per SmartHome
          </h3>
          <table className="dhc-manager-table">
            <thead>
              <tr>
                <th>Artifact</th>
                <th>Where</th>
                <th>Path</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {perHome.map((a) => (
                <ArtifactRow key={a.name} artifact={a} canUpload={isAuthenticated} />
              ))}
            </tbody>
          </table>

          <h3 style={{ fontSize: "0.95rem", margin: "1.5rem 0 0.5rem" }}>
            Shared across SmartHomes
          </h3>
          <table className="dhc-manager-table">
            <thead>
              <tr>
                <th>Artifact</th>
                <th>Where</th>
                <th>Path</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shared.map((a) => (
                <ArtifactRow key={a.name} artifact={a} canUpload={isAuthenticated} />
              ))}
            </tbody>
          </table>

          <p style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "1rem" }}>
            <strong>Probe</strong> — check an S3 object exists and preview its
            first 600 characters. <strong>Show</strong> — inspect a bundled
            local artifact. <strong>Upload to S3</strong> — push the bundled
            artifact to its S3 path (signed-in users only).
            {!isAuthenticated && (
              <> Currently signed out — upload is disabled.</>
            )}
          </p>
        </div>
      </main>
    </Layout>
  );
};

export default DebugPage;

export const query = graphql`
  query DebugPageQuery($language: String!) {
    locales: allLocale(filter: { language: { eq: $language } }) {
      edges { node { ns data language } }
    }
  }
`;
