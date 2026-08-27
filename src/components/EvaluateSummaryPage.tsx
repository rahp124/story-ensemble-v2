import { useMemo, useState } from 'react';
import { Modal } from '@mantine/core';
import {
  EVALUATE_COPY,
  EVALUATE_QUESTIONS
} from '@/content/evaluateCopy';
import type { EvaluateItem, EvaluatePair } from '@/lib/evaluateData';
import {
  canSubmitQuestions,
  QuestionField
} from '@/components/QuestionField';

type EvaluateSummaryPageProps = {
  pairs: EvaluatePair[];
  pairAnswers: Record<string, Record<string, string>>;
  summaryAnswers: Record<string, string>;
  onSummaryAnswersChange: (answers: Record<string, string>) => void;
  onDownload: () => void;
};

function getColumnItems(pair: EvaluatePair): {
  leftItem: EvaluateItem;
  rightItem: EvaluateItem;
  leftLabel: string;
  rightLabel: string;
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

  return { leftItem, rightItem, leftLabel, rightLabel };
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
  const { leftItem, rightItem } = getColumnItems(pair);
  const previewQuestionId = EVALUATE_QUESTIONS.summaryPreviewQuestionId;
  const previewText = answers[previewQuestionId]?.trim() ?? '';

  return (
    <button
      type="button"
      onClick={onExpand}
      className="w-full text-left overflow-hidden rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all flex"
    >
      <div className="w-[37%] shrink-0 overflow-hidden border-r border-slate-100">
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
      <div className="w-[37%] shrink-0 overflow-hidden border-r border-slate-100">
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
        <p className="text-xs font-semibold text-slate-700 shrink-0">
          {notesLabel}
        </p>
        {previewText ? (
          <p className="mt-1 text-xs text-slate-600 line-clamp-6 leading-relaxed">
            {previewText}
          </p>
        ) : null}
      </div>
    </button>
  );
}

function ExpandedPairModal({
  pair,
  answers,
  opened,
  onClose
}: {
  pair: EvaluatePair | null;
  answers: Record<string, string>;
  opened: boolean;
  onClose: () => void;
}) {
  if (!pair) return null;

  const { leftItem, rightItem, leftLabel, rightLabel } = getColumnItems(pair);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Pair details"
      size="95%"
      centered
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[leftItem, rightItem].map((item, index) => {
          const label = index === 0 ? leftLabel : rightLabel;
          return (
            <div key={item.id} className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              {item.imageSrc && (
                <img
                  src={item.imageSrc}
                  alt=""
                  className="w-full h-auto rounded-lg border border-slate-200"
                />
              )}
              {item.fields.map((field) => (
                <div key={field.key}>
                  <p className="text-sm font-semibold text-slate-900">
                    {field.label}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">
                    {field.value || '—'}
                  </p>
                </div>
              ))}
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
  summaryAnswers,
  onSummaryAnswersChange,
  onDownload
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
                onClick={onDownload}
                disabled={!canDownload}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all"
              >
                {copy.downloadButton}
              </button>
              {!canDownload && (
                <p className="text-center text-[11px] text-slate-500">
                  {copy.submitDisabledHint}
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2">
            <p className="text-center text-xs text-slate-400 shrink-0">
              {copy.expandRowHint}
            </p>
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
        opened={expandedAccessId !== null}
        onClose={() => setExpandedAccessId(null)}
      />
    </div>
  );
}
