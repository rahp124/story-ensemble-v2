import { NodeProps, NodeResizer } from 'reactflow';
import { ProblemNodeData } from '@/types';
import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import SourceHandle from '@/components/SourceHandle';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import TargetHandle from '@/components/TargetHandle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function ProblemNode(props: NodeProps<ProblemNodeData>) {
  const [problem, setProblem] = useState(props.data.problem);
  useEffect(() => {
    setProblem(props.data.problem);
  }, [props.data.problem]);
  const { updateProblemNode, regenerateProblemNodes } = useStore();

  const { dimensions } = props.data;

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
      <div className="h-full flex flex-col min-w-[300px] min-h-[300px] nowheel overflow-hidden">
        <div className="flex justify-between items-center">
          <div className="flex bg-red-100 p-2 py-1 w-fit rounded-tr-md">
            <h3 className="font-bold text-sm">Problem</h3>
          </div>
          {props.data.regenerating ? (
            <p>Regenerating...</p>
          ) : (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => {
                        regenerateProblemNodes([props.id]);
                      }}
                    >
                      <RefreshCw className="w-4 h-4" />
                      {props.data.outOfSync && (
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full absolute top-1 right-0"></span>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {props.data.outOfSync && (
                  <TooltipContent>
                    <p>Dependencies updated. Regenerate problem?</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="p-4 w-full flex-grow bg-red-100 rounded-tr-md rounded-b-md flex flex-col">
          <textarea
            className="block w-full resize-none p-2 text-md bg-red-50 flex-grow"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            onBlur={() => {
              if (problem !== props.data.problem)
                updateProblemNode(props.id, problem);
            }}
          />
          <div className="mt-2">
            <ScrollArea className="w-full h-[80px]">
              {dimensions.map((dimension) => (
                <Badge key={dimension.name} variant="secondary">
                  <span>
                    <b>{dimension.name}</b>:{' '}
                    {dimension.currentValues.join(', ')}
                  </span>
                </Badge>
              ))}
            </ScrollArea>
          </div>
        </div>
      </div>
      <TargetHandle />
      <SourceHandle />
    </>
  );
}
