import * as React from "react";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import ABoxGraph from "../components/ABoxGraph";
import ABoxInspector from "../components/ABoxInspector";
import { useTranslation } from "gatsby-plugin-react-i18next";
import { useSmartHome } from "../context/SmartHomeContext";
import { fetchABoxFromS3 } from "../utils/s3";
import frDemoAbox from "../data/demo/FR-DEMO-abox.json";

const DEMO_ABOX = {
  "FR-DEMO-01": frDemoAbox,
};

const ViewerPage = () => {
  const { t } = useTranslation();
  const { activeHome } = useSmartHome();
  const [aboxData, setAboxData] = React.useState(null);
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setSelectedNode(null);
      // Try S3 first, fall back to bundled demo data
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

  const handleAttachCatalogue = React.useCallback((node, catalogueItem) => {
    // In a full implementation, this would update the A-Box and re-save to S3.
    console.log("[Viewer] Attach catalogue item", catalogueItem.title, "to node", node.label);
  }, []);

  const handleDetachCatalogue = React.useCallback((node, catalogueItem) => {
    console.log("[Viewer] Detach catalogue item", catalogueItem.title, "from node", node.label);
  }, []);

  return (
    <Layout>
      <main className="dhc-main">
        <section className="dhc-hero">
          <h1 className="dhc-hero-title">{t("viewer.title")}</h1>
          <p className="dhc-hero-subtitle">
            {t("viewer.subtitle")} — {activeHome.id}
          </p>
        </section>

        <div className="dhc-viewer-layout">
          <ABoxGraph
            data={aboxData}
            onNodeSelect={setSelectedNode}
            selectedNode={selectedNode}
          />
          <ABoxInspector
            selectedNode={selectedNode}
            onAttachCatalogue={handleAttachCatalogue}
            onDetachCatalogue={handleDetachCatalogue}
          />
        </div>
      </main>
    </Layout>
  );
};

export default ViewerPage;

export const query = graphql`
  query ViewerPageQuery($language: String!) {
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
