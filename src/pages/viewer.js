import * as React from "react";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import ABoxGraph from "../components/ABoxGraph";
import ABoxInspector from "../components/ABoxInspector";
import { useTranslation } from "gatsby-plugin-react-i18next";
import { useSmartHome } from "../context/SmartHomeContext";
import { generateClient } from "aws-amplify/api";
import { requestDigitalHomeReadUrl } from "../graphql/mutations";
import { jsonldToGraph } from "../utils/jsonldToGraph";

const ViewerPage = () => {
  const { t } = useTranslation();
  const { activeHome } = useSmartHome();
  const [aboxData, setAboxData] = React.useState(null);
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const homeId = activeHome?.id;

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!homeId) {
      setAboxData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedNode(null);

    async function load() {
      try {
        const client = generateClient();
        const res = await client.graphql({
          query: requestDigitalHomeReadUrl,
          variables: { smartHomeId: homeId, fileName: "graph.jsonld" },
        });
        const url = res.data.requestDigitalHomeReadUrl.url;
        const fetched = await fetch(url);
        if (!fetched.ok) throw new Error(`S3 GET ${fetched.status}`);
        const doc = await fetched.json();
        if (!cancelled) {
          setAboxData(jsonldToGraph(doc));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("[Viewer] failed to load graph.jsonld:", err);
          setError(err?.errors?.[0]?.message || err?.message || String(err));
          setAboxData(null);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [homeId]);

  const handleAttachCatalogue = React.useCallback((node, catalogueItem) => {
    console.log(
      "[Viewer] Attach catalogue item",
      catalogueItem.title,
      "to node",
      node.label
    );
  }, []);

  const handleDetachCatalogue = React.useCallback((node, catalogueItem) => {
    console.log(
      "[Viewer] Detach catalogue item",
      catalogueItem.title,
      "from node",
      node.label
    );
  }, []);

  return (
    <Layout>
      <main className="dhc-main">
        <section className="dhc-hero">
          <h1 className="dhc-hero-title">{t("viewer.title")}</h1>
          <p className="dhc-hero-subtitle">
            {t("viewer.subtitle")}
            {homeId ? <> — <code>{homeId}</code></> : <> — no DigitalHome selected</>}
          </p>
        </section>

        {!homeId && (
          <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            Create or pick a DigitalHome in the Manager first.
          </p>
        )}
        {homeId && loading && (
          <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            Loading graph for {homeId}…
          </p>
        )}
        {homeId && error && !loading && (
          <p style={{ fontSize: "0.85rem", color: "#fca5a5" }}>
            Failed to load graph: {error}
          </p>
        )}

        {homeId && !loading && !error && (
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
        )}
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
