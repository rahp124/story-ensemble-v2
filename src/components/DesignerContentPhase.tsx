import { useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Loader } from '@mantine/core';
import type { FrameOutline } from '@/types';
import {
  DESIGNER_REFLECTION_QUESTIONS,
  getDesignerAllContentQuestions,
  getDesignerContentOnlyQuestions,
  getDesignerGenerationQuestions,
  rewordForImaginedExperience,
  type DesignerContentQuestion
} from '@/types/designerQuestionnaire';

export type DesignerSceneAnswers = Record<string, string>;

type QuestionSet = 'all' | 'generation' | 'content';

interface DesignerContentPhaseProps {
  sceneIndex: number;
  frameType: FrameOutline['frameType'];
  rewordAsImagined: boolean;
  questionSet?: QuestionSet;
  skipReflection?: boolean;
  subtitle?: string;
  initialContent?: DesignerSceneAnswers;
  initialReflection?: DesignerSceneAnswers;
  isGenerating: boolean;
  isLastScene: boolean;
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
  if (questionSet === 'content') {
    return getDesignerContentOnlyQuestions(frameType);
  }
  return getDesignerAllContentQuestions(frameType);
}

export function DesignerContentPhase({
  sceneIndex,
  frameType,
  rewordAsImagined,
  questionSet = 'all',
  skipReflection = false,
  subtitle,
  initialContent,
  initialReflection,
  isGenerating,
  isLastScene,
  onContentFinalized,
  onReflectionFinalized
}: DesignerContentPhaseProps) {
  const contentQuestions = useMemo(
    () => resolveQuestions(frameType, questionSet),
    [frameType, questionSet]
  );

  const [step, setStep] = useState<'content' | 'reflection'>('content');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [contentAnswers, setContentAnswers] = useState<DesignerSceneAnswers>(initialContent ?? {});
  const [reflectionAnswers, setReflectionAnswers] = useState<DesignerSceneAnswers>(initialReflection ?? {});

  useEffect(() => {
    setStep('content');
    setActiveQuestionIndex(0);
    setContentAnswers(initialContent ?? {});
    setReflectionAnswers(initialReflection ?? {});
  }, [sceneIndex, questionSet]); // eslint-disable-line react-hooks/exhaustive-deps

  const filledCount = useMemo(
    () => contentQuestions.filter((q) => (contentAnswers[q.id] ?? '').trim().length > 0).length,
    [contentQuestions, contentAnswers]
  );
  const allContentAnswered =
    contentQuestions.length > 0 && filledCount === contentQuestions.length;

  const reflectionAnswered = DESIGNER_REFLECTION_QUESTIONS.every(
    (q) => (reflectionAnswers[q.id] ?? '').trim().length > 0
  );

  const activeQuestion = contentQuestions[activeQuestionIndex];
  const isLastQuestion = activeQuestionIndex === contentQuestions.length - 1;
  const currentAnswerFilled =
    (contentAnswers[activeQuestion?.id] ?? '').trim().length > 0;

  const defaultContentSubtitle =
    questionSet === 'generation'
      ? 'Answer these questions to create a new panel image for this scene.'
      : 'Tell us about what you see in this scene. Your answers will update the panel image.';

  const handleContentContinue = async () => {
    if (!allContentAnswered || isGenerating) return;
    await onContentFinalized(contentAnswers);
    if (!skipReflection) {
      setStep('reflection');
    }
  };

  const handleNextQuestion = () => {
    if (isGenerating || !currentAnswerFilled) return;
    if (isLastQuestion) {
      void handleContentContinue();
      return;
    }
    setActiveQuestionIndex((i) => Math.min(contentQuestions.length - 1, i + 1));
  };

  const handleBackQuestion = () => {
    if (isGenerating || activeQuestionIndex === 0) return;
    setActiveQuestionIndex((i) => Math.max(0, i - 1));
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
        if (!isLastQuestion) {
          setActiveQuestionIndex((i) =>
            Math.min(contentQuestions.length - 1, i + 1)
          );
        } else if (skipReflection) {
          void handleContentContinue();
        } else {
          setStep('reflection');
        }
      } else {
        onReflectionFinalized?.(reflectionAnswers);
      }
    },
    {
      preventDefault: true,
      enableOnFormTags: true
    },
    [
      step,
      isGenerating,
      isLastQuestion,
      skipReflection,
      contentQuestions.length,
      reflectionAnswers,
      onReflectionFinalized
    ]
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 lg:p-8 min-h-[500px] flex flex-col">
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
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-600 mb-2">
              Progress: {filledCount} of {contentQuestions.length} answered
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${contentQuestions.length ? (filledCount / contentQuestions.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="flex-grow flex flex-col">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
              Question {activeQuestionIndex + 1}
            </p>
            <label className="block text-lg md:text-xl font-semibold text-gray-900 leading-snug mb-4">
              {activeQuestion && questionLabel(activeQuestion, rewordAsImagined)}
            </label>
            <textarea
              key={activeQuestion?.id}
              value={contentAnswers[activeQuestion?.id] ?? ''}
              onChange={(e) =>
                setContentAnswers((prev) => ({ ...prev, [activeQuestion.id]: e.target.value }))
              }
              disabled={isGenerating}
              placeholder="Type your answer here..."
              autoFocus
              className="w-full flex-grow border border-gray-300 rounded-xl p-4 text-base min-h-[180px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {isGenerating && (
            <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader size="sm" color="blue" />
              <p className="text-sm font-medium text-blue-700">
                {questionSet === 'generation' ? 'Generating panel...' : 'Updating scene...'}
              </p>
            </div>
          )}

          <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-gray-100 flex items-center gap-3">
            {activeQuestionIndex > 0 && (
              <button
                type="button"
                onClick={handleBackQuestion}
                disabled={isGenerating}
                className="py-3 md:py-4 px-6 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={!currentAnswerFilled || isGenerating}
              className="flex-1 py-3 md:py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating
                ? finalizeLabel
                : isLastQuestion
                ? finalizeLabel
                : 'Next Question'}
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
