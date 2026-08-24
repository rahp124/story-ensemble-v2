import type { EvaluateItem } from '@/lib/evaluateData';
import { downloadObjectAsJson } from '@/lib/utils';

export type EvaluateExport = {
  exportedAt: string;
  evaluatorAccessId: string;
  itemOrder: string[];
  items: Array<{
    id: string;
    source: 'user' | 'designer';
    accessId: string;
    metadata: Record<string, string>;
    fields: Array<{ key: string; label: string; value: string }>;
    answers: Record<string, string>;
  }>;
  summaryAnswers: Record<string, string>;
};

export function buildEvaluateExport(
  evaluatorAccessId: string,
  orderedItems: EvaluateItem[],
  itemOrder: string[],
  itemAnswers: Record<string, Record<string, string>>,
  summaryAnswers: Record<string, string>
): EvaluateExport {
  return {
    exportedAt: new Date().toISOString(),
    evaluatorAccessId,
    itemOrder,
    items: orderedItems.map((item) => ({
      id: item.id,
      source: item.source,
      accessId: item.accessId,
      metadata: item.metadata,
      fields: item.fields,
      answers: itemAnswers[item.id] ?? {}
    })),
    summaryAnswers
  };
}

export function downloadEvaluateExport(
  exportData: EvaluateExport
): void {
  const datePart = exportData.exportedAt.slice(0, 10);
  const basename = `evaluation_${exportData.evaluatorAccessId}_${datePart}`;
  downloadObjectAsJson(exportData, basename);
}
