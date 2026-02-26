import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";

const VIEW_COLOURS = {
  spatial: "#22c55e",
  building: "#f59e0b",
  electrical: "#3b82f6",
  plumbing: "#06b6d4",
  heating: "#ef4444",
  network: "#a855f7",
  governance: "#f97316",
  automation: "#ec4899",
  shared: "#e5e7eb",
};

const ABoxGraph = ({ data, onNodeSelect, selectedNode }) => {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const [ForceGraph, setForceGraph] = useState(null);

  // Dynamic import for SSR safety
  useEffect(() => {
    if (typeof window === "undefined") return;
    import("react-force-graph-3d").then((mod) => {
      setForceGraph(() => mod.default);
    });
  }, []);

  const graphData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    return {
      nodes: data.nodes.map((n) => ({
        ...n,
        color: VIEW_COLOURS[n.designView] || VIEW_COLOURS.shared,
      })),
      links: data.links.map((l) => ({
        ...l,
        color:
          l.type === "containment"
            ? "rgba(100, 116, 139, 0.5)"
            : "rgba(56, 189, 248, 0.5)",
      })),
    };
  }, [data]);

  const handleNodeClick = useCallback(
    (node) => {
      if (onNodeSelect) {
        onNodeSelect(node);
      }
      // Focus camera on the clicked node
      if (graphRef.current) {
        const distance = 200;
        const distRatio =
          1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);
        graphRef.current.cameraPosition(
          {
            x: (node.x || 0) * distRatio,
            y: (node.y || 0) * distRatio,
            z: (node.z || 0) * distRatio,
          },
          node,
          1500
        );
      }
    },
    [onNodeSelect]
  );

  if (!ForceGraph || !data || data.nodes.length === 0) {
    return (
      <div
        ref={containerRef}
        className="dhc-viewer-graph"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
          fontSize: "0.9rem",
        }}
      >
        {!data
          ? "Loading A-Box data..."
          : data.nodes.length === 0
          ? "No instance data available. Save a design first."
          : "Loading 3D graph..."}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="dhc-viewer-graph">
      <ForceGraph
        ref={graphRef}
        graphData={graphData}
        nodeLabel="label"
        nodeColor="color"
        nodeVal={(node) =>
          node.id === selectedNode?.id ? 12 : 6
        }
        linkLabel="label"
        linkColor="color"
        linkWidth={(link) => (link.type === "containment" ? 1.5 : 0.8)}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1.5}
        onNodeClick={handleNodeClick}
        backgroundColor="#020617"
        warmupTicks={50}
        cooldownTime={3000}
        width={containerRef.current?.clientWidth || 800}
        height={600}
      />
    </div>
  );
};

export default ABoxGraph;
