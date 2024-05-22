import SourceHandle from '@/components/SourceHandle';
import TargetHandle from '@/components/TargetHandle';
import { useStore } from '@/store';
import { useState } from 'react';

import { NodeProps, NodeResizer } from 'reactflow';

export interface SolutionNodeData {
  solution: string;
}
export default function SolutionNode(props: NodeProps<SolutionNodeData>) {
  const [solution, setSolution] = useState(props.data.solution);
  const updateSolutionNode = useStore((state) => state.updateSolutionNode);

  return (
    <>
      <NodeResizer
        nodeId={props.id}
        isVisible={props.selected}
        handleClassName="[&:is(.top,.bottom.left)]:hidden"
        lineClassName="hidden"
        minWidth={300}
        minHeight={200}
        handleStyle={{
          width: 10,
          height: 10
        }}
      />
      <div className="w-full h-full flex flex-col min-w-[300px] min-h-[200px] nowheel overflow-hidden">
        <div className="flex bg-blue-100 p-2 py-1 w-fit rounded-tr-md">
          <h3 className="font-bold text-sm">Solution</h3>
        </div>
        <div className="p-4 w-full h-full  flex-grow bg-blue-100 rounded-tr-md rounded-b-md">
          <textarea
            className="block min-h-full h-full w-full resize-none p-2 text-md bg-blue-50"
            rows={6}
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            onBlur={() => updateSolutionNode(props.id, solution)}
          />
        </div>
      </div>
      <TargetHandle />
      <SourceHandle />
    </>
  );
}
