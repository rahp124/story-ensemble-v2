import { Edge } from 'reactflow';

export function findDependentNodes(solutionIds: string[], edges: Edge[]) {
  const problemIds = edges
    .filter(
      (edge) =>
        edge.source.startsWith('problem-') &&
        edge.target.startsWith('solution-') &&
        solutionIds.includes(edge.target)
    )
    .map((edge) => edge.source);
  const personaIds = edges
    .filter(
      (edge) =>
        edge.source.startsWith('persona-') &&
        edge.target.startsWith('problem-') &&
        problemIds.includes(edge.target)
    )
    .map((edge) => edge.source);

  return { personaIds, problemIds };
}
