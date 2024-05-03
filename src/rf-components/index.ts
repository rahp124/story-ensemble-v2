import ContextEdge from './ContextEdge';
import ImageNode from './ImageNode';
import PersonaNode from './PersonaNode';
import ProblemNode from './ProblemNode';
import SolutionNode from './SolutionNode';
import TextNode from './TextNode';

export const NodeType = {
  Persona: 'Persona',
  Problem: 'Problem',
  Solution: 'Solution',
  Text: 'Text',
  Image: 'Image'
} as const;
export const nodeTypes = {
  [NodeType.Persona]: PersonaNode,
  [NodeType.Problem]: ProblemNode,
  [NodeType.Solution]: SolutionNode,
  [NodeType.Text]: TextNode,
  [NodeType.Image]: ImageNode
};

export const EdgeType = {
  Context: 'Context'
} as const;
export const edgeTypes = {
  [EdgeType.Context]: ContextEdge
};
