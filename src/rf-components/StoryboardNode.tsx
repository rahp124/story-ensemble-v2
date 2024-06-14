import TargetHandle from '@/components/TargetHandle';
import { useStore } from '@/store';
import { StoryboardNodeData } from '@/types';
import { ActionIcon, Card, Input, Tooltip } from '@mantine/core';
import { Eye, EyeOff, Info, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';

export default function StoryboardNode(props: NodeProps<StoryboardNodeData>) {
  const [title, setTitle] = useState(props.data.storyboard.title);
  useEffect(
    () => setTitle(props.data.storyboard.title),
    [props.data.storyboard.title]
  );
  const [showImageByIdx, setShowImageByIdx] = useState(new Map());
  const { dimensions, regenerating, outOfSync, storyboard } = props.data;

  const { regenerateStoryboardNode } = useStore();

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
      <Card className="h-full" withBorder>
        <div className="flex justify-between mb-2">
          <p className="font-bold text-sm">Storyboard</p>
          <ActionIcon.Group>
            {/* <ActionIcon variant="default">
              <Eye />
            </ActionIcon> */}
            <ActionIcon
              variant="default"
              loading={regenerating}
              onClick={() => regenerateStoryboardNode(props.id)}
            >
              <RefreshCw />
              {outOfSync && (
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full absolute top-1 right-0"></span>
              )}
            </ActionIcon>
          </ActionIcon.Group>
        </div>
        <div className="mb-4">
          <Input
            placeholder="Storyboard Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title !== storyboard.title) console.log('TODO');
            }}
            size="lg"
            styles={{
              input: {
                textAlign: 'center',
                fontWeight: 'bold'
              }
            }}
          />
        </div>
        <div className="w-full grid grid-cols-4 gap-4">
          {' '}
          {storyboard.outline.map((frame, idx) => (
            <div key={idx} className="flex flex-col gap-2 pb-2 relative">
              <div className="flex justify-end mb-2">
                <ActionIcon.Group>
                  <ActionIcon
                    variant="default"
                    size="sm"
                    onClick={() => {
                      const updated = new Map(showImageByIdx);
                      if (showImageByIdx.get(idx)) {
                        updated.delete(idx);
                      } else {
                        updated.set(idx, true);
                      }
                      setShowImageByIdx(updated);
                    }}
                  >
                    {showImageByIdx.get(idx) ? <EyeOff /> : <Eye />}
                  </ActionIcon>
                  <Tooltip
                    w={300}
                    multiline
                    label={
                      <div>
                        <p>
                          <b>Prompt:</b> {frame.imagePrompt}
                        </p>
                        <p>
                          <b>Negative prompt:</b> {frame.imageNegativePrompt}
                        </p>
                      </div>
                    }
                  >
                    <ActionIcon variant="default" size="sm">
                      <Info />
                    </ActionIcon>
                  </Tooltip>

                  {/* <ActionIcon variant="default" size="sm">
                    <RefreshCw />
                    {props.data.outOfSync && (
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full absolute top-1 right-0"></span>
                    )}
                  </ActionIcon> */}
                </ActionIcon.Group>
              </div>

              <div className="border-2 border-black rounded-sm">
                {showImageByIdx.get(idx) ? (
                  <img src={frame.image} />
                ) : (
                  <p>{frame.description}</p>
                )}
              </div>

              <p>{frame.caption}</p>
            </div>
          ))}
        </div>
      </Card>
      <TargetHandle />
    </>
  );
}
