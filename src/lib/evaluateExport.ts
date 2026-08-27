import { EVALUATE_QUESTIONS } from '@/content/evaluateCopy';
import type { EvaluatePair, EvaluateSource } from '@/lib/evaluateData';
import { canSubmitQuestions } from '@/components/QuestionField';
import { downloadObjectAsJson } from '@/lib/utils';

export type EvaluateExportPairItem = {
  id: string;
  metadata: Record<string, string>;
  fields: Array<{ key: string; label: string; value: string }>;
};

export type EvaluateExportPair = {
  accessId: string;
  leftCondition: string;
  rightCondition: string;
  leftSource: EvaluateSource;
  user: EvaluateExportPairItem;
  designer: EvaluateExportPairItem;
  answers: Record<string, string>;
  normalizedAnswers: Record<string, string>;
  completed: boolean;
};

export type EvaluateExport = {
  exportedAt: string;
  evaluatorAccessId: string;
  likertScale: {
    min: number;
    max: number;
    minMeaning: string;
    maxMeaning: string;
    note: string;
  };
  pairOrder: string[];
  pairs: EvaluateExportPair[];
  summaryAnswers: Record<string, string>;
};

const USER_LED = 'User-Led';
const DESIGNER_LED = 'Designer-Led';

function conditionLabel(source: EvaluateSource): string {
  return source === 'user' ? USER_LED : DESIGNER_LED;
}

/** Raw v in [1..points], where 1 favors the left column. */
export function normalizeLikert(
  raw: number,
  points: number,
  leftSource: EvaluateSource
): number {
  return leftSource === 'designer' ? raw : points + 1 - raw;
}

function normalizePairAnswers(
  answers: Record<string, string>,
  leftSource: EvaluateSource
): Record<string, string> {
  const normalized = { ...answers };

  for (const question of EVALUATE_QUESTIONS.perItem) {
    if (question.type !== 'likert') continue;
    const raw = answers[question.id];
    if (!raw?.trim()) continue;
    normalized[question.id] = String(
      normalizeLikert(Number(raw), question.points, leftSource)
    );
  }

  return normalized;
}

function toExportItem(
  id: string,
  item: EvaluatePair['userItem']
): EvaluateExportPairItem {
  return {
    id,
    metadata: item.metadata,
    fields: item.fields
  };
}

export function buildEvaluateExport(
  evaluatorAccessId: string,
  orderedPairs: EvaluatePair[],
  pairOrder: string[],
  pairAnswers: Record<string, Record<string, string>>,
  summaryAnswers: Record<string, string>
): EvaluateExport {
  const likertQuestion = EVALUATE_QUESTIONS.perItem.find(
    (q) => q.type === 'likert'
  );
  const likertMax = likertQuestion?.type === 'likert' ? likertQuestion.points : 6;

  const byAccess = new Map(orderedPairs.map((p) => [p.accessId, p]));

  return {
    exportedAt: new Date().toISOString(),
    evaluatorAccessId,
    likertScale: {
      min: 1,
      max: likertMax,
      minMeaning: `${DESIGNER_LED} much more valuable`,
      maxMeaning: `${USER_LED} much more valuable`,
      note:
        'answers = as displayed (1 favors left column); normalizedAnswers = condition-anchored'
    },
    pairOrder,
    pairs: pairOrder
      .map((accessId) => byAccess.get(accessId))
      .filter((pair): pair is EvaluatePair => pair !== undefined)
      .map((pair) => {
        const answers = pairAnswers[pair.accessId] ?? {};
        const leftCondition = conditionLabel(pair.leftSource);
        const rightCondition =
          pair.leftSource === 'user' ? DESIGNER_LED : USER_LED;

        return {
          accessId: pair.accessId,
          leftCondition,
          rightCondition,
          leftSource: pair.leftSource,
          user: toExportItem(pair.userItem.id, pair.userItem),
          designer: toExportItem(pair.designerItem.id, pair.designerItem),
          answers,
          normalizedAnswers: normalizePairAnswers(answers, pair.leftSource),
          completed: canSubmitQuestions(EVALUATE_QUESTIONS.perItem, answers)
        };
      }),
    summaryAnswers
  };
}

export function evaluateExportBasename(exportData: EvaluateExport): string {
  const datePart = exportData.exportedAt.slice(0, 10);
  return `${datePart}_${exportData.evaluatorAccessId}_evaluation`;
}

export function downloadEvaluateExport(exportData: EvaluateExport): void {
  downloadObjectAsJson(exportData, evaluateExportBasename(exportData));
}
