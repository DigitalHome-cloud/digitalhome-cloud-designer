import * as React from "react";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import { useTranslation } from "gatsby-plugin-react-i18next";
import { useSmartHome } from "../context/SmartHomeContext";
import { fetchABoxFromS3 } from "../utils/s3";
import frDemoAbox from "../data/demo/FR-DEMO-abox.json";
import {
  exportUnifilaireFromAbox,
  exportUnifilaireFromAboxSvg,
  downloadDxf,
} from "../export/dxf";

const ADVANCED_ENABLED = process.env.GATSBY_FEATURE_DXF_VIEWER === "true";
const DxfAdvancedPreview = ADVANCED_ENABLED
  ? React.lazy(() => import("../components/DxfAdvancedPreview"))
  : null;

const DEMO_ABOX = {
  "FR-DEMO-01": frDemoAbox,
};

const DrawingPage = () => {
  const { t } = useTranslation();
  const { activeHome } = useSmartHome();
  const [aboxData, setAboxData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [mode, setMode] = React.useState("simple");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      let data = await fetchABoxFromS3(activeHome.id);
      if (!data && DEMO_ABOX[activeHome.id]) {
        data = DEMO_ABOX[activeHome.id];
      }
      if (!cancelled) {
        setAboxData(data);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeHome.id]);

  const { svg, dxf } = React.useMemo(() => {
    if (!aboxData) return { svg: null, dxf: null };
    try {
      return {
        svg: exportUnifilaireFromAboxSvg(aboxData, activeHome.id),
        dxf: exportUnifilaireFromAbox(aboxData, activeHome.id),
      };
    } catch (e) {
      console.error("[Drawing] render failed", e);
      return { svg: null, dxf: null };
    }
  }, [aboxData, activeHome.id]);

  const handleDownload = () => {
    if (!dxf) return;
    downloadDxf(dxf, `unifilaire-${activeHome.id}.dxf`);
  };

  return (
    <Layout>
      <main className="dhc-main">
        <section className="dhc-hero">
          <h1 className="dhc-hero-title">{t("drawing.title")}</h1>
          <p className="dhc-hero-subtitle">
            {t("drawing.subtitle")} — {activeHome.id}
          </p>
        </section>

        <div className="dhc-drawing-layout">
          <div className="dhc-drawing-toolbar">
            <button
              type="button"
              className="dhc-btn dhc-btn--primary"
              onClick={handleDownload}
              disabled={!dxf}
            >
              {t("drawing.download")}
            </button>
            {ADVANCED_ENABLED && (
              <div className="dhc-drawing-mode">
                <button
                  type="button"
                  className={`dhc-btn ${mode === "simple" ? "dhc-btn--primary" : ""}`}
                  onClick={() => setMode("simple")}
                >
                  Simple
                </button>
                <button
                  type="button"
                  className={`dhc-btn ${mode === "advanced" ? "dhc-btn--primary" : ""}`}
                  onClick={() => setMode("advanced")}
                >
                  Advanced
                </button>
              </div>
            )}
          </div>
          <div className="dhc-drawing-preview">
            {loading && <p className="dhc-drawing-status">{t("drawing.loading")}</p>}
            {!loading && !svg && (
              <p className="dhc-drawing-status">{t("drawing.empty")}</p>
            )}
            {!loading && svg && mode === "simple" && (
              <div
                className="dhc-drawing-svg"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            )}
            {!loading && dxf && mode === "advanced" && DxfAdvancedPreview && (
              <React.Suspense fallback={<p className="dhc-drawing-status">{t("drawing.loading")}</p>}>
                <DxfAdvancedPreview dxfText={dxf} />
              </React.Suspense>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default DrawingPage;

export const query = graphql`
  query DrawingPageQuery($language: String!) {
    locales: allLocale(filter: { language: { eq: $language } }) {
      edges {
        node {
          ns
          data
          language
        }
      }
    }
  }
`;
