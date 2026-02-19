import * as React from "react";
import { useSmartHome } from "../context/SmartHomeContext";
import { getDemoData } from "../data/demo-instance-data";
import InstanceSidebar from "./InstanceSidebar";
import InstanceGraph from "./InstanceGraph";
import CatalogPanel from "./CatalogPanel";

const ALL_VIEWS = new Set([
  "spatial", "building", "electrical", "plumbing",
  "heating", "network", "governance", "automation",
]);

/**
 * Transforms SmartHomeNode records (from GraphQL) into graph data
 * suitable for ForceGraph3D: { nodes, links }.
 */
function buildGraphData(smartHomeNodes) {
  const nodes = smartHomeNodes.map((n) => ({
    id: n.id,
    nodeId: n.nodeId,
    label: n.label,
    nodeType: n.nodeType,
    view: n.designView || "other",
    designView: n.designView,
    catalogItemId: n.catalogItemId,
    catalogItem: n.catalogItem,
    properties: n.properties,
  }));

  const links = [];
  for (const n of smartHomeNodes) {
    if (n.parentNodeId) {
      links.push({
        source: n.parentNodeId,
        target: n.id,
        type: n.linkType || "contains",
      });
    }
  }

  return { nodes, links };
}

const BuilderTab = () => {
  const { activeHome } = useSmartHome();
  const [smartHomeNodes, setSmartHomeNodes] = React.useState([]);
  const [catalogItems, setCatalogItems] = React.useState([]);
  const [selectedNodeId, setSelectedNodeId] = React.useState(null);
  const [visibleViews, setVisibleViews] = React.useState(new Set(ALL_VIEWS));
  const [loading, setLoading] = React.useState(false);

  // Fetch instance nodes from GraphQL when activeHome changes
  React.useEffect(() => {
    if (!activeHome) return;

    const fetchNodes = async () => {
      setLoading(true);
      try {
        const { generateClient } = await import("aws-amplify/api");
        const client = generateClient();

        // Fetch nodes for this SmartHome
        const nodesResult = await client.graphql({
          query: /* GraphQL */ `
            query NodesBySmartHome($smartHomeId: String!) {
              nodesBySmartHome(smartHomeId: $smartHomeId) {
                items {
                  id
                  smartHomeId
                  nodeId
                  nodeType
                  label
                  designView
                  catalogItemId
                  catalogItem {
                    id
                    sku
                    brand
                    model
                    category
                    description
                    specs
                    imageUrl
                    designView
                  }
                  properties
                  parentNodeId
                  linkType
                }
              }
            }
          `,
          variables: { smartHomeId: activeHome.id },
        });
        setSmartHomeNodes(nodesResult.data?.nodesBySmartHome?.items || []);

        // Fetch catalog items
        const catalogResult = await client.graphql({
          query: /* GraphQL */ `
            query ListCatalogItems {
              listCatalogItems {
                items {
                  id
                  sku
                  brand
                  model
                  category
                  description
                  specs
                  imageUrl
                  designView
                }
              }
            }
          `,
        });
        setCatalogItems(catalogResult.data?.listCatalogItems?.items || []);
      } catch (err) {
        // GraphQL not deployed yet — fall back to demo data
        console.warn("Builder: GraphQL fetch failed, using demo data:", err.message || err);
        const demo = getDemoData(activeHome.id);
        setSmartHomeNodes(demo.nodes);
        setCatalogItems(demo.catalogItems);
      } finally {
        setLoading(false);
      }
    };

    fetchNodes();
  }, [activeHome]);

  const graphData = React.useMemo(
    () => buildGraphData(smartHomeNodes),
    [smartHomeNodes]
  );

  const selectedNode = selectedNodeId
    ? graphData.nodes.find((n) => n.id === selectedNodeId) || null
    : null;

  const handleToggleView = (view) => {
    setVisibleViews((prev) => {
      const next = new Set(prev);
      if (next.has(view)) next.delete(view);
      else next.add(view);
      return next;
    });
  };

  const handleAssign = async (nodeId, catalogItemId) => {
    try {
      const { generateClient } = await import("aws-amplify/api");
      const client = generateClient();
      await client.graphql({
        query: /* GraphQL */ `
          mutation UpdateSmartHomeNode($input: UpdateSmartHomeNodeInput!) {
            updateSmartHomeNode(input: $input) {
              id
              catalogItemId
            }
          }
        `,
        variables: { input: { id: nodeId, catalogItemId } },
      });
      // Update local state
      setSmartHomeNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? { ...n, catalogItemId, catalogItem: catalogItems.find((c) => c.id === catalogItemId) || null }
            : n
        )
      );
    } catch (err) {
      console.error("Assign catalog item failed:", err);
    }
  };

  const handleUnassign = async (nodeId) => {
    try {
      const { generateClient } = await import("aws-amplify/api");
      const client = generateClient();
      await client.graphql({
        query: /* GraphQL */ `
          mutation UpdateSmartHomeNode($input: UpdateSmartHomeNodeInput!) {
            updateSmartHomeNode(input: $input) {
              id
              catalogItemId
            }
          }
        `,
        variables: { input: { id: nodeId, catalogItemId: null } },
      });
      setSmartHomeNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, catalogItemId: null, catalogItem: null } : n
        )
      );
    } catch (err) {
      console.error("Unassign catalog item failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="dhc-workspace dhc-workspace--three-columns">
        <div className="dhc-graph-loading">
          <span>Loading instance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dhc-workspace dhc-workspace--three-columns">
      <InstanceSidebar
        graphData={graphData}
        visibleViews={visibleViews}
        onToggleView={handleToggleView}
        onShowAll={() => setVisibleViews(new Set(ALL_VIEWS))}
        onHideAll={() => setVisibleViews(new Set())}
        onNodeSelect={setSelectedNodeId}
        selectedNode={selectedNodeId}
      />
      <div className="dhc-graph-panel">
        <InstanceGraph
          graphData={graphData}
          visibleViews={visibleViews}
          onNodeClick={setSelectedNodeId}
          selectedNode={selectedNodeId}
        />
      </div>
      <CatalogPanel
        selectedNode={selectedNode}
        catalogItems={catalogItems}
        onAssign={handleAssign}
        onUnassign={handleUnassign}
      />
    </div>
  );
};

export default BuilderTab;
