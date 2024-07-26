import { Edge } from 'reactflow';

export function findDirectDependencies(nodeIds: string[], edges: Edge[]) {
  if (nodeIds.length === 0) return [];

  return edges
    .filter((edge) => nodeIds.includes(edge.target))
    .map((edge) => edge.source);
}

export function findAllDependencies(
  nodeIds: string[],
  edges: Edge[],
  visitedDependencies: Set<string> = new Set()
) {
  if (nodeIds.length === 0) return [...visitedDependencies.values()];

  return [
    ...new Set([
      ...visitedDependencies,
      ...findDirectDependencies(nodeIds, edges)
    ])
  ];
}

export function findDirectDependents(nodeIds: string[], edges: Edge[]) {
  if (nodeIds.length === 0) return [];

  return edges
    .filter((edge) => nodeIds.includes(edge.source))
    .map((edge) => edge.target);
}

export function findAllDependents(
  nodeIds: string[],
  edges: Edge[],
  visitedDependents: Set<string> = new Set()
) {
  if (nodeIds.length === 0) return [...visitedDependents.values()];

  return [
    ...new Set([...visitedDependents, ...findDirectDependents(nodeIds, edges)])
  ];
}
