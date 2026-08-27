import { useMemo } from 'react';
import {
  EVALUATE_COPY,
  EVALUATE_QUESTIONS,
  interpolate,
  type EvaluateQuestion
} from '@/content/evaluateCopy';
import type { EvaluateItem, EvaluatePair } from '@/lib/evaluateData';
import {
  canSubmitQuestions,
  QuestionField
} from '@/components/QuestionField';
import { EnlargeableStoryboardImage } from '@/components/EnlargeableStoryboardImage';

type EvaluatePairPageProps = {
  pair: EvaluatePair;
  pairIndex: number;
  totalPairs: number;
  answers: Record<string, string>;
  onAnswersChange: (answers: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
  onFinish: () => void;
  canGoBack: boolean;
  canFinish: boolean;
};

function interpolateQuestion(
  question: EvaluateQuestion,
  vars: Record<string, string>
): EvaluateQuestion {
  if (question.type === 'likert') {
    return {
      ...question,
      prompt: interpolate(question.prompt, vars),
      minLabel: interpolate(question.minLabel, vars),
      maxLabel: interpolate(question.maxLabel, vars)
    };
  }

  return {
    ...question,
    prompt: interpolate(question.prompt, vars)
  };
}

function ResponseColumn({
  label,
  item
}: {
  label: string;
  item: EvaluateItem;
}) {
  return (
    <div className="flex flex-col min-h-0 min-w-0">
      <span className="inline-flex self-start shrink-0 mb-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
        {label}
      </span>
      <div className="shrink-0 flex justify-center mb-2">
        {item.imageSrc ? (
          <EnlargeableStoryboardImage
            src={item.imageSrc}
            alt={`Storyboard for participant ${item.accessId}`}
            imgClassName="max-h-[34vh] w-auto mx-auto object-contain rounded-lg border border-slate-200"
          />
        ) : (
          <div className="h-32 w-full flex items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
            No image available
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 space-y-2">
        {item.fields.map((field) => (
          <div key={field.key}>
            <p className="text-[10px] font-semibold text-slate-800 leading-snug">
              {field.label}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
              {field.value || '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EvaluatePairPage({
  pair,
  pairIndex,
  totalPairs,
  answers,
  onAnswersChange,
  onNext,
  onBack,
  onFinish,
  canGoBack,
  canFinish
}: EvaluatePairPageProps) {
  const copy = EVALUATE_COPY.item;
  const summaryCopy = EVALUATE_COPY.summary;
  const questions = EVALUATE_QUESTIONS.perItem;
  const isLast = pairIndex >= totalPairs - 1;

  const interpolationVars = useMemo(
    () => ({
      leftCondition:
        pair.leftSource === 'user'
          ? summaryCopy.userColumnTitle
          : summaryCopy.designerColumnTitle,
      rightCondition:
        pair.leftSource === 'user'
          ? summaryCopy.designerColumnTitle
          : summaryCopy.userColumnTitle
    }),
    [pair.leftSource, summaryCopy.designerColumnTitle, summaryCopy.userColumnTitle]
  );

  const interpolatedQuestions = useMemo(
    () => questions.map((q) => interpolateQuestion(q, interpolationVars)),
    [questions, interpolationVars]
  );

  const leftItem =
    pair.leftSource === 'user' ? pair.userItem : pair.designerItem;
  const rightItem =
    pair.leftSource === 'user' ? pair.designerItem : pair.userItem;
  const leftLabel = interpolationVars.leftCondition;
  const rightLabel = interpolationVars.rightCondition;

  const canNext = useMemo(
    () => canSubmitQuestions(questions, answers),
    [answers, questions]
  );

  const handleChange = (id: string, value: string) => {
    onAnswersChange({ ...answers, [id]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur px-4 sm:px-6 py-3 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
              {copy.eyebrow}
            </span>
            <span className="text-xs text-slate-500">
              Pair {pairIndex + 1} of {totalPairs}
            </span>
          </div>

          <div className="space-y-2">
            {interpolatedQuestions.map((question) => (
              <QuestionField
                key={question.id}
                question={question}
                value={answers[question.id] ?? ''}
                onChange={(value) => handleChange(question.id, value)}
                idPrefix="evaluate-pair"
                compact
                oneIndexed
              />
            ))}
          </div>

          <div className="mt-3 flex justify-center gap-2">
            <button
              type="button"
              onClick={onBack}
              disabled={!canGoBack}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← {copy.backButton}
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!canNext || isLast}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              {copy.nextButton} <span aria-hidden>→</span>
            </button>
            <button
              type="button"
              onClick={onFinish}
              disabled={!canFinish}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {copy.finishButton}
            </button>
          </div>
          {!canNext && (
            <p className="mt-1.5 text-center text-[11px] text-slate-500">
              {copy.continueDisabledHint}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 sm:px-6 py-3">
        <div className="mx-auto max-w-7xl h-full grid grid-cols-2 gap-4 min-h-0">
          <ResponseColumn label={leftLabel} item={leftItem} />
          <ResponseColumn label={rightLabel} item={rightItem} />
        </div>
      </div>
    </div>
  );
}
