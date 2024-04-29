import ContextEdge from './ContextEdge';
import PersonaNode from './PersonaNode';
import ProblemNode from './ProblemNode';

export const NodeType = {
  Persona: 'Persona',
  Problem: 'Problem'
} as const;
export const nodeTypes = {
  [NodeType.Persona]: PersonaNode,
  [NodeType.Problem]: ProblemNode
};

export const EdgeType = {
  Context: 'Context'
} as const;
export const edgeTypes = {
  [EdgeType.Context]: ContextEdge
};
