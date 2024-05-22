import SourceHandle from '@/components/SourceHandle';
import TargetHandle from '@/components/TargetHandle';
import { useStore } from '@/store';
import { useState } from 'react';

import { NodeProps, NodeResizer } from 'reactflow';

export interface ProblemNodeData {
  problem: string;
}
export default function ProblemNode(props: NodeProps<ProblemNodeData>) {
  const [problem, setProblem] = useState(props.data.problem);
  const updateProblemNode = useStore((state) => state.updateProblemNode);

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
        <div className="flex bg-red-100 p-2 py-1 w-fit rounded-tr-md">
          <h3 className="font-bold text-sm">Problem</h3>
        </div>
        <div className="p-4 w-full h-full  flex-grow bg-red-100 rounded-tr-md rounded-b-md">
          <textarea
            className="block min-h-full h-full w-full resize-none p-2 text-md bg-red-50"
            rows={6}
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            onBlur={() => updateProblemNode(props.id, problem)}
          />
        </div>
      </div>
      <TargetHandle />
      <SourceHandle />
    </>
  );
}
