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

function MissingImageTile({ label }: { label: string }) {
  return (
    <div className="w-full aspect-square bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400 px-2 text-center">
      {label}
    </div>
  );
}

function FrameThumb({
  src,
  alt,
  loading,
  clickable,
  onClick
}: {
  src: string;
  alt: string;
  loading?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}) {
  const [errored, setErrored] = useState(false);

  const content =
    loading ? (
      <div className="w-full aspect-square bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
        <Loader size="sm" />
      </div>
    ) : !src || errored ? (
      <MissingImageTile label={src ? `Missing image` : 'No image'} />
    ) : (
      <img
        src={src}
        alt={alt}
        onError={() => setErrored(true)}
        className="w-full aspect-square object-cover rounded-lg border border-gray-200"
      />
    );

  if (clickable && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="w-full text-left rounded-lg transition ring-offset-2 hover:ring-2 hover:ring-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {content}
      </button>
    );
  }

  return content;
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
  editableCaptions?: boolean;
  expandCaptions?: boolean;
  onCaptionChange?: (index: number, caption: string) => void;
  onFrameClick?: (index: number) => void;
  loadingIndices?: boolean[];
}

export function StoryboardPanelStrip({
  frames,
  title = 'Storyboard',
  editableCaptions = false,
  expandCaptions = false,
  onCaptionChange,
  onFrameClick,
  loadingIndices
}: StoryboardPanelStripProps) {
  return (
    <div className="flex justify-center">
      <div className="flex gap-4">
        {frames.map((frame, frameIdx) => (
          <div
            key={frame.id ?? frame.frameType}
            className="w-56 flex-shrink-0 flex flex-col"
          >
            <FrameThumb
              src={frame.image ?? ''}
              alt={`${title} — ${FRAME_LABEL[frame.frameType]}`}
              loading={loadingIndices?.[frameIdx]}
              clickable={Boolean(onFrameClick) && !expandCaptions}
              onClick={
                onFrameClick && !expandCaptions
                  ? () => onFrameClick(frameIdx)
                  : undefined
              }
            />
            <span className="mt-3 inline-block self-start text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {FRAME_LABEL[frame.frameType]}
            </span>
            <CaptionField
              frameIdx={frameIdx}
              value={frame.caption ?? ''}
              editable={editableCaptions}
              expandCaptions={expandCaptions}
              onCaptionChange={onCaptionChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
