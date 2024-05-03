import { NodeProps, NodeResizer } from 'reactflow';

export default function ImageNode(props: NodeProps<{ src: string }>) {
  return (
    <>
      <NodeResizer
        nodeId={props.id}
        isVisible={props.selected}
        minWidth={10}
        minHeight={10}
        handleStyle={{
          width: 8,
          height: 8
        }}
        keepAspectRatio={true}
      />
      <div className="overflow-hidden h-full w-full p-1">
        <img src={props.data.src} className="h-full w-full" />
      </div>
    </>
  );
}
