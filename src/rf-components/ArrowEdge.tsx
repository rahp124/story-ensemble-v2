import { 
  MarkerType
} from 'reactflow';
import { nanoid } from 'nanoid';

export const createArrowEdge = (source: string, target: string)  => {
  // Add arrow edge
  return {
    id: `edge-${nanoid()}`,
    type: 'default',
    source,
    sourceHandle: 'source-e-1',
    target,
    targetHandle: 'target-e-1',
    className: 'arrow-edge',
    interactionWidth: 80,
    data: {
      state: {},
    },
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 50,
      height: 50,
      color: '#3facff',
    },
    style: {
      stroke: '#3facff',
      transition: 'ease',
      strokeDasharray: '15, 15'
    },
  }
}