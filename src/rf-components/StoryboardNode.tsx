import NotificationDot from '@/components/NotificationDot';
import { RefreshImageIcon } from '@/components/RefreshImageIcon';
import TargetHandle from '@/components/TargetHandle';
import { useStore } from '@/store';
import { StoryboardNodeData } from '@/types';
import {
  ActionIcon,
  AspectRatio,
  Card,
  Input,
  Skeleton,
  Switch,
  Textarea,
  Tooltip
} from '@mantine/core';
import {
  ImageIcon,
  ImageOff,
  MessageCircleQuestion,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';

export default function StoryboardNode(props: NodeProps<StoryboardNodeData>) {
  const [showImage, setShowImage] = useState(false);

  const { outOfSync, storyboard } = props.data;

  const [title, setTitle] = useState(storyboard.title);
  useEffect(() => {
    setTitle(storyboard.title);
  }, [storyboard.title]);

  const [descriptions, setDescriptions] = useState<string[]>(
    storyboard.outline.map((frame) => frame.description)
  );
  useEffect(() => {
    setDescriptions(storyboard.outline.map((frame) => frame.description));
  }, [storyboard.outline]);

  const [captions, setCaptions] = useState<string[]>(
    storyboard.outline.map((frame) => frame.caption)
  );
  useEffect(() => {
    setCaptions(storyboard.outline.map((frame) => frame.caption));
  }, [storyboard.outline]);

  const [loadingMap, setLoadingMap] = useState<boolean[]>(
    Array(storyboard.outline.length).fill(false)
  );
  const loading = loadingMap.some((regenerating) => regenerating);
  const imagesOutOfSync = storyboard.outline.some(
    (frame) => frame.imageOutOfSync
  );

  const {
    globalShowImage,
    regenerateStoryboardNode,
    updateNode,
    generateStoryboardImages
  } = useStore((state) => ({
    globalShowImage: state.globalShowImage,
    regenerateStoryboardNode: state.regenerateStoryboardNode,
    updateNode: state.updateNode,
    generateStoryboardImages: state.generateStoryboardImages
  }));

  function handleTitleChange(nodeId: string, title: string) {
    updateNode(nodeId, {
      data: {
        storyboard: {
          title,
          outline: storyboard.outline.map((frame) => ({
            ...frame,
            imageOutOfSync: true
          }))
        }
      }
    });
  }

  function handleDescriptionChange(
    nodeId: string,
    frameIdx: number,
    description: string
  ) {
    updateNode(nodeId, {
      data: {
        storyboard: {
          outline: storyboard.outline.map((frame, idx) =>
            idx === frameIdx
              ? {
                  ...frame,
                  description,
                  imageOutOfSync: true
                }
              : frame
          )
        }
      }
    });
  }

  function handleCaptionChange(
    nodeId: string,
    frameIdx: number,
    caption: string
  ) {
    updateNode(nodeId, {
      data: {
        storyboard: {
          outline: storyboard.outline.map((frame, idx) =>
            idx === frameIdx
              ? {
                  ...frame,
                  caption,
                  imageOutOfSync: true
                }
              : frame
          )
        }
      }
    });
  }

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
          <div className="flex gap-2 items-center nodrag">
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
              onClick={() => {
                alert('Not implemented yet');
              }}
            >
              <Settings className="w-5 h-5" />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="sm"
              loading={loading}
              onClick={() => {
                alert('Not implemented yet');
              }}
            >
              <MessageCircleQuestion className="w-5 h-5" />
              {/* {feedback && feedbackOutOfSync && <NotificationDot />} */}
            </ActionIcon>
            <Tooltip label="Regenerate images">
              <ActionIcon
                variant="subtle"
                size="sm"
                loading={loading}
                onClick={async () => {
                  setLoadingMap(Array(storyboard.outline.length).fill(true));

                  generateStoryboardImages(props.id).then((imagePromises) => {
                    imagePromises.forEach((imagePromise) => {
                      imagePromise.then((idx) => {
                        setLoadingMap(
                          loadingMap.map((regenerating, i) =>
                            i === idx ? false : regenerating
                          )
                        );
                      });
                    });
                  });
                }}
              >
                <RefreshImageIcon />
                {imagesOutOfSync && <NotificationDot />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Regenerate">
              <ActionIcon
                variant="subtle"
                size="sm"
                loading={loading}
                onClick={async () => {
                  setLoadingMap(Array(storyboard.outline.length).fill(true));
                  await regenerateStoryboardNode(props.id);
                  setLoadingMap(Array(storyboard.outline.length).fill(false));
                }}
              >
                <RefreshCw />
                {outOfSync && <NotificationDot />}
              </ActionIcon>
            </Tooltip>
          </div>
        </div>
        <div className="mb-4">
          <Input
            placeholder="Storyboard Title"
            className="nodrag"
            disabled={loading}
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            onBlur={() => {
              if (title !== storyboard.title) {
                handleTitleChange(props.id, title);
              }
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
          {storyboard.outline.map((frame, frameIdx) => (
            <div key={frameIdx} className="flex flex-col gap-2 pb-2 relative">
              <div className="flex justify-between mb-2">
                <p className="font-bold text-sm">
                  Frame {frameIdx + 1} - {frameTypeText(frame.frameType)}
                </p>
              </div>

              <div
                className={`border-2 rounded-sm ${frameTypeBorder(
                  frame.frameType
                )}`}
              >
                <AspectRatio ratio={1}>
                  {showImage || globalShowImage ? (
                    <>
                      {loadingMap[frameIdx] ? (
                        <Skeleton />
                      ) : (
                        <img src={frame.image} />
                      )}
                    </>
                  ) : (
                    <textarea
                      className="block size-full resize-none p-2 text-md flex-grow outline-none nodrag"
                      disabled={loading}
                      value={descriptions[frameIdx]}
                      onChange={(e) => {
                        setDescriptions(
                          descriptions.map((d, i) =>
                            i === frameIdx ? e.target.value : d
                          )
                        );
                      }}
                      onBlur={() => {
                        if (descriptions[frameIdx] !== frame.description) {
                          handleDescriptionChange(
                            props.id,
                            frameIdx,
                            descriptions[frameIdx]
                          );
                        }
                      }}
                    />
                  )}
                </AspectRatio>
              </div>

              <Textarea
                className="nodrag"
                autosize
                disabled={loading}
                value={captions[frameIdx]}
                onChange={(e) => {
                  setCaptions(
                    captions.map((c, i) =>
                      i === frameIdx ? e.target.value : c
                    )
                  );
                }}
                onBlur={() => {
                  if (captions[frameIdx] !== frame.caption) {
                    handleCaptionChange(props.id, frameIdx, captions[frameIdx]);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </Card>
      <TargetHandle />
    </>
  );
}

function frameTypeText(
  frameType: 'context' | 'problem' | 'solution' | 'resolution'
) {
  if (frameType === 'context') return 'Context 👤';
  if (frameType === 'problem') return 'Problem 🚨';
  if (frameType === 'solution') return 'Solution 💡';
  if (frameType === 'resolution') return 'Resolution 🎉';
}

function frameTypeBorder(
  frameType: 'context' | 'problem' | 'solution' | 'resolution'
) {
  if (frameType === 'context') return 'border-yellow-500';
  if (frameType === 'problem') return 'border-red-500';
  if (frameType === 'solution') return 'border-blue-500';
  if (frameType === 'resolution') return 'border-green-500';
}
