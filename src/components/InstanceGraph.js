import * as React from "react";

const VIEW_COLORS = {
  spatial: "#22c55e",
  building: "#f59e0b",
  electrical: "#3b82f6",
  plumbing: "#06b6d4",
  heating: "#ef4444",
  network: "#a855f7",
  governance: "#f97316",
  automation: "#ec4899",
};
const DEFAULT_COLOR = "#e5e7eb";

const LINK_STYLES = {
  hasSpace: { color: "#22c55e88", width: 1.2, particles: 1, particleColor: "#22c55e" },
  feedsEquipment: { color: "#3b82f688", width: 1.2, particles: 2, particleColor: "#3b82f6" },
  hasEquipment: { color: "#f59e0b88", width: 1.0, particles: 1, particleColor: "#f59e0b" },
};
const DEFAULT_LINK_STYLE = { color: "#64748b", width: 0.8, particles: 0, particleColor: null };

const InstanceGraph = ({ graphData, visibleViews, onNodeClick, selectedNode }) => {
  const containerRef = React.useRef(null);
  const graphRef = React.useRef(null);
  const ForceGraph3DRef = React.useRef(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    import("react-force-graph-3d").then((mod) => {
      if (!cancelled) {
        ForceGraph3DRef.current = mod.default;
        setReady(true);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const processedData = React.useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };

    const nodes = graphData.nodes
      .filter((n) => {
        if (visibleViews && n.view && !visibleViews.has(n.view)) return false;
        return true;
      })
      .map((n) => ({
        ...n,
        _color: VIEW_COLORS[n.view] || DEFAULT_COLOR,
        _size: n.nodeType === "Space" ? 8 : 5,
      }));

    const nodeIds = new Set(nodes.map((n) => n.id));
    const links = graphData.links.filter(
      (l) => nodeIds.has(l.source?.id || l.source) && nodeIds.has(l.target?.id || l.target)
    ).map((l) => ({ ...l }));

    return { nodes, links };
  }, [graphData, visibleViews]);

  React.useEffect(() => {
    if (!selectedNode || !graphRef.current) return;
    const node = processedData.nodes.find((n) => n.id === selectedNode);
    if (node && node.x !== undefined) {
      graphRef.current.cameraPosition(
        { x: node.x + 80, y: node.y + 40, z: node.z + 80 },
        { x: node.x, y: node.y, z: node.z },
        1000
      );
    }
  }, [selectedNode, processedData.nodes]);

  if (!ready || !ForceGraph3DRef.current) {
    return (
      <div className="dhc-graph-loading">
        <span>Initializing 3D engine...</span>
      </div>
    );
  }

  const ForceGraph3D = ForceGraph3DRef.current;
  const getLinkStyle = (link) => LINK_STYLES[link.type] || DEFAULT_LINK_STYLE;

  return (
    <div ref={containerRef} className="dhc-graph-container">
      <ForceGraph3D
        ref={graphRef}
        graphData={processedData}
        backgroundColor="#020617"
        nodeLabel={(node) => `${node.label} (${node.nodeType})`}
        nodeVal={(node) => node._size}
        nodeColor={() => "#000000"}
        nodeOpacity={0}
        nodeResolution={16}
        linkColor={(link) => getLinkStyle(link).color}
        linkWidth={(link) => getLinkStyle(link).width}
        linkOpacity={0.6}
        linkDirectionalParticles={(link) => getLinkStyle(link).particles}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={(link) => getLinkStyle(link).particleColor}
        linkLabel={(link) => link.type || ""}
        onNodeClick={(node) => {
          if (onNodeClick) onNodeClick(node.id);
        }}
        onNodeRightClick={(node, event) => {
          event.preventDefault();
          if (graphRef.current) {
            graphRef.current.zoomToFit(400, 50);
          }
        }}
        nodeThreeObjectExtend={false}
        nodeThreeObject={(node) => {
          if (typeof window === "undefined") return null;
          const THREE = require("three");

          let geometry;
          if (node.nodeType === "Space") {
            geometry = new THREE.SphereGeometry(5, 16, 16);
          } else if (node.nodeType === "Circuit" || node.nodeType === "Group") {
            geometry = new THREE.OctahedronGeometry(4);
          } else {
            geometry = new THREE.BoxGeometry(5, 5, 5);
          }

          const material = new THREE.MeshLambertMaterial({
            color: node._color,
            transparent: true,
            opacity: 0.9,
          });
          const mesh = new THREE.Mesh(geometry, material);

          const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: createTextTexture(node.label, node._color),
              transparent: true,
              depthWrite: false,
            })
          );
          sprite.scale.set(24, 6, 1);
          sprite.position.set(0, 8, 0);

          const group = new THREE.Group();
          group.add(mesh);
          group.add(sprite);
          return group;
        }}
        warmupTicks={50}
        cooldownTime={3000}
      />
    </div>
  );
};

function createTextTexture(text, color) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 64;

  ctx.fillStyle = "transparent";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "bold 24px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, 128, 32);

  const THREE = require("three");
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default InstanceGraph;
