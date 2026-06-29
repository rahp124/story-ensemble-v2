import { Loader } from '@mantine/core';
import type { SceneSketchRefinement } from './AestheticsPhase';
import type { WizardPhaseTheme } from '@/lib/wizardPhaseTheme';
import { panelCardBorderStyle, panelCardStyle } from '@/lib/wizardPhaseTheme';

interface Props {
  refinement: SceneSketchRefinement;
  phaseTheme?: WizardPhaseTheme;
  onChange: (field: keyof SceneSketchRefinement, value: string) => void;
  onPreview: (data: SceneSketchRefinement) => void;
  onContinue: (data: SceneSketchRefinement) => void;
  isGenerating: boolean;
  isLastScene: boolean;
  content?: Record<string, string | undefined>;
  onContentChange?: (field: string, value: string) => void;
  contentLocked?: boolean;
}

export default function SketchRefinementForm({
  refinement,
  phaseTheme = 'aesthetics',
  onChange,
  onPreview,
  onContinue,
  isGenerating,
  isLastScene,
  content,
  onContentChange,
  contentLocked = false,
}: Props) {
  return (
    <div
      className="rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 lg:p-8 min-h-[500px] flex flex-col"
      style={{ ...panelCardStyle(phaseTheme), ...panelCardBorderStyle(phaseTheme) }}
    >
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          Story Reflection
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Review and reflect on this moment. Focus on story meaning and your reaction rather than visual details.
        </p>
      </div>

      <div className="flex-grow space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Briefly describe what this moment felt like for you.</label>
          <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none" value={content?.mindset ?? ''} onChange={(e)=>onContentChange?.('mindset', e.target.value)} disabled={isGenerating} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">What was the main thing on your mind at this moment? Write a sentence describing your specific thought or feeling at this moment.</label>
          <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none" value={content?.frustration ?? ''} onChange={(e)=>onContentChange?.('frustration', e.target.value)} disabled={isGenerating} />
        </div>
      </div>

      <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-gray-100" />

      <div className="flex-grow space-y-5 mt-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Who is involved? <span className="font-normal text-gray-400">(optional)</span></label>
          <p className="text-xs text-gray-500 mb-2">Characters, roles, or people present in this frame.</p>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none"
            placeholder="e.g. Student, cashier, friend waiting in background..."
            value={refinement.actors ?? ''}
            onChange={(e) => onChange('actors', e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Where is this happening? <span className="font-normal text-gray-400">(optional)</span></label>
          <p className="text-xs text-gray-500 mb-2">Location, environment, or setting for this scene.</p>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none"
            placeholder="e.g. Campus cafeteria, outside the dining hall, at home looking at menu online..."
            value={refinement.setting ?? ''}
            onChange={(e) => onChange('setting', e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">What is the user trying to do? <span className="font-normal text-gray-400">(optional)</span></label>
          <p className="text-xs text-gray-500 mb-2">The action, goal, or task in this frame.</p>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none"
            placeholder="e.g. Deciding which food to order, waiting in line, checking their phone for reviews..."
            value={refinement.userGoal ?? ''}
            onChange={(e) => onChange('userGoal', e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">What obstacle or friction? <span className="font-normal text-gray-400">(optional)</span></label>
          <p className="text-xs text-gray-500 mb-2">Problems, blockers, or challenges visible in this frame.</p>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none"
            placeholder="e.g. Line is too long, too many menu options, can't read the ingredients..."
            value={refinement.obstacle ?? ''}
            onChange={(e) => onChange('obstacle', e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">What should change in this frame? <span className="font-normal text-gray-400">(optional)</span></label>
          <p className="text-xs text-gray-500 mb-2">How the frame should evolve or what new element appears.</p>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none"
            placeholder="e.g. They look at their phone, they move to the front of the line, they order..."
            value={refinement.frameChange ?? ''}
            onChange={(e) => onChange('frameChange', e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">How should the main character feel or appear? <span className="font-normal text-gray-400">(optional)</span></label>
          <p className="text-xs text-gray-500 mb-2">Use a clear emotional or state override for the main actor in this frame.</p>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none"
            placeholder="e.g. tired, rushed, confused, frustrated, relieved, calm, overwhelmed"
            value={refinement.emotionState ?? ''}
            onChange={(e) => onChange('emotionState', e.target.value)}
            disabled={isGenerating}
          />
        </div>

        {refinement && refinement.carryForward !== undefined && (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">What should carry forward? <span className="font-normal text-gray-400">(optional)</span></label>
            <p className="text-xs text-gray-500 mb-2">Details, characters, or mood that should appear in the next frame.</p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none"
              placeholder="e.g. Same character, same setting, their frustrated mood, the phone they're holding..."
              value={refinement.carryForward ?? ''}
              onChange={(e) => onChange('carryForward', e.target.value)}
              disabled={isGenerating}
            />
          </div>
        )}
      </div>

      {isGenerating && (
        <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader size="sm" color="blue" />
          <p className="text-sm font-medium text-blue-700">Regenerating sketch...</p>
        </div>
      )}

      <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-gray-100 flex flex-col gap-3">
        {!contentLocked && (
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">Lock content by submitting the Generation panel first to enable sketch updates.</div>
        )}

        <button
          type="button"
          onClick={() => onPreview(refinement)}
          disabled={isGenerating || !contentLocked}
          className="w-full py-3 px-6 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl border border-gray-300 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Update Sketch
        </button>
        <button
          type="button"
          onClick={() => onContinue(refinement)}
          disabled={isGenerating || !contentLocked}
          className="w-full py-3 md:py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLastScene ? 'Finish & Confirm Story' : 'Next Scene'}
        </button>
      </div>
    </div>
  );
}
