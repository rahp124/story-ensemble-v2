import { useMemo, useState } from 'react';
import { Modal } from '@mantine/core';
import {
  EVALUATE_COPY,
  EVALUATE_QUESTIONS
} from '@/content/evaluateCopy';
import type { EvaluateItem } from '@/lib/evaluateData';
import {
  canSubmitQuestions,
  QuestionField
} from '@/components/QuestionField';

type SummaryRow = {
  accessId: string;
  userItem: EvaluateItem | null;
  designerItem: EvaluateItem | null;
  userAnswers: Record<string, string> | null;
  designerAnswers: Record<string, string> | null;
};

type EvaluateSummaryPageProps = {
  items: EvaluateItem[];
  itemAnswers: Record<string, Record<string, string>>;
  summaryAnswers: Record<string, string>;
  onSummaryAnswersChange: (answers: Record<string, string>) => void;
  onDownload: () => void;
};

function buildSummaryRows(
  items: EvaluateItem[],
  itemAnswers: Record<string, Record<string, string>>
): SummaryRow[] {
  const byAccess = new Map<string, SummaryRow>();

  for (const item of items) {
    let row = byAccess.get(item.accessId);
    if (!row) {
      row = {
        accessId: item.accessId,
        userItem: null,
        designerItem: null,
        userAnswers: null,
        designerAnswers: null
      };
      byAccess.set(item.accessId, row);
    }

    if (item.source === 'user') {
      row.userItem = item;
      row.userAnswers = itemAnswers[item.id] ?? null;
    } else {
      row.designerItem = item;
      row.designerAnswers = itemAnswers[item.id] ?? null;
    }
  }

  return [...byAccess.values()].sort((a, b) =>
    a.accessId.localeCompare(b.accessId)
  );
}

function SummaryRowCard({
  item,
  answers,
  notesLabel,
  onExpand
}: {
  item: EvaluateItem | null;
  answers: Record<string, string> | null;
  notesLabel: string;
  onExpand: () => void;
}) {
  if (!item) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400 flex">
        <div className="w-3/4 shrink-0 flex items-center justify-center border-r border-slate-100 pr-4">
          No data
        </div>
        <div className="w-1/4 min-w-0 pl-2">
          <p className="text-xs font-semibold text-slate-700">{notesLabel}</p>
        </div>
      </div>
    );
  }

  const previewQuestionId = EVALUATE_QUESTIONS.summaryPreviewQuestionId;
  const previewText = answers?.[previewQuestionId]?.trim() ?? '';

  return (
    <button
      type="button"
      onClick={onExpand}
      className="w-full text-left overflow-hidden rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all flex"
    >
      <div className="w-3/4 shrink-0 overflow-hidden">
        {item.imageSrc ? (
          <img
            src={item.imageSrc}
            alt="Storyboard preview"
            className="w-full h-auto block"
          />
        ) : (
          <div className="aspect-video bg-slate-100 flex items-center justify-center text-sm text-slate-400">
            No image
          </div>
        )}
      </div>
      <div className="w-1/4 min-w-0 flex flex-col border-l border-slate-100 px-2 py-2">
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

function ExpandedRowModal({
  row,
  side,
  opened,
  onClose
}: {
  row: SummaryRow | null;
  side: 'user' | 'designer';
  opened: boolean;
  onClose: () => void;
}) {
  if (!row) return null;

  const item = side === 'user' ? row.userItem : row.designerItem;
  const answers = side === 'user' ? row.userAnswers : row.designerAnswers;

  if (!item) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={side === 'user' ? 'User-led storyboard' : 'Designer-led storyboard'}
      size="lg"
      centered
    >
      <div className="space-y-4">
        {item.imageSrc && (
          <img
            src={item.imageSrc}
            alt=""
            className="w-full h-auto rounded-lg border border-slate-200"
          />
        )}
        {item.fields.map((field) => (
          <div key={field.key}>
            <p className="text-sm font-semibold text-slate-900">{field.label}</p>
            <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">
              {field.value || '—'}
            </p>
          </div>
        ))}
        {answers && Object.keys(answers).length > 0 && (
          <div className="pt-4 border-t border-slate-100">
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
      </div>
    </Modal>
  );
}

export function EvaluateSummaryPage({
  items,
  itemAnswers,
  summaryAnswers,
  onSummaryAnswersChange,
  onDownload
}: EvaluateSummaryPageProps) {
  const copy = EVALUATE_COPY.summary;
  const questions = EVALUATE_QUESTIONS.summary;
  const rows = useMemo(
    () => buildSummaryRows(items, itemAnswers),
    [items, itemAnswers]
  );

  const [expanded, setExpanded] = useState<{
    accessId: string;
    side: 'user' | 'designer';
  } | null>(null);

  const canDownload = useMemo(
    () => canSubmitQuestions(questions, summaryAnswers),
    [questions, summaryAnswers]
  );

  const expandedRow = expanded
    ? rows.find((r) => r.accessId === expanded.accessId) ?? null
    : null;

  const handleSummaryChange = (id: string, value: string) => {
    onSummaryAnswersChange({ ...summaryAnswers, [id]: value });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="min-h-full flex items-start justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="relative w-full max-w-none bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 p-4 sm:p-6 lg:p-8">
          <div className="text-center">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
              {copy.eyebrow}
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {copy.title}
            </h1>
            <p className="mt-2 text-sm max-w-2xl mx-auto text-slate-600">
              {copy.subtitle}
            </p>
            <p className="mt-1 text-xs text-slate-400">{copy.expandRowHint}</p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 sticky top-0 bg-white py-2">
                {copy.userColumnTitle}
              </h2>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {rows.map((row) => (
                  <SummaryRowCard
                    key={`user-${row.accessId}`}
                    item={row.userItem}
                    answers={row.userAnswers}
                    notesLabel={copy.previewNotesLabel}
                    onExpand={() =>
                      setExpanded({ accessId: row.accessId, side: 'user' })
                    }
                  />
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 sticky top-0 bg-white py-2">
                {copy.designerColumnTitle}
              </h2>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {rows.map((row) => (
                  <SummaryRowCard
                    key={`designer-${row.accessId}`}
                    item={row.designerItem}
                    answers={row.designerAnswers}
                    notesLabel={copy.previewNotesLabel}
                    onExpand={() =>
                      setExpanded({ accessId: row.accessId, side: 'designer' })
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-8">
            {questions.map((question) => (
              <QuestionField
                key={question.id}
                question={question}
                value={summaryAnswers[question.id] ?? ''}
                onChange={(value) => handleSummaryChange(question.id, value)}
                idPrefix="evaluate-summary"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onDownload}
            disabled={!canDownload}
            className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            {copy.downloadButton}
          </button>
          {!canDownload && (
            <p className="mt-3 text-center text-xs text-slate-500">
              {copy.submitDisabledHint}
            </p>
          )}
        </div>
      </div>

      <ExpandedRowModal
        row={expandedRow}
        side={expanded?.side ?? 'user'}
        opened={expanded !== null}
        onClose={() => setExpanded(null)}
      />
    </div>
  );
}
