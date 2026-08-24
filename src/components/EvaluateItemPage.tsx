import { useMemo } from 'react';
import {
  EVALUATE_COPY,
  EVALUATE_QUESTIONS,
  interpolate
} from '@/content/evaluateCopy';
import type { EvaluateItem } from '@/lib/evaluateData';
import {
  canSubmitQuestions,
  QuestionField
} from '@/components/QuestionField';

type EvaluateItemPageProps = {
  item: EvaluateItem;
  itemIndex: number;
  totalItems: number;
  answers: Record<string, string>;
  onAnswersChange: (answers: Record<string, string>) => void;
  onContinue: () => void;
  onBack: () => void;
  canGoBack: boolean;
};

export function EvaluateItemPage({
  item,
  itemIndex,
  totalItems,
  answers,
  onAnswersChange,
  onContinue,
  onBack,
  canGoBack
}: EvaluateItemPageProps) {
  const copy = EVALUATE_COPY.item;
  const questions = EVALUATE_QUESTIONS.perItem;

  const canContinue = useMemo(
    () => canSubmitQuestions(questions, answers),
    [answers, questions]
  );

  const progressPercent = ((itemIndex + 1) / totalItems) * 100;

  const handleChange = (id: string, value: string) => {
    onAnswersChange({ ...answers, [id]: value });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="min-h-full flex items-center justify-center p-4 py-10 sm:py-14">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 p-6 sm:p-10 md:p-14">
          <div className="text-center">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
              {copy.eyebrow}
            </span>
            <p className="mt-3 text-sm text-slate-500">
              {interpolate(copy.progressLabel, {
                current: itemIndex + 1,
                total: totalItems
              })}
            </p>
          </div>

          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={itemIndex + 1}
                aria-valuemin={1}
                aria-valuemax={totalItems}
              />
            </div>
          </div>

          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {item.imageSrc ? (
                <img
                  src={item.imageSrc}
                  alt={`Storyboard for participant ${item.accessId}`}
                  className="w-full h-auto"
                />
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No image available
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {item.fields.map((field) => (
              <div key={field.key}>
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  {field.label}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {field.value || '—'}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 space-y-8">
            {questions.map((question) => (
              <QuestionField
                key={question.id}
                question={question}
                value={answers[question.id] ?? ''}
                onChange={(value) => handleChange(question.id, value)}
                idPrefix="evaluate-item"
              />
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={!canGoBack}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-base hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← {copy.backButton}
            </button>
            <button
              type="button"
              onClick={onContinue}
              disabled={!canContinue}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              {copy.continueButton} <span aria-hidden>→</span>
            </button>
          </div>
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
