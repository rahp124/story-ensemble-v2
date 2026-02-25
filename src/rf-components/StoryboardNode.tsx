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
  FileButton,
  Input,
  Loader,
  Popover,
  Select,
  Textarea,
  Tooltip
} from '@mantine/core';
import {
  DownloadIcon,
  ImageUpIcon,
  Pencil,
  RefreshCwIcon,
  Settings,
  Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getNodesBounds,
  getViewportForBounds,
  NodeProps,
  NodeResizer,
  useReactFlow
} from 'reactflow';
import { NodeType, nodeTypeDisplayAttributes } from '.';
import { useDisplayStore } from '@/lib/displayStore';
import { StylePreset } from '@/api/stableDiffusion';
import { toJpeg } from 'html-to-image';

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
    currentNode,
    selectNodes,

    regenerateStoryboardNode,

    generateStoryboardImages,
    regenerateStoryboardImage,

    updateStoryboardTitle,
    updateStoryboardDescription,
    updateStoryboardCaption,
    updateStoryboardFrameType,
    updateStoryboardImageStyle,
    updateStoryboardImage,

    addStoryboardFrame,
    deleteStoryboardFrame,

    addStudyEvent
  } = useStore((state) => ({
    currentNode: state.nodes.find((node) => node.id === props.id),

    regenerateStoryboardNode: state.regenerateStoryboardNode,

    generateStoryboardImages: state.generateStoryboardImages,
    regenerateStoryboardImage: state.regenerateStoryboardImage,

    updateStoryboardTitle: state.updateStoryboardTitle,
    updateStoryboardDescription: state.updateStoryboardDescription,
    updateStoryboardCaption: state.updateStoryboardCaption,
    updateStoryboardFrameType: state.updateStoryboardFrameType,
    updateStoryboardImageStyle: state.updateStoryboardImageStyle,
    updateStoryboardImage: state.updateStoryboardImage,

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

  const { fitView } = useReactFlow();

  async function downloadStoryboardImage() {
    fitView({ nodes: [{ id: props.id }] });
    selectNodes([]);

    const width = currentNode!.width!;
    const height = currentNode!.height!;

    const nodesBounds = getNodesBounds([currentNode!], [0.5, 0.5]);
    const viewport = getViewportForBounds(
      nodesBounds,
      width,
      height,
      0.5,
      2,
      0
    );

    const reactflowSelector = '.react-flow__viewport';

    const image = await toJpeg(
      document.querySelector(reactflowSelector)! as HTMLElement,
      {
        backgroundColor: 'white',
        width,
        height,
        style: {
          width: `${width}`,
          height: `${height}`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
        },
        filter: (domNode) => {
          if (
            domNode &&
            domNode.classList &&
            domNode.classList.contains('hide-in-screenshot')
          ) {
            return false;
          }
          return true;
        },
        pixelRatio: 2
      }
    );

    const a = document.createElement('a');

    a.setAttribute('href', image);
    a.setAttribute('download', 'storyboard.jpg');
    document.body.appendChild(a); // required for firefox
    a.click();
    a.remove();
  }

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
      tooltip: 'Solutions updated. Regenerate node.',
      icon: <RefreshCwIcon />,
      notification: true,
      loading: regenerating,
      onClick: async () => {
        if (regenerating) return;

        setRegeneratingNode(props.id, true);
        await regenerateStoryboardNode(
          props.id,
          'Regenerate storyboard based on updated personas, problems, and solutions',
          false
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
    },
    {
      key: 'download',
      show: true,
      tooltip: 'Download storyboard image',
      icon: <DownloadIcon />,
      notification: false,
      loading: false,
      onClick: downloadStoryboardImage
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
      <Card
        className={`w-full h-max pb-6 ${
          props.selected ? 'nowheel border-blue-600' : 'border-transparent'
        }`}
        withBorder
        shadow="sm"
        radius="lg"
      >
        <div className="flex justify-between mb-2">
          <p className="font-bold text-sm whitespace-nowrap">
            <span className="mr-1">{displayAttributes.emoji}</span> Storyboard
          </p>
          <div className="hide-in-screenshot flex gap-2 items-center nodrag">
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
                <p className="font-bold text-sm whitespace-nowrap">
                  Frame {frameIdx + 1} - {frameTypeText(frame.frameType)}
                </p>
                <div className="flex gap-2">
                  <FileButton
                    onChange={async (file) => {
                      if (!file) return;

                      const imageUrl = await convertFileToImageUrl(file);
                      updateStoryboardImage(props.id, frameIdx, imageUrl);
                    }}
                    accept="image/png, image/jpeg, image/gif, image/webp, image/bmp, image/svg+xml, image/tiff"
                  >
                    {(props) => (
                      <ActionIcon
                        {...props}
                        className="hide-in-screenshot"
                        size="sm"
                        variant="outline"
                        disabled={regenerating || loadingMap[frameIdx]}
                      >
                        <ImageUpIcon className="size-4" />
                      </ActionIcon>
                    )}
                  </FileButton>
                  <div className="mt-4 flex flex-col gap-2">
                    <Input
                      placeholder="What did the AI get wrong?"
                      disabled={regenerating || loadingMap[frameIdx]}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const correction = e.currentTarget.value;
                          if (!correction) return;
                          
                          // 1. Show loading state
                          setLoadingMap(loadingMap.map((reg, i) => i === frameIdx ? true : reg));
                          
                          // 2. Append their correction to the existing description
                          const newDescription = `${descriptions[frameIdx]}. USER CORRECTION: ${correction}`;
                          updateStoryboardDescription(props.id, frameIdx, newDescription);
                          
                          // 3. Regenerate just this image
                          await regenerateStoryboardImage(props.id, frameIdx);
                          
                          // 4. Log the RQ2 study event
                          addStudyEvent({
                            initiator: 'user',
                            type: 'USER_CORRECTED_SCENE',
                            count: 1,
                            data: { frameIdx, originalText: descriptions[frameIdx], correction }
                          });

                          // 5. Turn off loading
                          setLoadingMap(loadingMap.map((reg, i) => i === frameIdx ? false : reg));
                          e.currentTarget.value = ''; // clear input
                        }
                      }}
                      size="md"
                      radius="md"
                    />
                    <p className="text-xs text-gray-400 text-center">Press Enter to fix this scene</p>
                  </div>
                </div>
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

              {/* Scrollable Caption Box */}
              <div className="overflow-y-auto nowheel nodrag max-h-32 pr-2 mt-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {captions[frameIdx]}
                </p>
              </div>
              {frameIdx === 0 && (
                <button
                  className="hide-in-screenshot absolute top-0 -left-3 h-full flex items-center px-1 hover:bg-slate-100 -translate-x-1/2 rounded-sm"
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
                className="hide-in-screenshot absolute top-0 -right-3 h-full flex items-center px-1 hover:bg-slate-100 translate-x-1/2 rounded-sm"
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

function convertFileToImageUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        resolve(event.target.result);
      } else {
        reject(new Error('Failed to convert file to image URL'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsDataURL(file);
  });
}
