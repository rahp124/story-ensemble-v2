export const NodeType = {
  Persona: 'Persona',
  Problem: 'Problem',
  Solution: 'Solution',
  Storyboard: 'Storyboard'
} as const;
export type NodeType = (typeof NodeType)[keyof typeof NodeType];

export const displayConfigByNodeType = {
  [NodeType.Persona]: {
    emoji: '👤',
    backgroundClass: 'bg-yellow-100'
  },
  [NodeType.Problem]: {
    emoji: '🚨',
    backgroundClass: 'bg-red-100'
  },
  [NodeType.Solution]: {
    emoji: '💡',
    backgroundClass: 'bg-blue-100'
  },
  [NodeType.Storyboard]: {
    emoji: '🎞',
    backgroundClass: 'bg-white'
  }
};

export function nodeTypeDisplayAttributes(type: NodeType) {
  return (
    displayConfigByNodeType[type] || { emoji: '', backgroundClass: 'bg-white' }
  );
}

export const EdgeType = {
  Context: 'Context'
} as const;
