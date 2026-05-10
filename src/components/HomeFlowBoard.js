import React, { useEffect, useRef } from "react";
import { Link, navigate } from "gatsby";

/**
 * Home v2 — design-flow board.
 *
 * Visualises the DHC Designer pipeline:
 *   T-BOX  →  [Manager → Builder → Electrifier]  →  A-BOX  →  consumers
 *
 * - T-BOX and A-BOX are devops-only bands (locked overlay).
 * - Manager / Builder / Electrifier are the green numbered design flow.
 * - Floorplans / Wires are output boxes hanging above their producer.
 * - Right rail: Device Inventory / BOM / 3D Graph Viewer (consumers).
 *
 * The arrow layer is an SVG full of bezier paths drawn between box centres.
 * Design-flow edges (green, solid) get an animated dot; data-flow edges
 * (slate, dashed) are quieter. Hover any box to dim unrelated arrows.
 *
 * From the Home v2.html prototype (handoff 2026-05-10).
 */

const EDGES = [
  // Design flow (green) — Manager → Builder → Electrifier
  ["manager", "builder", "design", "right", "left"],
  ["builder", "elec", "design", "right", "left"],
  // Step → output (design)
  ["builder", "floor", "design", "top", "bottom"],
  ["elec", "wires", "design", "top", "bottom"],
  // T-BOX feeds modules (data, dashed)
  ["tbox", "manager", "data", "bottom", "top"],
  ["tbox", "builder", "data", "bottom", "top"],
  ["tbox", "elec", "data", "bottom", "top"],
  // Modules write into A-BOX
  ["manager", "abox", "data", "bottom", "top"],
  ["builder", "abox", "data", "bottom", "top"],
  ["elec", "abox", "data", "bottom", "top"],
  // A-BOX feeds consumers
  ["abox", "inv", "data", "top", "bottom"],
  ["abox", "bom", "data", "top", "bottom"],
  ["abox", "viewer", "data", "top", "bottom"],
];

function side(rect, s) {
  switch (s) {
    case "left":
      return { x: rect.left, y: rect.top + rect.height / 2 };
    case "right":
      return { x: rect.left + rect.width, y: rect.top + rect.height / 2 };
    case "top":
      return { x: rect.left + rect.width / 2, y: rect.top };
    case "bottom":
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height };
    default:
      return { x: rect.left, y: rect.top };
  }
}

function bezier(a, b, hOrV) {
  if (hOrV === "h") {
    const dx = Math.max(40, Math.abs(b.x - a.x) * 0.5);
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  }
  const dy = Math.max(40, Math.abs(b.y - a.y) * 0.5);
  const sign = b.y > a.y ? 1 : -1;
  return `M ${a.x} ${a.y} C ${a.x} ${a.y + dy * sign}, ${b.x} ${b.y - dy * sign}, ${b.x} ${b.y}`;
}

