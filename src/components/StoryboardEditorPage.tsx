import { StylePreset } from '@/api/stableDiffusion';
import { NodeType } from '@/rf-components';
import { useStore } from '@/store';
import { StoryboardNodeData } from '@/types';
import {
  ActionIcon,
  CloseButton,
  Input,
  Popover,
  Select,
  Tooltip
} from '@mantine/core';
import { DownloadIcon, Settings } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Node } from 'reactflow';
import { StoryboardPanelStrip } from './StoryboardPanelStrip';
import { StoryboardFrameAestheticModal } from './StoryboardFrameAestheticModal';

const STYLE_PRESETS: StylePreset[] = [
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
];

function useActiveStoryboardNode(): Node<StoryboardNodeData> | undefined {
  return useStore((state) => {
    const storyboards = state.nodes.filter(
      (n): n is Node<StoryboardNodeData> => n.type === NodeType.Storyboard
    );
    return storyboards[storyboards.length - 1];
  });
}

export function StoryboardEditorPage() {
  const node = useActiveStoryboardNode();
  const updateStoryboardTitle = useStore((s) => s.updateStoryboardTitle);
  const updateStoryboardCaption = useStore((s) => s.updateStoryboardCaption);
  const updateStoryboardImageStyle = useStore((s) => s.updateStoryboardImageStyle);
  const addStudyEvent = useStore((s) => s.addStudyEvent);

  const cardRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aestheticFrameIndex, setAestheticFrameIndex] = useState<number | null>(
    null
  );
  const [expandCaptionsForCapture, setExpandCaptionsForCapture] = useState(false);

  const storyboard = node?.data.storyboard;

  useEffect(() => {
    if (storyboard?.title !== undefined) {
      setTitle(storyboard.title);
    }
  }, [storyboard?.title]);

  if (!node || !storyboard) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6 text-gray-500">
        No storyboard available. Start a new story to create one.
      </div>
    );
  }

  const handleTitleBlur = () => {
    if (title !== storyboard.title) {
      addStudyEvent({
        initiator: 'user',
        type: 'EDIT_STORYBOARD_TITLE',
        count: 1,
        data: {}
      });
      updateStoryboardTitle(node.id, title);
    }
  };

  const handleCaptionChange = (frameIdx: number, caption: string) => {
    updateStoryboardCaption(node.id, frameIdx, caption);
  };

  async function downloadStoryboard() {
    if (!cardRef.current) return;

    flushSync(() => setExpandCaptionsForCapture(true));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    try {
      const image = await toJpeg(cardRef.current, {
        backgroundColor: 'white',
        pixelRatio: 2,
        filter: (domNode) => {
          if (
            domNode instanceof HTMLElement &&
            domNode.classList.contains('hide-in-screenshot')
          ) {
            return false;
          }
          return true;
        }
      });

      const a = document.createElement('a');
      a.setAttribute('href', image);
      a.setAttribute('download', 'storyboard.jpg');
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setExpandCaptionsForCapture(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center p-6 pt-24">
      <div className="max-w-6xl w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
              Your storyboard
            </p>
            <Input
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              onBlur={handleTitleBlur}
              placeholder="Storyboard title"
              size="lg"
              styles={{
                input: {
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  border: 'none',
                  background: 'transparent',
                  paddingLeft: 0
                }
              }}
              className="max-w-xl"
            />
          </div>
          <div className="hide-in-screenshot flex gap-2 items-center">
            <Popover
              width={350}
              withArrow
              shadow="md"
              opened={settingsOpen}
              onChange={setSettingsOpen}
            >
              <Popover.Target>
                <ActionIcon
                  variant="subtle"
                  onClick={() => setSettingsOpen((prev) => !prev)}
                >
                  <Settings />
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown>
                <div className="flex justify-between">
                  <h4 className="font-bold mb-4">Storyboard settings</h4>
                  <CloseButton onClick={() => setSettingsOpen(false)} />
                </div>
                <Select
                  label="Image style"
                  comboboxProps={{ withinPortal: false }}
                  allowDeselect={false}
                  data={STYLE_PRESETS}
                  value={storyboard.artStyle}
                  onChange={(value) => {
                    updateStoryboardImageStyle(node.id, value as StylePreset);
                  }}
                />
              </Popover.Dropdown>
            </Popover>
            <Tooltip label="Download storyboard image">
              <ActionIcon variant="subtle" onClick={downloadStoryboard}>
                <DownloadIcon />
              </ActionIcon>
            </Tooltip>
          </div>
        </div>

        <div
          ref={cardRef}
          className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-4 ${
            expandCaptionsForCapture ? 'overflow-visible' : 'overflow-x-auto'
          }`}
        >
          <StoryboardPanelStrip
            frames={storyboard.outline.map((frame) => ({
              id: frame.id,
              frameType: frame.frameType,
              image: frame.image,
              caption: frame.caption
            }))}
            title={storyboard.title || 'Storyboard'}
            editableCaptions
            expandCaptions={expandCaptionsForCapture}
            onCaptionChange={handleCaptionChange}
            onFrameClick={setAestheticFrameIndex}
          />
        </div>
      </div>

      <StoryboardFrameAestheticModal
        storyboardId={node.id}
        frameIndex={aestheticFrameIndex}
        onClose={() => setAestheticFrameIndex(null)}
      />
    </div>
  );
}
