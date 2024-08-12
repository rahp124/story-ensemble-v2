import NotificationDot from '@/components/NotificationDot';
import { RefreshImageIcon } from '@/components/RefreshImageIcon';
import TargetHandle from '@/components/TargetHandle';
import { useStore } from '@/store';
import { StoryboardNodeData } from '@/types';
import {
  ActionIcon,
  AspectRatio,
  Button,
  Card,
  CloseButton,
  Divider,
  Input,
  Loader,
  Popover,
  Select,
  Textarea,
  Tooltip
} from '@mantine/core';
import { Pencil, RefreshCwIcon, Settings, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import { NodeType, nodeTypeDisplayAttributes } from '.';
import { useDisplayStore } from '@/lib/displayStore';
import { StylePreset } from '@/api/stableDiffusion';

const displayAttributes = nodeTypeDisplayAttributes(NodeType.Storyboard);

export default function StoryboardNode(props: NodeProps<StoryboardNodeData>) {
  const { storyboard, outOfSync } = props.data;

  const [title, setTitle] = useState(storyboard.title);
  const [descriptions, setDescriptions] = useState<string[]>(
    storyboard.outline.map((frame) => frame.description)
  );
  const [captions, setCaptions] = useState<string[]>(
    storyboard.outline.map((frame) => frame.caption)
  );
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [storyboardSettingsOpen, setStoryboardSettingsOpen] = useState(false);

  useEffect(() => {
    setTitle(storyboard.title);
    setDescriptions(storyboard.outline.map((frame) => frame.description));
    setCaptions(storyboard.outline.map((frame) => frame.caption));
  }, [storyboard.title, storyboard.outline]);

  const [loadingMap, setLoadingMap] = useState<boolean[]>(
    Array(storyboard.outline.length).fill(false)
  );
  const someLoading = loadingMap.some((regenerating) => regenerating);
  const imagesOutOfSync = storyboard.outline.some(
    (frame) => frame.imageOutOfSync
  );
  const { regenerating, setRegeneratingNode } = useDisplayStore((state) => ({
    regenerating: state.regeneratingNodes.has(props.id),
    setRegeneratingNode: state.setRegeneratingNode
  }));

  const {
    regenerateStoryboardNode,

    generateStoryboardImages,
    regenerateStoryboardImage,

    updateStoryboardTitle,
    updateStoryboardDescription,
    updateStoryboardCaption,
    updateStoryboardFrameType,
    updateStoryboardImageStyle,

    addStoryboardFrame,
    deleteStoryboardFrame,

    addStudyEvent
  } = useStore((state) => ({
    regenerateStoryboardNode: state.regenerateStoryboardNode,

    generateStoryboardImages: state.generateStoryboardImages,
    regenerateStoryboardImage: state.regenerateStoryboardImage,

    updateStoryboardTitle: state.updateStoryboardTitle,
    updateStoryboardDescription: state.updateStoryboardDescription,
    updateStoryboardCaption: state.updateStoryboardCaption,
    updateStoryboardFrameType: state.updateStoryboardFrameType,
    updateStoryboardImageStyle: state.updateStoryboardImageStyle,

    addStoryboardFrame: state.addStoryboardFrame,
    deleteStoryboardFrame: state.deleteStoryboardFrame,

    selectNodes: state.selectNodes,

    setIterateModalOpen: state.setIterateModalOpen,
    setIterateModalTab: state.setIterateModalTab,

    addStudyEvent: state.addStudyEvent
  }));

  const regenerateAllImages = async () => {
    if (regenerating) return;

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

    addStudyEvent({
      initiator: 'user',
      type: 'ALL_IMAGES_REGENERATE_STORYBOARD_FRAMES',
      count: storyboard.outline.length,
      data: {}
    });
  };

  const icons = [
    {
      key: 'regenerate',
      show: true,
      tooltip: 'Regenerate images',
      icon: <RefreshImageIcon />,
      notification: imagesOutOfSync,
      loading: regenerating || someLoading,
      onClick: regenerateAllImages
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

        setRegeneratingNode(props.id, true);
        await regenerateStoryboardNode(
          props.id,
          'Regenerate storyboard based on updated personas, problems, and solutions'
        );
        setRegeneratingNode(props.id, false);

        addStudyEvent({
          initiator: 'user',
          type: 'SYNC_REGENERATE_STORYBOARDS',
          count: 1,
          data: {
            sourceNodeType: 'STORYBOARD'
          }
        });
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
      <Card
        className={`size-full ${
          props.selected ? 'nowheel border-blue-600' : 'border-transparent'
        }`}
        withBorder
        shadow="sm"
        radius="lg"
      >
        <div className="flex justify-between mb-2">
          <p className="font-bold text-sm">
            <span className="mr-1">{displayAttributes.emoji}</span> Storyboard
          </p>
          <div className="flex gap-2 items-center nodrag">
            <Popover
              width={350}
              withArrow
              shadow="md"
              disabled={regenerating || someLoading}
              opened={storyboardSettingsOpen}
              onChange={(change) => setStoryboardSettingsOpen(change)}
            >
              <Popover.Target>
                <ActionIcon
                  variant="subtle"
                  disabled={regenerating || someLoading}
                  onClick={() => {
                    setStoryboardSettingsOpen((prev) => !prev);
                  }}
                >
                  <Settings />
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown>
                <div className="flex justify-between">
                  <h4 className="font-bold mb-4">Storyboard settings</h4>
                  <CloseButton
                    onClick={() => setStoryboardSettingsOpen(false)}
                  />
                </div>
                <Select
                  label="Image style"
                  comboboxProps={{ withinPortal: false }}
                  allowDeselect={false}
                  data={[
                    '3d-model',
                    'analog-film',
                    'anime',
                    'cinematic',
                    'comic-book',
                    'digital-art',
                    'enhance',
                    'fantasy-art',
                    'isometric',
                    'line-art',
                    'low-poly',
                    'modeling-compound',
                    'neon-punk',
                    'origami',
                    'photographic',
                    'pixel-art',
                    'tile-texture'
                  ]}
                  value={storyboard.artStyle}
                  onChange={(value) => {
                    updateStoryboardImageStyle(props.id, value as StylePreset);
                  }}
                />
              </Popover.Dropdown>
            </Popover>

            {icons}
          </div>
        </div>
        <div className="mb-4">
          <Input
            placeholder="Storyboard Title"
            className="nodrag"
            disabled={regenerating || someLoading}
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            onBlur={() => {
              if (title !== storyboard.title) {
                addStudyEvent({
                  initiator: 'user',
                  type: 'EDIT_STORYBOARD_TITLE',
                  count: 1,
                  data: {}
                });

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
        <div className="w-full flex flex-wrap justify-center gap-6 px-6">
          {storyboard.outline.map((frame, frameIdx) => (
            <div
              key={frame.id}
              className="w-[350px] flex flex-col gap-2 pb-2 relative"
            >
              <div className="flex justify-between mb-2">
                <p className="font-bold text-sm">
                  Frame {frameIdx + 1} - {frameTypeText(frame.frameType)}
                </p>
                <Popover
                  width={350}
                  position="left-end"
                  withArrow
                  shadow="md"
                  disabled={regenerating || loadingMap[frameIdx]}
                  opened={openPopoverId === frame.id}
                  onChange={(change) =>
                    setOpenPopoverId(change ? frame.id : null)
                  }
                >
                  <Popover.Target>
                    <ActionIcon
                      size="sm"
                      variant="outline"
                      disabled={regenerating || loadingMap[frameIdx]}
                      onClick={() => {
                        if (openPopoverId === frame.id) {
                          setOpenPopoverId(null);
                        } else {
                          setOpenPopoverId(frame.id);
                        }
                      }}
                    >
                      <Pencil className="size-4" />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <h4 className="font-bold mb-4">
                      Edit frame {frameIdx + 1}
                    </h4>
                    <div className="flex flex-col gap-2">
                      <Select
                        label="Edit Frame Type"
                        comboboxProps={{ withinPortal: false }}
                        allowDeselect={false}
                        data={(
                          [
                            'Context',
                            'Problem',
                            'Solution',
                            'Resolution'
                          ] as const
                        ).map((value) => ({
                          value,
                          label: frameTypeText(value) ?? ''
                        }))}
                        value={frame.frameType}
                        onChange={(value) => {
                          updateStoryboardFrameType(
                            props.id,
                            frameIdx,
                            value as
                              | 'Context'
                              | 'Problem'
                              | 'Solution'
                              | 'Resolution'
                          );
                        }}
                      />
                      <Textarea
                        label="Description"
                        description="Describe the contents and visuals of the frame to directly guide image generation."
                        autosize
                        minRows={3}
                        maxRows={8}
                        disabled={regenerating || loadingMap[frameIdx]}
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
                      <Textarea
                        label="Caption"
                        description="Text that appears below the image."
                        autosize
                        minRows={2}
                        maxRows={8}
                        rows={2}
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
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="compact-sm"
                          onClick={async () => {
                            if (loadingMap[frameIdx]) return;

                            setLoadingMap(
                              loadingMap.map((regenerating, i) =>
                                i === frameIdx ? true : regenerating
                              )
                            );
                            await regenerateStoryboardImage(props.id, frameIdx);
                            setLoadingMap(
                              loadingMap.map((regenerating, i) =>
                                i === frameIdx ? false : regenerating
                              )
                            );

                            addStudyEvent({
                              initiator: 'user',
                              type: 'SINGLE_IMAGE_REGENERATE_STORYBOARD_FRAMES',
                              count: 1,
                              data: {}
                            });
                          }}
                        >
                          Regenerate image
                        </Button>
                        <Button
                          size="compact-sm"
                          onClick={async () => regenerateAllImages()}
                        >
                          Regenerate all images
                        </Button>
                      </div>
                    </div>

                    <Divider my="md" />

                    <div>
                      <Button
                        size="compact-sm"
                        color="red"
                        leftSection={<Trash2 className="size-4" />}
                        onClick={() => {
                          if (
                            confirm(
                              'Are you sure you want to delete this frame?'
                            )
                          ) {
                            deleteStoryboardFrame(props.id, frameIdx);

                            addStudyEvent({
                              initiator: 'user',
                              type: 'DELETE_STORYBOARD_FRAMES',
                              count: 1,
                              data: {}
                            });
                          }
                        }}
                      >
                        Delete frame
                      </Button>
                    </div>
                  </Popover.Dropdown>
                </Popover>
              </div>

              {/* don't show tooltip if a frame doesn't have a generated image */}
              {frame.image === undefined ? (
                <div
                  className={`border-2 rounded-sm ${frameTypeBorder(
                    frame.frameType
                  )}`}
                >
                  <AspectRatio ratio={1}>
                    {regenerating ||
                    loadingMap[frameIdx] ||
                    frame.image === '' ? (
                      <div className="size-full flex items-center justify-center">
                        <Loader />
                      </div>
                    ) : frame.image === undefined ? (
                      <div className="size-full flex items-center justify-center">
                        <p className="text-center">
                          This frame has no image.
                          <br />
                          Click the <Pencil className="inline size-4" /> icon to
                          generate one.
                        </p>
                      </div>
                    ) : (
                      <img src={frame.image} />
                    )}
                  </AspectRatio>
                </div>
              ) : (
                // show tooltip containing detailed description of a frame when a frame has a generated image
                <Tooltip
                  multiline
                  w={300}
                  withArrow
                  transitionProps={{ duration: 150 }}
                  label={frame.description}
                  events={{ hover: true, focus: true, touch: true }}
                >
                  <div
                    className={`border-2 rounded-sm ${frameTypeBorder(
                      frame.frameType
                    )}`}
                  >
                    <AspectRatio ratio={1}>
                      {regenerating ||
                      loadingMap[frameIdx] ||
                      frame.image === '' ? (
                        <div className="size-full flex items-center justify-center">
                          <Loader />
                        </div>
                      ) : frame.image === undefined ? (
                        <div className="size-full flex items-center justify-center">
                          <p className="text-center">
                            This frame has no image.
                            <br />
                            Click the <Pencil className="inline size-4" /> icon
                            to generate one.
                          </p>
                        </div>
                      ) : (
                        <img src={frame.image} />
                      )}
                    </AspectRatio>
                  </div>
                </Tooltip>
              )}

              <p>{captions[frameIdx]}</p>
              {frameIdx === 0 && (
                <button
                  className="absolute top-0 -left-3 h-full flex items-center px-1 hover:bg-slate-100 -translate-x-1/2 rounded-sm"
                  disabled={regenerating || someLoading}
                  onClick={() => {
                    addStudyEvent({
                      initiator: 'user',
                      type: 'ADD_STORYBOARD_FRAMES',
                      count: 1,
                      data: {}
                    });

                    addStoryboardFrame(props.id, frameIdx);
                  }}
                >
                  +
                </button>
              )}
              <button
                className="absolute top-0 -right-3 h-full flex items-center px-1 hover:bg-slate-100 translate-x-1/2 rounded-sm"
                disabled={regenerating || someLoading}
                onClick={() => {
                  addStudyEvent({
                    initiator: 'user',
                    type: 'ADD_STORYBOARD_FRAMES',
                    count: 1,
                    data: {}
                  });

                  addStoryboardFrame(props.id, frameIdx + 1);
                }}
              >
                +
              </button>
            </div>
          ))}
        </div>
      </Card>
      <TargetHandle />
    </>
  );
}

function frameTypeText(
  frameType: 'Context' | 'Problem' | 'Solution' | 'Resolution'
) {
  if (frameType === 'Context') return 'Context 👤';
  if (frameType === 'Problem') return 'Problem 🚨';
  if (frameType === 'Solution') return 'Solution 💡';
  if (frameType === 'Resolution') return 'Resolution 🎉';
}

function frameTypeBorder(
  frameType: 'Context' | 'Problem' | 'Solution' | 'Resolution'
) {
  if (frameType === 'Context') return 'border-yellow-500';
  if (frameType === 'Problem') return 'border-red-500';
  if (frameType === 'Solution') return 'border-blue-500';
  if (frameType === 'Resolution') return 'border-green-500';
}
