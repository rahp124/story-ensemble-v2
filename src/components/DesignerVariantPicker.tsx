import { useState } from 'react';
import {
  DESIGNER_STORYBOARDS,
  type DesignerFrame
} from '@/data/designerStoryboards';
import type { FrameOutline } from '@/types';

interface DesignerVariantPickerProps {
  sceneIndex: number;
  frameType: FrameOutline['frameType'];
  onPick: (args: { variantId: string; frame: DesignerFrame }) => void;
}

const FRAME_LABEL: Record<FrameOutline['frameType'], string> = {
  Context: 'Context',
  Problem: 'Problem',
  Action: 'Action / Solution',
  Resolution: 'Resolution'
};

function MissingImageTile({ label }: { label: string }) {
  return (
    <div className="w-full aspect-square bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400 px-2 text-center">
      {label}
    </div>
  );
}

function FrameThumb({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (errored) return <MissingImageTile label={`Missing ${src}`} />;
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
    />
  );
}

export function DesignerVariantPicker({
  sceneIndex,
  frameType,
  onPick
}: DesignerVariantPickerProps) {
  const label = FRAME_LABEL[frameType];

  const options = DESIGNER_STORYBOARDS.map((variant) => ({
    variantId: variant.id,
    variantTitle: variant.title,
    frame: variant.frames.find((f) => f.frameType === frameType)
  })).filter((o): o is { variantId: string; variantTitle: string; frame: DesignerFrame } => Boolean(o.frame));

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 text-center">
          Scene {sceneIndex + 1} of 4 — Pick a panel
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2 text-center">
          Pick a {label} panel
        </h1>
        <p className="text-base text-gray-600 mb-8 text-center">
          Choose the one closest to your own experience for this scene.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map(({ variantId, variantTitle, frame }) => (
            <button
              key={variantId}
              type="button"
              onClick={() => onPick({ variantId, frame })}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition p-4 flex flex-col text-left"
            >
              <FrameThumb src={frame.image} alt={`${variantTitle} — ${label}`} />
              <h2 className="text-lg font-bold text-gray-900 mt-4">{variantTitle}</h2>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                {frame.caption}
              </p>
              <span className="mt-4 inline-flex items-center justify-center w-full py-2 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg">
                Choose this panel
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
