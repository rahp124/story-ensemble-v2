import {
  BaseEdge,
  EdgeProps,
  // getSimpleBezierPath,
  getStraightPath
} from 'reactflow';
export default function ContextEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, selected } = props;

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY
  });

  const color = !selected ? 'black' : '#0284c7';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        label="hello"
        style={{ strokeWidth: 4, stroke: color }}
      />
    </>
  );
}
