import { useEffect, useMemo, useState } from 'react';
import { Loader } from '@mantine/core';
import type { FrameOutline } from '@/types';
import {
  DESIGNER_CONTENT_QUESTIONS,
  DESIGNER_REFLECTION_QUESTIONS,
  rewordForImaginedExperience,
  type DesignerContentQuestion
} from '@/types/designerQuestionnaire';

export type DesignerSceneAnswers = Record<string, string>;

interface DesignerContentPhaseProps {
  sceneIndex: number;
  frameType: FrameOutline['frameType'];
  rewordAsImagined: boolean;
  initialContent?: DesignerSceneAnswers;
  initialReflection?: DesignerSceneAnswers;
  isGenerating: boolean;
  isLastScene: boolean;
  onContentFinalized: (answers: DesignerSceneAnswers) => Promise<void> | void;
  onReflectionFinalized: (answers: DesignerSceneAnswers) => void;
}

function questionLabel(q: DesignerContentQuestion, reword: boolean): string {
  return reword ? rewordForImaginedExperience(q.text) : q.text;
}

export function DesignerContentPhase({
  sceneIndex,
  frameType,
  rewordAsImagined,
  initialContent,
  initialReflection,
  isGenerating,
  isLastScene,
  onContentFinalized,
  onReflectionFinalized
}: DesignerContentPhaseProps) {
  const contentQuestions = DESIGNER_CONTENT_QUESTIONS[frameType];

  const [step, setStep] = useState<'content' | 'reflection'>('content');
  const [contentAnswers, setContentAnswers] = useState<DesignerSceneAnswers>(initialContent ?? {});
  const [reflectionAnswers, setReflectionAnswers] = useState<DesignerSceneAnswers>(initialReflection ?? {});

  useEffect(() => {
    setStep('content');
    setContentAnswers(initialContent ?? {});
    setReflectionAnswers(initialReflection ?? {});
  }, [sceneIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const filledCount = useMemo(
    () => contentQuestions.filter((q) => (contentAnswers[q.id] ?? '').trim().length > 0).length,
    [contentQuestions, contentAnswers]
  );
  const allContentAnswered = filledCount === contentQuestions.length;

  const reflectionAnswered = DESIGNER_REFLECTION_QUESTIONS.every(
    (q) => (reflectionAnswers[q.id] ?? '').trim().length > 0
  );

  const handleContentContinue = async () => {
    if (!allContentAnswered || isGenerating) return;
    await onContentFinalized(contentAnswers);
    setStep('reflection');
  };

  const handleReflectionContinue = () => {
    if (!reflectionAnswered) return;
    onReflectionFinalized(reflectionAnswers);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 lg:p-8 min-h-[500px] flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          Scene {sceneIndex + 1} — {frameType === 'Action' ? 'Action / Solution' : frameType}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {step === 'content'
            ? 'Tell us about what you see in this scene. Your answers will update the panel image.'
            : 'A quick reflection on this scene. These answers do not change the image yet.'}
        </p>
      </div>

      {step === 'content' ? (
        <>
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-3">
            Progress: {filledCount} of {contentQuestions.length} answered
          </div>
          <div className="flex-grow space-y-6 overflow-y-auto pr-1">
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
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none"
                />
              </div>
            ))}
          </div>

          {isGenerating && (
            <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader size="sm" color="blue" />
              <p className="text-sm font-medium text-blue-700">Updating this panel...</p>
            </div>
          )}

          <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-gray-100">
            <button
              type="button"
              onClick={handleContentContinue}
              disabled={!allContentAnswered || isGenerating}
              className="w-full py-3 md:py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
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
