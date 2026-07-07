import { useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import type { FrameOutline } from '@/types';
import type { WizardPhaseTheme } from '@/lib/wizardPhaseTheme';
import { panelCardBorderStyle, panelCardStyle } from '@/lib/wizardPhaseTheme';
import { DESIGNER_REFLECTION_QUESTIONS } from '@/types/designerQuestionnaire';
import type { DesignerSceneAnswers } from './DesignerContentPhase';

interface ReflectionPhaseProps {
  sceneIndex: number;
  frameType: FrameOutline['frameType'];
  initialReflection?: DesignerSceneAnswers;
  isLastScene: boolean;
  phaseTheme?: WizardPhaseTheme;
  onReflectionFinalized: (answers: DesignerSceneAnswers) => void;
}

export function ReflectionPhase({
  sceneIndex,
  frameType,
  initialReflection,
  isLastScene,
  phaseTheme = 'content',
  onReflectionFinalized
}: ReflectionPhaseProps) {
  const [reflectionAnswers, setReflectionAnswers] = useState<DesignerSceneAnswers>(
    initialReflection ?? {}
  );

  useEffect(() => {
    setReflectionAnswers(initialReflection ?? {});
  }, [sceneIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const reflectionAnswered = DESIGNER_REFLECTION_QUESTIONS.every(
    (q) => (reflectionAnswers[q.id] ?? '').trim().length > 0
  );

  const handleReflectionContinue = () => {
    if (!reflectionAnswered) return;
    onReflectionFinalized(reflectionAnswers);
  };

  useHotkeys(
    'pageup',
    (e) => {
      e.preventDefault();
      onReflectionFinalized(reflectionAnswers);
    },
    {
      preventDefault: true,
      enableOnFormTags: true
    },
    [reflectionAnswers, onReflectionFinalized]
  );

  return (
    <div
      className="rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 lg:p-8 min-h-[500px] flex flex-col"
      style={{ ...panelCardStyle(phaseTheme), ...panelCardBorderStyle(phaseTheme) }}
    >
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          Scene {sceneIndex + 1} — {frameType === 'Action' ? 'Action / Solution' : frameType}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          A quick reflection on this scene. These answers do not change the image yet.
        </p>
      </div>

      <div className="flex-grow space-y-6">
        {DESIGNER_REFLECTION_QUESTIONS.map((q) => (
          <div key={q.id}>
            <label className="block text-sm font-semibold text-gray-800 mb-1">{q.text}</label>
            <textarea
              value={reflectionAnswers[q.id] ?? ''}
              onChange={(e) =>
                setReflectionAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none"
            />
          </div>
        ))}
      </div>

      <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-gray-100">
        <button
          type="button"
          onClick={handleReflectionContinue}
          disabled={!reflectionAnswered}
          className="w-full py-3 md:py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLastScene ? 'Finish reflections' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
