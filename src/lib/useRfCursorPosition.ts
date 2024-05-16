import { useState } from 'react';
import { XYPosition, useReactFlow } from 'reactflow';

export function useRfCursorPosition() {
  const rf = useReactFlow();

  const [rfCursorPosition, setRfCursorPosition] = useState<XYPosition>({
    x: 0,
    y: 0
  });
  const updateRfCursorPosition = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const position = rf.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY
    });
    setRfCursorPosition(position);
    return position;
  };

  return {
    rfCursorPosition,
    updateRfCursorPosition
  };
}
