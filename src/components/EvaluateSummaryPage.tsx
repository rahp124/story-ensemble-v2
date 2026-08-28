import { useMemo, useState } from 'react';
import { Modal } from '@mantine/core';
import {
  EVALUATE_COPY,
  EVALUATE_QUESTIONS
} from '@/content/evaluateCopy';
import type { EvaluateItem, EvaluatePair, EvaluateSource } from '@/lib/evaluateData';
import { getEvaluateConditionStyles } from '@/lib/evaluateConditionStyles';
import {
  getFieldHighlights,
  type HighlightsByPair
} from '@/lib/evaluateHighlights';
import {
  canSubmitQuestions,
  QuestionField
} from '@/components/QuestionField';
import { HighlightableText } from '@/components/HighlightableText';

type EvaluateSummaryPageProps = {
  pairs: EvaluatePair[];
  pairAnswers: Record<string, Record<string, string>>;
  highlights: HighlightsByPair;
  summaryAnswers: Record<string, string>;
  onSummaryAnswersChange: (answers: Record<string, string>) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

function getColumnItems(pair: EvaluatePair): {
  leftItem: EvaluateItem;
  rightItem: EvaluateItem;
  leftLabel: string;
  rightLabel: string;
  leftSource: EvaluateSource;
  rightSource: EvaluateSource;
} {
  const copy = EVALUATE_COPY.summary;
  const leftItem =
    pair.leftSource === 'user' ? pair.userItem : pair.designerItem;
  const rightItem =
    pair.leftSource === 'user' ? pair.designerItem : pair.userItem;
  const leftLabel =
    pair.leftSource === 'user'
      ? copy.userColumnTitle
      : copy.designerColumnTitle;
  const rightLabel =
    pair.leftSource === 'user'
      ? copy.designerColumnTitle
      : copy.userColumnTitle;
  const leftSource = pair.leftSource;
  const rightSource: EvaluateSource =
    pair.leftSource === 'user' ? 'designer' : 'user';

  return {
    leftItem,
    rightItem,
    leftLabel,
    rightLabel,
    leftSource,
    rightSource
  };
}

function PairSummaryRow({
  pair,
  answers,
  notesLabel,
  onExpand
}: {
  pair: EvaluatePair;
  answers: Record<string, string>;
  notesLabel: string;
  onExpand: () => void;
}) {
  const {
    leftItem,
    rightItem,
    leftLabel,
    rightLabel,
    leftSource,
    rightSource
  } = getColumnItems(pair);
  const leftStyles = getEvaluateConditionStyles(leftSource);
  const rightStyles = getEvaluateConditionStyles(rightSource);
  const previewQuestionId = EVALUATE_QUESTIONS.summaryPreviewQuestionId;
  const previewText = answers[previewQuestionId]?.trim() ?? '';

  return (
    <button
      type="button"
      onClick={onExpand}
      className="w-full text-left overflow-hidden rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all flex flex-col"
    >
      <div className="flex shrink-0 border-b border-slate-100">
        <div
          className={`w-[37%] shrink-0 px-2 py-1.5 text-center text-[10px] font-semibold border-r border-slate-100 ${leftStyles.badge}`}
        >
          {leftLabel}
        </div>
        <div
          className={`w-[37%] shrink-0 px-2 py-1.5 text-center text-[10px] font-semibold border-r border-slate-100 ${rightStyles.badge}`}
        >
          {rightLabel}
        </div>
        <div className="w-[26%] min-w-0 px-2 py-1.5 text-center text-[10px] font-semibold text-slate-600 bg-slate-50/80">
          {notesLabel}
        </div>
      </div>
      <div className="flex min-h-0">
        <div
          className={`w-[37%] shrink-0 overflow-hidden border-r border-slate-100 border-2 ${leftStyles.border}`}
        >
          {leftItem.imageSrc ? (
            <img
              src={leftItem.imageSrc}
              alt="Left storyboard preview"
              className="w-full h-auto block"
            />
          ) : (
            <div className="aspect-video bg-slate-100 flex items-center justify-center text-sm text-slate-400">
              No image
            </div>
          )}
        </div>
        <div
          className={`w-[37%] shrink-0 overflow-hidden border-r border-slate-100 border-2 ${rightStyles.border}`}
        >
          {rightItem.imageSrc ? (
            <img
              src={rightItem.imageSrc}
              alt="Right storyboard preview"
              className="w-full h-auto block"
            />
          ) : (
            <div className="aspect-video bg-slate-100 flex items-center justify-center text-sm text-slate-400">
              No image
            </div>
          )}
        </div>
        <div className="w-[26%] min-w-0 flex flex-col px-2 py-2">
          {previewText ? (
            <p className="text-xs text-slate-600 line-clamp-6 leading-relaxed">
              {previewText}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function ExpandedPairModal({
  pair,
  answers,
  pairHighlights,
  opened,
  onClose
}: {
  pair: EvaluatePair | null;
  answers: Record<string, string>;
  pairHighlights: HighlightsByPair[string] | undefined;
  opened: boolean;
  onClose: () => void;
}) {
  if (!pair) return null;

  const {
    leftItem,
    rightItem,
    leftLabel,
    rightLabel,
    leftSource,
    rightSource
  } = getColumnItems(pair);

  const columns = [
    { item: leftItem, label: leftLabel, source: leftSource },
    { item: rightItem, label: rightLabel, source: rightSource }
  ] as const;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="95%"
      centered
      withCloseButton
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {columns.map(({ item, label, source }) => {
          const styles = getEvaluateConditionStyles(source);
          return (
            <div key={item.id} className="space-y-3">
              <div className="flex justify-center">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${styles.badge}`}
                >
                  {label}
                </span>
              </div>
              <div
                className={`rounded-lg border-2 overflow-hidden ${styles.border}`}
              >
                {item.imageSrc && (
                  <img
                    src={item.imageSrc}
                    alt=""
                    className="w-full h-auto block"
                  />
                )}
                <div className={`px-4 py-3 space-y-3 ${styles.panelBg}`}>
                  {item.fields.map((field) => (
                    <div key={field.key}>
                      <p className="text-sm font-semibold text-slate-900">
                        {field.label}
                      </p>
                      <HighlightableText
                        text={field.value}
                        ranges={getFieldHighlights(
                          pairHighlights,
                          source,
                          field.key
                        )}
                        readOnly
                        className="mt-1 text-sm text-slate-600 whitespace-pre-wrap"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(answers).length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-sm font-semibold text-slate-900 mb-2">
            Your evaluation
          </p>
          {EVALUATE_QUESTIONS.perItem.map((q) => (
            <div key={q.id} className="mb-3">
              <p className="text-xs font-medium text-slate-500">{q.prompt}</p>
              <p className="text-sm text-slate-700">{answers[q.id] || '—'}</p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export function EvaluateSummaryPage({
  pairs,
  pairAnswers,
  highlights,
  summaryAnswers,
  onSummaryAnswersChange,
  onSubmit,
  isSubmitting = false
}: EvaluateSummaryPageProps) {
  const copy = EVALUATE_COPY.summary;
  const questions = EVALUATE_QUESTIONS.summary;

  const [expandedAccessId, setExpandedAccessId] = useState<string | null>(null);

  const expandedPair = expandedAccessId
    ? pairs.find((p) => p.accessId === expandedAccessId) ?? null
    : null;

  const canDownload = useMemo(
    () => canSubmitQuestions(questions, summaryAnswers),
    [questions, summaryAnswers]
  );

  const handleSummaryChange = (id: string, value: string) => {
    onSummaryAnswersChange({ ...summaryAnswers, [id]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="flex-1 min-h-0 flex flex-col px-3 sm:px-5 lg:px-6 py-3 sm:py-4">
        <div className="relative flex-1 min-h-0 w-full max-w-none flex flex-col bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 overflow-hidden">
          <div className="shrink-0 border-b border-slate-100 bg-white px-8 sm:px-16 lg:px-28 xl:px-36 pt-3 pb-3">
            <div className="text-center mb-3">
              <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
                {copy.eyebrow}
              </span>
              <h1 className="mt-1 text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {copy.title}
              </h1>
              <p className="mt-1 text-xs max-w-2xl mx-auto text-slate-600 leading-snug">
                {copy.subtitle}
              </p>
            </div>

            <div className="mx-auto max-w-3xl space-y-3">
              {questions.map((question) => (
                <QuestionField
                  key={question.id}
                  question={question}
                  value={summaryAnswers[question.id] ?? ''}
                  onChange={(value) => handleSummaryChange(question.id, value)}
                  idPrefix="evaluate-summary"
                  compact
                />
              ))}

              <button
                type="button"
                onClick={onSubmit}
                disabled={!canDownload || isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? 'Submitting…' : copy.downloadButton}
              </button>
              {!canDownload && (
                <p className="text-center text-[11px] text-slate-500">
                  {copy.submitDisabledHint}
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-3 space-y-2">
            <div className="sticky top-0 z-10 shrink-0 bg-white border-b border-slate-100 py-2 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-xs text-slate-400">
                {copy.expandRowHint}
              </p>
            </div>
            {pairs.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-6">
                {copy.emptyPairsHint}
              </p>
            ) : (
              pairs.map((pair) => (
                <PairSummaryRow
                  key={pair.accessId}
                  pair={pair}
                  answers={pairAnswers[pair.accessId] ?? {}}
                  notesLabel={copy.previewNotesLabel}
                  onExpand={() => setExpandedAccessId(pair.accessId)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <ExpandedPairModal
        pair={expandedPair}
        answers={
          expandedPair ? pairAnswers[expandedPair.accessId] ?? {} : {}
        }
        pairHighlights={
          expandedPair ? highlights[expandedPair.accessId] : undefined
        }
        opened={expandedAccessId !== null}
        onClose={() => setExpandedAccessId(null)}
      />
    </div>
  );
}
