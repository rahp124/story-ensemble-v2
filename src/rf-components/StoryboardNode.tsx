import TargetHandle from '@/components/TargetHandle';
import { useStore } from '@/store';
import { StoryboardNodeData } from '@/types';
import { ActionIcon, Card, Input, SimpleGrid } from '@mantine/core';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NodeProps } from 'reactflow';

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
      {/* <NodeResizer
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
      /> */}
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
      {/* <Card className="w-[1200px]">
        <CardHeader>
          <div className="flex gap-4 justify-between items-center">
            <CardTitle className="text-center">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="mt-8">
          <div className="flex justify-between gap-6">
            <div className="w-full grid grid-cols-4 gap-4">
              {outline.map((frame, idx) => {
                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 border-2 border-black rounded-sm pb-2 relative"
                  >
                    <div className="w-full">
                      {frame.image ? (
                        <img src={frame.image} />
                      ) : (
                        <p className="p-1">{frame.description}</p>
                      )}
                    </div>
                    {frame.image && (
                      <HoverCard openDelay={100}>
                        <HoverCardTrigger
                          asChild
                          className="absolute top-1 right-1"
                        >
                          <Button variant="outline" size="icon">
                            <Code className="h-4 w-4" />
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="flex flex-col gap-4">
                          <p className="mb-2">
                            <b>Prompt</b>: {frame.imagePrompt}
                          </p>
                          <p>
                            <b>Negative prompt</b>: {frame.imageNegativePrompt}
                          </p>
                          <Button variant="secondary">Regenerate image</Button>
                        </HoverCardContent>
                      </HoverCard>
                    )}
                    {frame.image && (
                      <p className="text-sm text-center">{frame.caption}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            className="w-fit m-auto"
            disabled={generatingImages}
            onClick={async () => {
              setGeneratingImages(true);
              await generateStoryboardImages(id);
              setGeneratingImages(false);
            }}
          >
            Generate storyboard images
            {generatingImages && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            )}
          </Button>
        </CardFooter>
      </Card> */}
      <TargetHandle />
    </>
  );
}
