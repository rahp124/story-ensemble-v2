import { Loader } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { FrameOutline } from '@/types';

export const FRAME_LABEL: Record<FrameOutline['frameType'], string> = {
  Context: 'Context',
  Problem: 'Problem',
  Action: 'Action',
  Resolution: 'Resolution'
};

export type StoryboardPanelFrame = {
  id?: string;
  frameType: FrameOutline['frameType'];
  image?: string;
  caption?: string;
};

export type PanelFrameState = 'upcoming' | 'active' | 'complete';

function MissingImageTile({ label, compact }: { label: string; compact?: boolean }) {
  return (
    <div
      className={`w-full aspect-square bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 px-2 text-center ${
        compact ? 'text-[10px]' : 'text-xs'
      }`}
    >
      {label}
    </div>
  );
}

function FrameThumb({
  src,
  alt,
  loading,
  clickable,
  forcePlaceholder,
  active,
  compact,
  onClick
}: {
  src: string;
  alt: string;
  loading?: boolean;
  clickable?: boolean;
  forcePlaceholder?: boolean;
  active?: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  const [errored, setErrored] = useState(false);

  const content =
    loading ? (
      <div className="w-full aspect-square bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
        <Loader size="sm" />
      </div>
    ) : forcePlaceholder || !src || errored ? (
      <MissingImageTile
        label={forcePlaceholder ? 'Not started' : src ? 'Missing image' : 'No image'}
        compact={compact}
      />
    ) : (
      <img
        src={src}
        alt={alt}
        onError={() => setErrored(true)}
        className="w-full aspect-square object-cover rounded-lg border border-gray-200"
      />
    );

  const wrapped = (
    <div
      className={`rounded-lg ${
        active ? 'ring-2 ring-blue-600 ring-offset-2' : ''
      }`}
    >
      {content}
    </div>
  );

  if (clickable && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="w-full text-left rounded-lg transition ring-offset-2 hover:ring-2 hover:ring-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {wrapped}
      </button>
    );
  }

  return wrapped;
}

function CaptionField({
  frameIdx,
  value,
  editable,
  expandCaptions,
  onCaptionChange
}: {
  frameIdx: number;
  value: string;
  editable: boolean;
  expandCaptions?: boolean;
  onCaptionChange?: (index: number, caption: string) => void;
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  if (expandCaptions) {
    if (!value && !editable) return null;
    return (
      <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap break-words">
        {value || ' '}
      </p>
    );
  }

  if (!editable) {
    if (!value) return null;
    return (
      <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap break-words leading-relaxed">
        {value}
      </p>
    );
  }

  return (
    <textarea
      className="text-sm text-gray-700 mt-2 w-full border border-gray-200 rounded-lg p-2 resize-none min-h-[9rem] focus:outline-none focus:ring-2 focus:ring-blue-400"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) {
          onCaptionChange?.(frameIdx, local);
        }
      }}
      placeholder="Caption..."
    />
  );
}

export interface StoryboardPanelStripProps {
  frames: StoryboardPanelFrame[];
  title?: string;
  variant?: 'editor' | 'progress';
  activeIndex?: number;
  frameStates?: PanelFrameState[];
  clickableCompletedOnly?: boolean;
  editableCaptions?: boolean;
  expandCaptions?: boolean;
  onCaptionChange?: (index: number, caption: string) => void;
  onFrameClick?: (index: number) => void;
  loadingIndices?: boolean[];
}

export function StoryboardPanelStrip({
  frames,
  title = 'Storyboard',
  variant = 'editor',
  activeIndex,
  frameStates,
  clickableCompletedOnly = false,
  editableCaptions = false,
  expandCaptions = false,
  onCaptionChange,
  onFrameClick,
  loadingIndices
}: StoryboardPanelStripProps) {
  const isProgress = variant === 'progress';
  const columnWidth = isProgress ? 'w-20 md:w-24' : 'w-56';
  const gap = isProgress ? 'gap-2 md:gap-3' : 'gap-4';

  return (
    <div className="flex justify-center">
      <div className={`flex ${gap}`}>
        {frames.map((frame, frameIdx) => {
          const state = frameStates?.[frameIdx];
          const isActive = isProgress && activeIndex === frameIdx;
          const isComplete = state === 'complete';
          const forcePlaceholder = isProgress && state === 'upcoming';
          const clickable =
            Boolean(onFrameClick) &&
            !expandCaptions &&
            (!clickableCompletedOnly || isComplete);

          return (
            <div
              key={frame.id ?? frame.frameType}
              className={`${columnWidth} flex-shrink-0 flex flex-col`}
            >
              <FrameThumb
                src={frame.image ?? ''}
                alt={`${title} — ${FRAME_LABEL[frame.frameType]}`}
                loading={loadingIndices?.[frameIdx]}
                clickable={clickable}
                forcePlaceholder={forcePlaceholder}
                active={isActive}
                compact={isProgress}
                onClick={
                  clickable && onFrameClick
                    ? () => onFrameClick(frameIdx)
                    : undefined
                }
              />
              <span
                className={`mt-2 inline-block self-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  isActive
                    ? 'text-gray-900 bg-gray-200'
                    : isComplete
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-400 bg-gray-100'
                }`}
              >
                {FRAME_LABEL[frame.frameType]}
              </span>
              {!isProgress && (
                <CaptionField
                  frameIdx={frameIdx}
                  value={frame.caption ?? ''}
                  editable={editableCaptions}
                  expandCaptions={expandCaptions}
                  onCaptionChange={onCaptionChange}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
