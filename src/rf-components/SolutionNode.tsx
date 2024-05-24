import SourceHandle from '@/components/SourceHandle';
import TargetHandle from '@/components/TargetHandle';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useStore } from '@/store';
import { RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { NodeProps, NodeResizer } from 'reactflow';

export interface SolutionNodeData {
  solution: string;
  regenerating: boolean;
  dependencyUpdates: { id: string; previous: string; current: string }[];
}
export default function SolutionNode(props: NodeProps<SolutionNodeData>) {
  const [solution, setSolution] = useState(props.data.solution);
  useEffect(() => {
    setSolution(props.data.solution);
  }, [props.data.solution]);

  const { updateSolutionNode, regenerateSolutionNode } = useStore((state) => {
    const { updateSolutionNode, regenerateSolutionNode } = state;
    return { updateSolutionNode, regenerateSolutionNode };
  });

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
        <div className="flex justify-between items-center">
          <div className="flex bg-blue-100 p-2 py-1 w-fit rounded-tr-md">
            <h3 className="font-bold text-sm">Solution</h3>
          </div>
          {props.data.regenerating ? (
            <p>Regenerating...</p>
          ) : props.data.dependencyUpdates.length > 0 ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={async () => {
                        await regenerateSolutionNode(props.id, true);
                      }}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => {
                        regenerateSolutionNode(props.id, false);
                      }}
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Linked problems updated. Regenerate solution?</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
        <div className="p-4 w-full h-full  flex-grow bg-blue-100 rounded-tr-md rounded-b-md">
          <textarea
            className="block min-h-full h-full w-full resize-none p-2 text-md bg-blue-50"
            rows={6}
            disabled={props.data.regenerating}
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
