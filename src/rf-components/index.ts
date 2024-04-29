import ContextEdge from './ContextEdge';
import PersonaNode from './PersonaNode';
import ProblemNode from './ProblemNode';
import SolutionNode from './SolutionNode';

export const NodeType = {
  Persona: 'Persona',
  Problem: 'Problem',
  Solution: 'Solution'
} as const;
export const nodeTypes = {
  [NodeType.Persona]: PersonaNode,
  [NodeType.Problem]: ProblemNode,
  [NodeType.Solution]: SolutionNode
};

export const EdgeType = {
  Context: 'Context'
} as const;
export const edgeTypes = {
  [EdgeType.Context]: ContextEdge
};
