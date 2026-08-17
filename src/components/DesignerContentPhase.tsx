import { useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Loader } from '@mantine/core';
import type { FrameOutline } from '@/types';
import type { WizardPhaseTheme } from '@/lib/wizardPhaseTheme';
import { panelCardBorderStyle, panelCardStyle } from '@/lib/wizardPhaseTheme';
import {
  getDesignerContentOnlyQuestions,
  getDesignerPanelGenerateQuestions,
  isDesignerReflectionQuestionId,
  rewordForImaginedExperience,
  type DesignerContentQuestion
} from '@/types/designerQuestionnaire';
import { FRAME_LABEL } from './StoryboardPanelStrip';

export type DesignerSceneAnswers = Record<string, string>;

type QuestionSet = 'generation' | 'content';

interface DesignerContentPhaseProps {
  sceneIndex: number;
  frameType: FrameOutline['frameType'];
  rewordAsImagined: boolean;
  questionSet?: QuestionSet;
  subtitle?: string;
  initialContent?: DesignerSceneAnswers;
  isGenerating: boolean;
  phaseTheme?: WizardPhaseTheme;
  onContentFinalized: (answers: DesignerSceneAnswers) => Promise<void> | void;
  /** Debug: skip generation validation/image gen (PgUp). */
  onDebugSkipGenerate?: (answers: DesignerSceneAnswers) => void;
}

function questionLabel(q: DesignerContentQuestion, reword: boolean): string {
  if (isDesignerReflectionQuestionId(q.id)) {
    return q.text;
  }
  return reword ? rewordForImaginedExperience(q.text) : q.text;
}

function resolveQuestions(
  frameType: FrameOutline['frameType'],
  questionSet: QuestionSet
): DesignerContentQuestion[] {
  if (questionSet === 'generation') {
    return getDesignerPanelGenerateQuestions(frameType);
  }
  return getDesignerContentOnlyQuestions(frameType);
}

export const DEFAULT_CONTENT_SUBTITLES: Record<FrameOutline['frameType'], string> = {
  Context: 'Set the scene. These responses will be used to create the first storyboard panel.',
  Problem: 'What went wrong? These responses will be used to create the Problem storyboard panel.',
  Action: 'What you tried. These responses will be used to create the Action storyboard panel.',
  Resolution: 'What happened as a result. These responses will be used to create the final storyboard panel.',
};

export function DesignerContentPhase({
  sceneIndex,
  frameType,
  rewordAsImagined,
  questionSet = 'content',
  subtitle,
  initialContent,
  isGenerating,
  phaseTheme = 'content',
  onContentFinalized,
  onDebugSkipGenerate
}: DesignerContentPhaseProps) {
  const contentQuestions = useMemo(
    () => resolveQuestions(frameType, questionSet),
    [frameType, questionSet]
  );

  const [contentAnswers, setContentAnswers] = useState<DesignerSceneAnswers>(initialContent ?? {});

  useEffect(() => {
    setContentAnswers(initialContent ?? {});
  }, [sceneIndex, questionSet]); // eslint-disable-line react-hooks/exhaustive-deps

  const allContentAnswered =
    contentQuestions.length > 0 &&
    contentQuestions.every((q) => (contentAnswers[q.id] ?? '').trim().length > 0);

  const defaultContentSubtitle = DEFAULT_CONTENT_SUBTITLES[frameType];

  const handleContentContinue = async () => {
    if (!allContentAnswered || isGenerating) return;
    await onContentFinalized(contentAnswers);
  };

  const finalizeLabel =
    questionSet === 'generation' ? 'Generate Panel' : 'Update Scene';

  useHotkeys(
    'pageup',
    (e) => {
      e.preventDefault();
      if (isGenerating) return;
      if (questionSet === 'generation' && onDebugSkipGenerate) {
        const debugAnswers = Object.fromEntries(
          contentQuestions.map((q) => [
            q.id,
            (contentAnswers[q.id] ?? '').trim() || 'debug'
          ])
        );
        onDebugSkipGenerate(debugAnswers);
        return;
      }
      void handleContentContinue();
    },
    {
      preventDefault: true,
      enableOnFormTags: true
    },
    [
      isGenerating,
      allContentAnswered,
      contentAnswers,
      questionSet,
      onDebugSkipGenerate,
      contentQuestions
    ]
  );

  return (
    <div
      className="rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 lg:p-8 min-h-[500px] flex flex-col"
      style={{ ...panelCardStyle(phaseTheme), ...panelCardBorderStyle(phaseTheme) }}
    >
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          Scene {sceneIndex + 1} — {frameType === 'Action' ? 'Action / Solution' : FRAME_LABEL[frameType]}
        </h2>
        <p className="text-sm text-gray-700 mt-1">
          {subtitle ?? defaultContentSubtitle}
        </p>
      </div>

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

      <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-gray-100">
        <button
          type="button"
          onClick={() => void handleContentContinue()}
          disabled={!allContentAnswered || isGenerating}
          className="w-full py-3 md:py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {finalizeLabel}
        </button>
        {isGenerating && (
          <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader size="sm" color="blue" />
            <p className="text-sm font-medium text-blue-700">While the panel loads, visualize how the scene should look in your mind first!</p>
          </div>
        )}
      </div>
    </div>
  );
}
