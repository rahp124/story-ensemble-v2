import NotificationDot from '@/components/NotificationDot';
import TargetHandle from '@/components/TargetHandle';
import { useStore } from '@/store';
import { StoryboardNodeData } from '@/types';
import { ActionIcon, Card, Input, Switch, Tooltip } from '@mantine/core';
import { ImageIcon, ImageOff, Info, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';

export default function StoryboardNode(props: NodeProps<StoryboardNodeData>) {
  const [title, setTitle] = useState(props.data.storyboard.title);
  useEffect(
    () => setTitle(props.data.storyboard.title),
    [props.data.storyboard.title]
  );
  const [showImage, setShowImage] = useState(false);

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
          <p className="font-bold text-sm">
            <span className="mr-1">🎞</span> Storyboard
          </p>
          <div className="flex gap-2">
            <Switch
              size="sm"
              checked={showImage}
              onChange={(event) => setShowImage(event.currentTarget.checked)}
              onLabel={<ImageIcon className="w-3 h-3" />}
              offLabel={<ImageOff className="w-3 h-3" />}
            />
            <ActionIcon
              variant="subtle"
              size="sm"
              loading={regenerating}
              onClick={() => regenerateStoryboardNode(props.id)}
            >
              <RefreshCw />
              {outOfSync && <NotificationDot />}
            </ActionIcon>
          </div>
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
                </ActionIcon.Group>
              </div>

              <div className="border-2 border-black rounded-sm">
                {showImage ? (
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
