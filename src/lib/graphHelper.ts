import { Edge } from 'reactflow';

export function findDirectDependencies(nodeIds: string[], edges: Edge[]) {
  if (nodeIds.length === 0) return [];

  return edges
    .filter((edge) => nodeIds.includes(edge.target))
    .map((edge) => edge.source);
}

export function findDirectDependents(nodeIds: string[], edges: Edge[]) {
  if (nodeIds.length === 0) return [];

  return edges
    .filter((edge) => nodeIds.includes(edge.source))
    .map((edge) => edge.target);
}
