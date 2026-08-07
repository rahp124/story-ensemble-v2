import { ReactNode, useEffect, useMemo, useState } from 'react';
import { DESIGNER_FLOW_COPY } from '../content/designerFlowCopy';
import type { DesignerResponseQuestion } from '@/types/designerResponseQuestionnaire';
import type { FrameOutline } from '@/types';

type DesignerStoryboardResponsePageProps = {
  storyboardPreview: ReactNode;
  frameIndex: number;
  frameType: FrameOutline['frameType'];
  questions: DesignerResponseQuestion[];
  initialAnswers: Record<string, string>;
  isLastFrame: boolean;
  onContinue: (frameAnswers: Record<string, string>) => void;
};

function frameTypeLabel(frameType: FrameOutline['frameType']): string {
  return frameType === 'Action' ? 'Action / Solution' : frameType;
}

export function DesignerStoryboardResponsePage({
  storyboardPreview,
  frameIndex,
  frameType,
  questions,
  initialAnswers,
  isLastFrame,
  onContinue
}: DesignerStoryboardResponsePageProps) {
  const copy = DESIGNER_FLOW_COPY.response;
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, initialAnswers[q.id] ?? '']))
  );

  useEffect(() => {
    setAnswers(
      Object.fromEntries(questions.map((q) => [q.id, initialAnswers[q.id] ?? '']))
    );
  }, [frameIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const canContinue = useMemo(
    () =>
      questions.every((question) => {
        if (!question.required) return true;
        return answers[question.id]?.trim().length > 0;
      }),
    [answers, questions]
  );

  const handleContinue = () => {
    if (!canContinue) return;
    onContinue(answers);
  };

  const continueLabel = isLastFrame ? copy.continueButton : 'Continue to next frame';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="min-h-full flex items-center justify-center p-4 py-10 sm:py-14">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 p-6 sm:p-10 md:p-14">
          <div className="text-center">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
              {copy.eyebrow}
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {copy.title} — {frameTypeLabel(frameType)}
            </h1>
            <p className="mt-2 text-sm max-w-xl mx-auto text-slate-600">
              {copy.subtitle}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Frame {frameIndex + 1} of 4
            </p>
          </div>

          <div className="mt-8">{storyboardPreview}</div>

          <div className="mt-10 space-y-8">
            {questions.map((question) => (
              <div key={question.id}>
                <label
                  htmlFor={`designer-response-${question.id}`}
                  className="block text-base font-semibold text-slate-900 mb-3"
                >
                  {question.prompt}
                  {question.required && (
                    <span className="text-blue-600 ml-1" aria-hidden>
                      *
                    </span>
                  )}
                </label>
                <textarea
                  id={`designer-response-${question.id}`}
                  value={answers[question.id] ?? ''}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question.id]: e.target.value
                    }))
                  }
                  placeholder={question.placeholder}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y text-sm"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            {continueLabel} <span aria-hidden>→</span>
          </button>
          {!canContinue && (
            <p className="mt-3 text-center text-xs text-slate-500">
              {copy.continueDisabledHint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