const HomeFlowBoard = ({ activeHomeId, devopsOnly }) => {
  const boardRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const board = boardRef.current;
    const svg = svgRef.current;
    if (!board || !svg) return undefined;
    const SVGNS = "http://www.w3.org/2000/svg";

    function draw() {
      svg.innerHTML = "";
      const boardRect = board.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${boardRect.width} ${boardRect.height}`);
      svg.setAttribute("width", boardRect.width);
      svg.setAttribute("height", boardRect.height);

      const defs = document.createElementNS(SVGNS, "defs");
      defs.innerHTML = `
        <marker id="ah-design" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e"/>
        </marker>
        <marker id="ah-data" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8"/>
        </marker>
      `;
      svg.appendChild(defs);

      EDGES.forEach(([fromId, toId, kind, fromSide, toSide], i) => {
        const fromEl = board.querySelector(`[data-box="${fromId}"]`);
        const toEl = board.querySelector(`[data-box="${toId}"]`);
        if (!fromEl || !toEl) return;
        const fr = fromEl.getBoundingClientRect();
        const tr = toEl.getBoundingClientRect();
        const a = side(fr, fromSide);
        const b = side(tr, toSide);
        a.x -= boardRect.left;
        a.y -= boardRect.top;
        b.x -= boardRect.left;
        b.y -= boardRect.top;
        const hOrV =
          fromSide === "left" || fromSide === "right" ? "h" : "v";
        const d = bezier(a, b, hOrV);

        const path = document.createElementNS(SVGNS, "path");
        path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        path.setAttribute("data-from", fromId);
        path.setAttribute("data-to", toId);
        path.setAttribute("data-kind", kind);
        if (kind === "design") {
          path.setAttribute("stroke", "#22c55e");
          path.setAttribute("stroke-width", "1.8");
          path.setAttribute("marker-end", "url(#ah-design)");
          path.setAttribute("opacity", "0.9");
        } else {
          path.setAttribute("stroke", "#94a3b8");
          path.setAttribute("stroke-width", "1.3");
          path.setAttribute("stroke-dasharray", "4 4");
          path.setAttribute("marker-end", "url(#ah-data)");
          path.setAttribute("opacity", "0.45");
        }
        svg.appendChild(path);

        // Animated traveling dot on design-flow edges. Honours
        // prefers-reduced-motion: skip the animation entirely.
        const reducedMotion =
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (kind === "design" && !reducedMotion) {
          const dot = document.createElementNS(SVGNS, "circle");
          dot.setAttribute("r", "3");
          dot.setAttribute("fill", "#bbf7d0");
          const am = document.createElementNS(SVGNS, "animateMotion");
          am.setAttribute("dur", `${3.6 + i * 0.25}s`);
          am.setAttribute("repeatCount", "indefinite");
          am.setAttribute("rotate", "auto");
          am.setAttribute("path", d);
          dot.appendChild(am);
          svg.appendChild(dot);
        }
      });
    }

    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    const t1 = window.setTimeout(draw, 200);
    const t2 = window.setTimeout(draw, 800);

    // Hover emphasis — dim unrelated arrows
    const handlers = [];
    board.querySelectorAll(".dhc-flow-box").forEach((el) => {
      const id = el.dataset.box;
      const enter = () => {
        svg.querySelectorAll("path[data-from]").forEach((p) => {
          const related =
            p.dataset.from === id || p.dataset.to === id;
          p.setAttribute("opacity", related ? "1" : "0.12");
          if (related && p.dataset.kind === "design") {
            p.setAttribute("stroke-width", "2.2");
          }
        });
      };
      const leave = () => {
        svg.querySelectorAll("path[data-from]").forEach((p) => {
          if (p.dataset.kind === "design") {
            p.setAttribute("opacity", "0.9");
            p.setAttribute("stroke-width", "1.8");
          } else {
            p.setAttribute("opacity", "0.45");
          }
        });
      };
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      handlers.push([el, enter, leave]);
    });

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      handlers.forEach(([el, enter, leave]) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    };
  }, []);

  const goManager = (e) => {
    e.preventDefault();
    navigate("/manager/");
  };

  return (
    <div className="dhc-home-board">
      <div className="dhc-home-legend">
        <span className="dhc-home-legend-label">Legend</span>
        <span className="dhc-home-legend-item">
          <span
            className="dhc-home-legend-swatch"
            style={{ color: "rgba(148,163,184,0.7)" }}
          />
          Everyone
        </span>
        <span className="dhc-home-legend-item">
          <span
            className="dhc-home-legend-swatch"
            style={{ color: "#93c5fd" }}
          />
          dhc-welcome (demo)
        </span>
        <span className="dhc-home-legend-item">
          <span
            className="dhc-home-legend-swatch"
            style={{ color: "#fca5a5" }}
          />
          devops only
        </span>
        <span className="dhc-home-legend-divider" />
        <span
          className="dhc-home-legend-item"
          style={{ color: "var(--green)" }}
        >
          <span className="dhc-home-legend-arrow" />
          design flow
        </span>
        <span
          className="dhc-home-legend-item"
          style={{ color: "#cbd5e1" }}
        >
          <span className="dhc-home-legend-arrow dhc-home-legend-arrow-dashed" />
          data flow
        </span>
        <span style={{ flex: 1 }} />
        <span className="dhc-home-legend-mini">v0.9 · sandbox build</span>
      </div>

      <section className="dhc-home-board-card">
        <div className="dhc-home-grid" ref={boardRef}>
          <div
            className="dhc-flow-box dhc-flow-band dhc-role-red dhc-flow-locked"
            data-box="tbox"
          >
            <div className="dhc-flow-head">
              <span className="dhc-flow-glyph">T</span>
              <span className="dhc-flow-title">T-BOX</span>
            </div>
            <div className="dhc-flow-desc">
              Terminology box — ontology, schemas and rule definitions that
              shape the whole graph. Edited centrally; used as read-only
              reference by the modules below.
            </div>
            <div className="dhc-flow-meta">
              <span>dhc:</span>
              <span>rec:</span>
              <span>brick:</span>
              <span>NF&nbsp;C&nbsp;15-100</span>
            </div>
          </div>

          <Link
            to="/manager/"
            className="dhc-flow-box dhc-role-base dhc-flow-active dhc-flow-pos-manager"
            data-box="manager"
          >
            <span className="dhc-flow-step">1</span>
            <div className="dhc-flow-head">
              <span className="dhc-flow-glyph">M</span>
              <span className="dhc-flow-title">DH Manager</span>
              <span className="dhc-flow-tag">Open →</span>
            </div>
            <div className="dhc-flow-desc">
              Create and manage SmartHome IDs, owners and metadata. The
              starting point — every design begins from a registered home.
            </div>
            <div className="dhc-flow-meta">
              <span>{activeHomeId ? "1 home" : "no homes yet"}</span>
              <span>active</span>
            </div>
          </Link>

          <Link
            to="/design/"
            className="dhc-flow-box dhc-role-base dhc-flow-pos-builder"
            data-box="builder"
          >
            <span className="dhc-flow-step">2</span>
            <div className="dhc-flow-head">
              <span className="dhc-flow-glyph">B</span>
              <span className="dhc-flow-title">DH Builder</span>
              <span className="dhc-flow-tag">Spatial · Blockly</span>
            </div>
            <div className="dhc-flow-desc">
              Compose site, building, levels and rooms as a typed graph.
              Blockly Spatial Workspace.
            </div>
          </Link>

          <Link
            to="/drawing/"
            className="dhc-flow-box dhc-flow-output dhc-flow-pos-floor"
            data-box="floor"
          >
            <div className="dhc-flow-head">
              <span className="dhc-flow-glyph">F</span>
              <span className="dhc-flow-title">Building Floorplans</span>
              <span className="dhc-flow-tag">DXF / SVG</span>
            </div>
            <div className="dhc-flow-desc">
              Plan view rendered live from the spatial graph. Read-only output
              of the Builder.
            </div>
          </Link>

          <Link
            to="/design/"
            className="dhc-flow-box dhc-role-base dhc-flow-pos-elec"
            data-box="elec"
          >
            <span className="dhc-flow-step">3</span>
            <div className="dhc-flow-head">
              <span className="dhc-flow-glyph">E</span>
              <span className="dhc-flow-title">DH Electrifier</span>
              <span className="dhc-flow-tag">Electrical · Blockly</span>
            </div>
            <div className="dhc-flow-desc">
              Wire circuits, breakers and points to rooms. Blockly Electrical
              Workspace.
            </div>
          </Link>

          <Link
            to="/drawing/"
            className="dhc-flow-box dhc-flow-output dhc-flow-pos-wires"
            data-box="wires"
          >
            <div className="dhc-flow-head">
              <span className="dhc-flow-glyph">W</span>
              <span className="dhc-flow-title">Wire plans</span>
              <span className="dhc-flow-tag">schéma unifilaire</span>
            </div>
            <div className="dhc-flow-desc">
              NF&nbsp;C&nbsp;15-100 single-line diagram, generated from the
              electrical graph.
            </div>
          </Link>

          <span
            className="dhc-flow-box dhc-role-blue dhc-flow-pos-inv"
            data-box="inv"
          >
            <div className="dhc-flow-head">
              <span className="dhc-flow-glyph">I</span>
              <span className="dhc-flow-title">Device Inventory</span>
              <span className="dhc-flow-tag">Catalogue</span>
            </div>
            <div className="dhc-flow-desc">
              Brands, models and parts you can attach to points and circuits.
            </div>
          </span>

          <Link
            to="/bom/"
            className="dhc-flow-box dhc-role-blue dhc-flow-pos-bom"
            data-box="bom"
          >
            <div className="dhc-flow-head">
              <span className="dhc-flow-glyph">$</span>
              <span className="dhc-flow-title">BOM</span>
              <span className="dhc-flow-tag">Bill of materials</span>
            </div>
            <div className="dhc-flow-desc">
              Protection devices, breakers, wiring and circuits — derived from
              the A-Box.
            </div>
          </Link>

          <Link
            to="/viewer/"
            className="dhc-flow-box dhc-role-blue dhc-flow-pos-3d"
            data-box="viewer"
          >
            <div className="dhc-flow-head">
              <span className="dhc-flow-glyph">3D</span>
              <span className="dhc-flow-title">3D Graph Viewer</span>
              <span className="dhc-flow-tag">A-Box</span>
            </div>
            <div className="dhc-flow-desc">
              Interactive 3D graph of the assembled SmartHome instance.
            </div>
          </Link>

          <div
            className="dhc-flow-box dhc-flow-band dhc-role-red dhc-flow-locked"
            data-box="abox"
          >
            <div className="dhc-flow-head">
              <span className="dhc-flow-glyph">A</span>
              <span className="dhc-flow-title">A-BOX</span>
            </div>
            <div className="dhc-flow-desc">
              Assertion box — the assembled instance graph for this SmartHome.
              All design steps write into it; consumers above read from it.
            </div>
            <div className="dhc-flow-meta">
              <span>graph store</span>
              <span>RDF / JSON-LD</span>
              <span>locked while editing</span>
            </div>
          </div>

          <svg ref={svgRef} className="dhc-flow-arrows" preserveAspectRatio="none" />
        </div>

        <div className="dhc-home-board-foot">
          <span>
            Tip: hover any box to highlight its arrows. Steps 1 → 3 are the
            green design flow; everything else is data flow.
          </span>
          <button
            type="button"
            className="dhc-home-cta"
            onClick={goManager}
          >
            Continue with DH Manager →
          </button>
        </div>
        {!devopsOnly && (
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.7rem",
              color: "var(--txt-3, #64748b)",
              fontFamily: "var(--mono, monospace)",
            }}
          >
            T-BOX and A-BOX are devops-only. Members of{" "}
            <code>dhc-devops-engineers</code> can edit them.
          </p>
        )}
      </section>
    </div>
  );
};

export default HomeFlowBoard;
