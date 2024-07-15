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
import { ImageIcon, ImageOff, RefreshCwIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import { NodeType, nodeTypeDisplayAttributes } from '.';
import { useZoom } from '@/lib/useZoom';

const displayAttributes = nodeTypeDisplayAttributes(NodeType.Storyboard);

export default function StoryboardNode(props: NodeProps<StoryboardNodeData>) {
  const [showImage, setShowImage] = useState(false);
  const { zoomShowImage } = useZoom();

  const { storyboard, outOfSync } = props.data;

  const [title, setTitle] = useState(storyboard.title);
  const [descriptions, setDescriptions] = useState<string[]>(
    storyboard.outline.map((frame) => frame.description)
  );
  const [captions, setCaptions] = useState<string[]>(
    storyboard.outline.map((frame) => frame.caption)
  );

  useEffect(() => {
    setTitle(storyboard.title);
    setDescriptions(storyboard.outline.map((frame) => frame.description));
    setCaptions(storyboard.outline.map((frame) => frame.caption));
  }, [storyboard.title, storyboard.outline]);

  const [loadingMap, setLoadingMap] = useState<boolean[]>(
    Array(storyboard.outline.length).fill(false)
  );
  const loading = loadingMap.some((regenerating) => regenerating);
  const imagesOutOfSync = storyboard.outline.some(
    (frame) => frame.imageOutOfSync
  );
  const [regenerating, setRegenerating] = useState(false);

  const {
    regenerateStoryboardNode,

    globalShowImage,

    generateStoryboardImages,

    updateStoryboardTitle,
    updateStoryboardDescription,
    updateStoryboardCaption
  } = useStore((state) => ({
    regenerateStoryboardNode: state.regenerateStoryboardNode,

    globalShowImage: state.globalShowImage,

    generateStoryboardImages: state.generateStoryboardImages,

    updateStoryboardTitle: state.updateStoryboardTitle,
    updateStoryboardDescription: state.updateStoryboardDescription,
    updateStoryboardCaption: state.updateStoryboardCaption,

    selectNodes: state.selectNodes,

    setIterateModalOpen: state.setIterateModalOpen,
    setIterateModalTab: state.setIterateModalTab
  }));

  const icons = [
    {
      key: 'regenerate',
      show: true,
      tooltip: 'Regenerate images',
      icon: <RefreshImageIcon />,
      notification: imagesOutOfSync,
      loading: loading || regenerating,
      onClick: async () => {
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
      }
    },
    {
      key: 'sync',
      show: outOfSync,
      tooltip: 'Dependencies updated. Regenerate node.',
      icon: <RefreshCwIcon />,
      notification: true,
      loading: regenerating,
      onClick: async () => {
        if (regenerating) return;

        setRegenerating(true);
        await regenerateStoryboardNode(
          props.id,
          'Regenerate storyboard based on updated personas, problems, and solutions'
        );
        setRegenerating(false);
      }
    }
  ]
    .filter(({ show }) => show)
    .map(({ key, tooltip, icon, notification, loading, onClick }) => {
      const iconElement = (
        <ActionIcon
          key={key}
          variant="subtle"
          size="sm"
          loading={loading}
          onClick={onClick}
        >
          {icon}
          {notification && <NotificationDot />}
        </ActionIcon>
      );

      return tooltip ? (
        <Tooltip key={key} label={tooltip}>
          {iconElement}
        </Tooltip>
      ) : (
        iconElement
      );
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
      <Card className="h-full" withBorder>
        <div className="flex justify-between mb-2">
          <p className="font-bold text-sm">
            <span className="mr-1">{displayAttributes.emoji}</span> Storyboard
          </p>
          <div className="flex gap-2 items-center nodrag">
            <Switch
              size="sm"
              checked={showImage}
              onChange={(event) => setShowImage(event.currentTarget.checked)}
              onLabel={<ImageIcon className="w-3 h-3" />}
              offLabel={<ImageOff className="w-3 h-3" />}
            />
            {icons}
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
                updateStoryboardTitle(props.id, title);
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
                  {showImage || globalShowImage || zoomShowImage ? (
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
                          updateStoryboardDescription(
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
                    updateStoryboardCaption(
                      props.id,
                      frameIdx,
                      captions[frameIdx]
                    );
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
