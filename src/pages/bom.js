import * as React from "react";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import { useTranslation } from "gatsby-plugin-react-i18next";
import { useSmartHome } from "../context/SmartHomeContext";
import { fetchABoxFromS3 } from "../utils/s3";
import frDemoAbox from "../data/demo/FR-DEMO-abox.json";
import { aboxToUnifilaireInput, MANIFEST } from "../export/dxf";

const DEMO_ABOX = { "FR-DEMO-01": frDemoAbox };

function buildBom(input) {
  const rows = [];
  const agcp = input.delivery.agcp;
  rows.push({
    category: "Protection",
    designation: "AGCP — disjoncteur de branchement",
    spec: `${agcp.rating} A`,
    qty: 1,
    iec: "S00214",
    nfc: "771.311",
  });

  const board = input.boards[0];
  const rcdGroups = new Map();
  for (const r of board.rcds) {
    const key = `${r.sensitivity}|${r.type}`;
    rcdGroups.set(key, (rcdGroups.get(key) || 0) + 1);
  }
  for (const [key, qty] of rcdGroups.entries()) {
    const [mA, type] = key.split("|");
    const blockName = `DDR_${mA}_${type}`;
    const entry = MANIFEST.blocks.find((b) => b.name === blockName);
    rows.push({
      category: "Protection",
      designation: entry?.label?.fr || `Interrupteur différentiel ${mA} mA type ${type}`,
      spec: `${mA} mA / type ${type}`,
      qty,
      iec: entry?.iec60617 || "",
      nfc: entry?.nfc15100 || "771.314",
    });
  }

  const breakerGroups = new Map();
  for (const c of board.circuits) {
    const key = `${c.breaker.rating}|${c.breaker.curve}`;
    breakerGroups.set(key, (breakerGroups.get(key) || 0) + 1);
  }
  for (const [key, qty] of breakerGroups.entries()) {
    const [rating, curve] = key.split("|");
    rows.push({
      category: "Protection",
      designation: "Disjoncteur modulaire (MCB)",
      spec: `${rating} A courbe ${curve}`,
      qty,
      iec: "S00216",
      nfc: "771.314",
    });
  }

  const wireGroups = new Map();
  for (const c of board.circuits) {
    const sec = c.wire.section;
    wireGroups.set(sec, (wireGroups.get(sec) || 0) + 1);
  }
  for (const [sec, qty] of wireGroups.entries()) {
    rows.push({
      category: "Câblage",
      designation: `Conducteur ${c_conductor()} — section ${formatSec(sec)} mm²`,
      spec: `${formatSec(sec)} mm²`,
      qty,
      iec: "",
      nfc: "771.524",
    });
  }

  for (const c of board.circuits) {
    rows.push({
      category: "Circuit",
      designation: c.label,
      spec: `${c.breaker.rating} A · ${formatSec(c.wire.section)} mm²`,
      qty: 1,
      iec: "",
      nfc: "",
      id: c.id,
    });
  }

  return rows;
}

function c_conductor() {
  return "cuivre";
}

function formatSec(n) {
  return Number.isInteger(n) ? `${n}` : String(n).replace(".", ",");
}

const BomPage = () => {
  const { t } = useTranslation();
  const { activeHome } = useSmartHome();
  const [aboxData, setAboxData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      let data = await fetchABoxFromS3(activeHome.id);
      if (!data && DEMO_ABOX[activeHome.id]) data = DEMO_ABOX[activeHome.id];
      if (!cancelled) {
        setAboxData(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeHome.id]);

  const rows = React.useMemo(() => {
    if (!aboxData) return null;
    try {
      return buildBom(aboxToUnifilaireInput(aboxData, activeHome.id));
    } catch (e) {
      console.error("[BOM] build failed", e);
      return null;
    }
  }, [aboxData, activeHome.id]);

  return (
    <Layout>
      <main className="dhc-main">
        <section className="dhc-hero">
          <h1 className="dhc-hero-title">{t("bom.title")}</h1>
          <p className="dhc-hero-subtitle">
            {t("bom.subtitle")} — {activeHome.id}
          </p>
        </section>

        <div className="dhc-manager-list">
          {loading && <p className="dhc-drawing-status">{t("bom.loading")}</p>}
          {!loading && !rows && (
            <p className="dhc-drawing-status">{t("bom.empty")}</p>
          )}
          {!loading && rows && (
            <table className="dhc-manager-table">
              <thead>
                <tr>
                  <th>{t("bom.col.category")}</th>
                  <th>{t("bom.col.designation")}</th>
                  <th>{t("bom.col.spec")}</th>
                  <th>{t("bom.col.qty")}</th>
                  <th>IEC 60617</th>
                  <th>NF C 15-100</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.category}</td>
                    <td>{r.designation}{r.id ? <span style={{ opacity: 0.6 }}> · {r.id}</span> : null}</td>
                    <td>{r.spec}</td>
                    <td>{r.qty}</td>
                    <td>{r.iec}</td>
                    <td>{r.nfc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default BomPage;

export const query = graphql`
  query BomPageQuery($language: String!) {
    locales: allLocale(filter: { language: { eq: $language } }) {
      edges { node { ns data language } }
    }
  }
`;
