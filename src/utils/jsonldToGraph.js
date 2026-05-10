/**
 * Convert a Step-1 graph.jsonld document into the {nodes, links} shape
 * expected by ABoxGraph (react-force-graph-3d).
 *
 * Input (the JSON-LD document the createDigitalHome Lambda writes):
 *   {
 *     "@context": { ... },
 *     "@graph": [
 *       { "@id": "https://digitalhome.cloud/instance/agents/<sub>",
 *         "@type": "rec:Agent",
 *         "label": "Display Name" },
 *       { "@id": "https://digitalhome.cloud/instance/DigitalHomes/<id>",
 *         "@type": "dhc:DigitalHome",
 *         "smartHomeId": "...",
 *         "createdBy": "https://digitalhome.cloud/instance/agents/<sub>",
 *         "createdAt": "...", "updatedAt": "...",
 *         "country": "...", "postalCode": "...", "city": "...",
 *         "addressLine1": "...", "addressLine2": "...",
 *         "isDemo": false }
 *     ]
 *   }
 *
 * Properties whose value is the @id of another node become a link; everything
 * else becomes a node attribute. The label is the `label` property if present,
 * else the trailing path segment of @id (so "agents/abc..." → "abc...",
 * "DigitalHomes/DE-12345-..." → "DE-12345-...").
 */

const INSTANCE_NS = "https://digitalhome.cloud/instance/";

function shortLabel(iri) {
  if (typeof iri !== "string") return String(iri);
  const tail = iri.split("/").pop() || iri;
  return tail.length > 24 ? tail.slice(0, 21) + "…" : tail;
}

function viewForType(typeRef) {
  if (!typeRef) return "shared";
  const t = String(typeRef).toLowerCase();
  if (t.includes("digitalhome")) return "spatial";
  if (t.includes("agent")) return "governance";
  return "shared";
}

const NODE_PROP_KEYS = new Set(["@id", "@type"]);

export function jsonldToGraph(doc) {
  if (!doc || typeof doc !== "object") return { nodes: [], links: [] };

  const graph = Array.isArray(doc["@graph"])
    ? doc["@graph"]
    : Array.isArray(doc)
      ? doc
      : [doc];

  const ids = new Set(graph.map((n) => n["@id"]).filter(Boolean));

  const nodes = [];
  const links = [];

  for (const entry of graph) {
    const id = entry["@id"];
    if (!id) continue;

    const node = {
      id,
      label: entry.label || entry.name || shortLabel(id),
      type: entry["@type"] || null,
      designView: viewForType(entry["@type"]),
    };

    for (const [key, value] of Object.entries(entry)) {
      if (NODE_PROP_KEYS.has(key) || key === "label" || key === "name") continue;
      if (typeof value === "string" && ids.has(value) && value !== id) {
        // IRI ref → link
        links.push({ source: id, target: value, label: key, type: key });
      } else {
        // literal → attach to node
        node[key] = value;
      }
    }

    nodes.push(node);
  }

  return { nodes, links };
}
