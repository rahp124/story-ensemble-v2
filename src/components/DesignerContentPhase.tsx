import { useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Loader } from '@mantine/core';
import type { FrameOutline } from '@/types';
import type { WizardPhaseTheme } from '@/lib/wizardPhaseTheme';
import { panelCardBorderStyle, panelCardStyle } from '@/lib/wizardPhaseTheme';
import {
  DESIGNER_REFLECTION_QUESTIONS,
  getDesignerContentOnlyQuestions,
  getDesignerGenerationQuestions,
  rewordForImaginedExperience,
  type DesignerContentQuestion
} from '@/types/designerQuestionnaire';

export type DesignerSceneAnswers = Record<string, string>;

type QuestionSet = 'generation' | 'content';

interface DesignerContentPhaseProps {
  sceneIndex: number;
  frameType: FrameOutline['frameType'];
  rewordAsImagined: boolean;
  questionSet?: QuestionSet;
  isFinalContentRound?: boolean;
  subtitle?: string;
  initialContent?: DesignerSceneAnswers;
  initialReflection?: DesignerSceneAnswers;
  isGenerating: boolean;
  isLastScene: boolean;
  phaseTheme?: WizardPhaseTheme;
  onContentFinalized: (answers: DesignerSceneAnswers) => Promise<void> | void;
  onReflectionFinalized?: (answers: DesignerSceneAnswers) => void;
}

function questionLabel(q: DesignerContentQuestion, reword: boolean): string {
  return reword ? rewordForImaginedExperience(q.text) : q.text;
}

function resolveQuestions(
  frameType: FrameOutline['frameType'],
  questionSet: QuestionSet
): DesignerContentQuestion[] {
  if (questionSet === 'generation') {
    return getDesignerGenerationQuestions(frameType);
  }
  return getDesignerContentOnlyQuestions(frameType);
}

export function DesignerContentPhase({
  sceneIndex,
  frameType,
  rewordAsImagined,
  questionSet = 'content',
  isFinalContentRound = true,
  subtitle,
  initialContent,
  initialReflection,
  isGenerating,
  isLastScene,
  phaseTheme = 'content',
  onContentFinalized,
  onReflectionFinalized
}: DesignerContentPhaseProps) {
  const contentQuestions = useMemo(
    () => resolveQuestions(frameType, questionSet),
    [frameType, questionSet]
  );

  const [step, setStep] = useState<'content' | 'reflection'>('content');
  const [contentAnswers, setContentAnswers] = useState<DesignerSceneAnswers>(initialContent ?? {});
  const [reflectionAnswers, setReflectionAnswers] = useState<DesignerSceneAnswers>(initialReflection ?? {});

  useEffect(() => {
    setStep('content');
    setContentAnswers(initialContent ?? {});
    setReflectionAnswers(initialReflection ?? {});
  }, [sceneIndex, questionSet]); // eslint-disable-line react-hooks/exhaustive-deps

  const allContentAnswered =
    contentQuestions.length > 0 &&
    contentQuestions.every((q) => (contentAnswers[q.id] ?? '').trim().length > 0);

  const reflectionAnswered = DESIGNER_REFLECTION_QUESTIONS.every(
    (q) => (reflectionAnswers[q.id] ?? '').trim().length > 0
  );

  const defaultContentSubtitle =
    questionSet === 'generation'
      ? 'Answer these questions to create a new panel image for this scene.'
      : 'Tell us about what you see in this scene. Your answers will update the panel image.';

  const handleContentContinue = async () => {
    if (!allContentAnswered || isGenerating) return;
    await onContentFinalized(contentAnswers);
    if (isFinalContentRound) {
      setStep('reflection');
    }
  };

  const handleReflectionContinue = () => {
    if (!reflectionAnswered || !onReflectionFinalized) return;
    onReflectionFinalized(reflectionAnswers);
  };

  const finalizeLabel =
    questionSet === 'generation'
      ? isGenerating
        ? 'Generating panel...'
        : 'Generate Panel'
      : isGenerating
        ? 'Updating scene...'
        : 'Update Scene';

  useHotkeys(
    'pageup',
    (e) => {
      e.preventDefault();
      if (isGenerating) return;
      if (step === 'content') {
        if (isFinalContentRound) {
          setStep('reflection');
        } else {
          void handleContentContinue();
        }
      } else {
        onReflectionFinalized?.(reflectionAnswers);
      }
    },
    {
      preventDefault: true,
      enableOnFormTags: true
    },
    [step, isGenerating, isFinalContentRound, reflectionAnswers, onReflectionFinalized]
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
          {step === 'content'
            ? (subtitle ?? defaultContentSubtitle)
            : 'A quick reflection on this scene. These answers do not change the image yet.'}
        </p>
      </div>

      {step === 'content' ? (
        <>
          <div className="flex-grow space-y-6">
            {contentQuestions.map((q) => (
              <div key={q.id}>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  {questionLabel(q, rewordAsImagined)}
                </label>
                <textarea
                  value={contentAnswers[q.id] ?? ''}
                  onChange={(e) =>
                    setContentAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  disabled={isGenerating}
                  placeholder="Type your answer here..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            ))}
          </div>

          {isGenerating && (
            <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader size="sm" color="blue" />
              <p className="text-sm font-medium text-blue-700">
                {questionSet === 'generation' ? 'Generating panel...' : 'Updating scene...'}
              </p>
            </div>
          )}

          <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-gray-100">
            <button
              type="button"
              onClick={() => void handleContentContinue()}
              disabled={!allContentAnswered || isGenerating}
              className="w-full py-3 md:py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {finalizeLabel}
            </button>
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
