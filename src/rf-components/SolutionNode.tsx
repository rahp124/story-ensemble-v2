import { NodeProps, NodeResizer } from 'reactflow';
import { SolutionNodeData } from '@/types';
import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import SourceHandle from '@/components/SourceHandle';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { Eye, RefreshCw } from 'lucide-react';
import TargetHandle from '@/components/TargetHandle';

export default function SolutionNode(props: NodeProps<SolutionNodeData>) {
  const [solution, setSolution] = useState(props.data.solution);
  useEffect(() => {
    setSolution(props.data.solution);
  }, [props.data.solution]);
  const { updateSolutionNode, regenerateSolutionNodes } = useStore();
  const { dimensions, image } = props.data;

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
          <div className="flex bg-blue-100 p-2 py-1 w-fit rounded-tr-md">
            <h3 className="font-bold text-sm">Solution</h3>
          </div>
          {props.data.regenerating ? (
            <p>Regenerating...</p>
          ) : (
            <div className="flex gap-2">
              {image && (
                <Tooltip
                  label={<img src={image} className="w-[200px] h-[200px]" />}
                >
                  <Eye className="w-5 h-5" />
                </Tooltip>
              )}
              <Tooltip
                label={
                  <p>
                    {props.data.outOfSync ? 'Dependencies updated. ' : ''}
                    Regenerate solution
                  </p>
                }
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => {
                    regenerateSolutionNodes([props.id]);
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  {props.data.outOfSync && (
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full absolute top-1 right-0"></span>
                  )}
                </Button>
              </Tooltip>
            </div>
          )}
        </div>
        <div className="p-4 w-full flex-grow bg-blue-100 rounded-tr-md rounded-b-md flex flex-col">
          <textarea
            className="block w-full resize-none p-2 text-md bg-blue-50 flex-grow"
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            onBlur={() => {
              if (solution !== props.data.solution)
                updateSolutionNode(props.id, solution);
            }}
          />
          <div className="mt-2">
            <ScrollArea className="w-full h-[80px]">
              {dimensions.map((dimension) => (
                <Badge key={dimension.id} variant="secondary">
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
