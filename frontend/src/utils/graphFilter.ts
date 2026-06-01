import { GraphResponse } from '../types';

export function filterGraphByCommitHashes(
  graph: GraphResponse,
  allowedHashes: Set<string>
): GraphResponse {
  if (allowedHashes.size === 0) {
    return { nodes: [], edges: [], activeBranch: graph.activeBranch };
  }

  const nodes = graph.nodes.filter((node) => allowedHashes.has(node.id));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );

  return {
    nodes,
    edges,
    activeBranch: graph.activeBranch,
  };
}
