import ContextEdge from './ContextEdge';
import ImageNode from './ImageNode';
import PersonaNode from './PersonaNode';
import ProblemNode from './ProblemNode';
import SolutionNode from './SolutionNode';
import StoryboardNode from './StoryboardNode';

export const NodeType = {
  Persona: 'Persona',
  Problem: 'Problem',
  Solution: 'Solution',
  Image: 'Image',
  Storyboard: 'Storyboard'
} as const;
export const nodeTypes = {
  [NodeType.Persona]: PersonaNode,
  [NodeType.Problem]: ProblemNode,
  [NodeType.Solution]: SolutionNode,
  [NodeType.Image]: ImageNode,
  [NodeType.Storyboard]: StoryboardNode
};

export const EdgeType = {
  Context: 'Context'
} as const;
export const edgeTypes = {
  [EdgeType.Context]: ContextEdge
};
