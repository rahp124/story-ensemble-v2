import SourceHandle from '@/components/SourceHandle';
import TargetHandle from '@/components/TargetHandle';
import { NodeData } from '@/types';
import {
  ActionIcon,
  ScrollArea,
  Tooltip,
  Image,
  Skeleton,
  Badge
} from '@mantine/core';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';

export interface BaseNodeProps {
  nodeProps: NodeProps<NodeData>;

  nodeName: string;
  nodeBackgroundClass: string;
  textAreaBackgroundClass: string;
  content: string;
  onUpdateContent: (content: string) => void;
  onRegenerateContent: () => void;

  targetHandle: boolean;
  sourceHandle: boolean;
}
export default function BaseNode(props: BaseNodeProps) {
  const [content, setContent] = useState(props.content);
  useEffect(() => {
    setContent(props.content);
  }, [props.content]);

  const { nodeProps } = props;
  const { dimensions, image, regenerating, outOfSync } = nodeProps.data;
  const [showImage, setShowImage] = useState(false);

  return (
    <>
      <NodeResizer
        nodeId={nodeProps.id}
        isVisible={nodeProps.selected}
        handleClassName="[&:is(.top,.bottom.left)]:hidden"
        lineClassName="hidden"
        minWidth={300}
        minHeight={200}
        handleStyle={{
          width: 10,
          height: 10
        }}
      />
      <div
        className={`h-full flex flex-col min-w-[300px] min-h-[300px] ${
          nodeProps.selected ? 'nowheel' : ''
        }`}
      >
        <div className="flex justify-between items-center">
          <div
            className={`flex p-2 py-1 w-fit rounded-tr-md ${props.nodeBackgroundClass}`}
          >
            <h3 className="font-bold text-sm">{props.nodeName}</h3>
          </div>
          <div className="flex gap-2">
            <ActionIcon
              variant="subtle"
              size="sm"
              color="dark"
              onClick={() => setShowImage((showImage) => !showImage)}
            >
              {showImage ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </ActionIcon>
            <Tooltip
              label={
                <p>
                  {outOfSync ? 'Dependencies updated. ' : ''}
                  Regenerate
                </p>
              }
            >
              <ActionIcon
                variant="subtle"
                size="sm"
                color="dark"
                loading={regenerating}
                onClick={() => {
                  props.onRegenerateContent();
                }}
              >
                <RefreshCw className="w-5 h-5" />
                {outOfSync && (
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full absolute top-1 right-0"></span>
                )}
              </ActionIcon>
            </Tooltip>
          </div>
        </div>
        <div
          className={`p-4 w-full flex-grow rounded-tr-md rounded-b-md flex flex-col overflow-hidden ${props.nodeBackgroundClass}`}
        >
          {showImage && image ? (
            <Image src={image} className="h-full object-cover" />
          ) : showImage && !image ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <>
              <textarea
                className={`block w-full resize-none p-2 text-md flex-grow ${props.textAreaBackgroundClass}`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={() => {
                  if (content !== props.content) props.onUpdateContent(content);
                }}
              />
              <div className="mt-2">
                <ScrollArea className="w-full h-[80px]">
                  {dimensions.map((dimension) => (
                    <Badge
                      key={dimension.id}
                      variant="default"
                      styles={{
                        label: { textTransform: 'none' }
                      }}
                    >
                      <span>
                        <b>{dimension.name}</b>:{' '}
                        {dimension.currentValues.join(', ')}
                      </span>
                    </Badge>
                  ))}
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      </div>
      {props.targetHandle && <TargetHandle />}
      {props.sourceHandle && <SourceHandle />}
    </>
  );
}
