import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader } from '@mantine/core';
import { useStore } from '@/store';
import {
  EVALUATE_QUESTIONS
} from '@/content/evaluateCopy';
import {
  buildEvaluateItems,
  fetchEvaluateData,
  seededShuffle,
  type EvaluateItem
} from '@/lib/evaluateData';
import {
  buildEvaluateExport,
  downloadEvaluateExport
} from '@/lib/evaluateExport';
import {
  clearEvaluateProgress,
  loadEvaluateProgress,
  saveEvaluateProgress,
  type EvaluatePhase
} from '@/lib/evaluateProgress';
import {
  emptyAnswersForQuestions
} from '@/components/QuestionField';
import { EvaluateIntroPage } from './EvaluateIntroPage';
import { EvaluateItemPage } from './EvaluateItemPage';
import { EvaluateSummaryPage } from './EvaluateSummaryPage';

const perItemEmpty = () =>
  emptyAnswersForQuestions(EVALUATE_QUESTIONS.perItem);
const summaryEmpty = () =>
  emptyAnswersForQuestions(EVALUATE_QUESTIONS.summary);

export function EvaluateFlow() {
  const accessId = useStore((s) => s.accessId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<EvaluateItem[]>([]);
  const [orderedItems, setOrderedItems] = useState<EvaluateItem[]>([]);
  const [itemOrder, setItemOrder] = useState<string[]>([]);

  const [phase, setPhase] = useState<EvaluatePhase>('intro');
  const [itemIndex, setItemIndex] = useState(0);
  const [itemAnswers, setItemAnswers] = useState<
    Record<string, Record<string, string>>
  >({});
  const [summaryAnswers, setSummaryAnswers] = useState<Record<string, string>>(
    () => summaryEmpty()
  );

  useEffect(() => {
    if (!accessId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { user, designer } = await fetchEvaluateData();
        if (cancelled) return;

        const items = buildEvaluateItems(user, designer);
        setAllItems(items);

        const draft = loadEvaluateProgress(accessId);
        let order: string[];
        let restoredPhase: EvaluatePhase = 'intro';
        let restoredIndex = 0;
        let restoredItemAnswers: Record<string, Record<string, string>> = {};
        let restoredSummaryAnswers = summaryEmpty();

        if (draft?.itemOrder?.length === items.length) {
          order = draft.itemOrder;
          restoredPhase = draft.phase;
          restoredIndex = draft.itemIndex;
          restoredItemAnswers = draft.itemAnswers ?? {};
          restoredSummaryAnswers = {
            ...summaryEmpty(),
            ...draft.summaryAnswers
          };
        } else {
          const shuffled = seededShuffle(items, accessId);
          order = shuffled.map((i) => i.id);
        }

        const byId = new Map(items.map((i) => [i.id, i]));
        const ordered = order
          .map((id) => byId.get(id))
          .filter((i): i is EvaluateItem => i !== undefined);

        setItemOrder(order);
        setOrderedItems(ordered);
        setPhase(restoredPhase);
        setItemIndex(restoredIndex);
        setItemAnswers(restoredItemAnswers);
        setSummaryAnswers(restoredSummaryAnswers);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessId]);

  const persist = useCallback(
    (
      nextPhase: EvaluatePhase,
      nextIndex: number,
      nextItemAnswers: Record<string, Record<string, string>>,
      nextSummaryAnswers: Record<string, string>
    ) => {
      if (!accessId || itemOrder.length === 0) return;
      saveEvaluateProgress(accessId, {
        phase: nextPhase,
        itemIndex: nextIndex,
        itemOrder,
        itemAnswers: nextItemAnswers,
        summaryAnswers: nextSummaryAnswers
      });
    },
    [accessId, itemOrder]
  );

  const handleBegin = () => {
    setPhase('items');
    persist('items', 0, itemAnswers, summaryAnswers);
  };

  const currentItem = orderedItems[itemIndex] ?? null;

  const currentAnswers = useMemo(() => {
    if (!currentItem) return perItemEmpty();
    return {
      ...perItemEmpty(),
      ...itemAnswers[currentItem.id]
    };
  }, [currentItem, itemAnswers]);

  const handleItemAnswersChange = (answers: Record<string, string>) => {
    if (!currentItem) return;
    const next = { ...itemAnswers, [currentItem.id]: answers };
    setItemAnswers(next);
    persist(phase, itemIndex, next, summaryAnswers);
  };

  const handleContinue = () => {
    if (!currentItem) return;
    const isLast = itemIndex >= orderedItems.length - 1;
    if (isLast) {
      setPhase('summary');
      persist('summary', itemIndex, itemAnswers, summaryAnswers);
    } else {
      const nextIndex = itemIndex + 1;
      setItemIndex(nextIndex);
      persist('items', nextIndex, itemAnswers, summaryAnswers);
    }
  };

  const handleBack = () => {
    if (itemIndex <= 0) return;
    const nextIndex = itemIndex - 1;
    setItemIndex(nextIndex);
    persist('items', nextIndex, itemAnswers, summaryAnswers);
  };

  const handleSummaryAnswersChange = (answers: Record<string, string>) => {
    setSummaryAnswers(answers);
    persist('summary', itemIndex, itemAnswers, answers);
  };

  const handleDownload = () => {
    if (!accessId) return;
    const exportData = buildEvaluateExport(
      accessId,
      orderedItems,
      itemOrder,
      itemAnswers,
      summaryAnswers
    );
    downloadEvaluateExport(exportData);
    clearEvaluateProgress(accessId);
  };

  if (loading) {
    return (
      <div className="h-[100vh] w-[100vw] flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 text-slate-500 gap-3">
        <Loader size="sm" />
        Loading evaluation data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[100vh] w-[100vw] flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
        <div className="max-w-md text-center">
          <p className="text-red-600 font-semibold">Failed to load data</p>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (phase === 'intro') {
    return <EvaluateIntroPage onBegin={handleBegin} />;
  }

  if (phase === 'items' && currentItem) {
    return (
      <EvaluateItemPage
        item={currentItem}
        itemIndex={itemIndex}
        totalItems={orderedItems.length}
        answers={currentAnswers}
        onAnswersChange={handleItemAnswersChange}
        onContinue={handleContinue}
        onBack={handleBack}
        canGoBack={itemIndex > 0}
      />
    );
  }

  if (phase === 'summary') {
    return (
      <EvaluateSummaryPage
        items={allItems}
        itemAnswers={itemAnswers}
        summaryAnswers={summaryAnswers}
        onSummaryAnswersChange={handleSummaryAnswersChange}
        onDownload={handleDownload}
      />
    );
  }

  return null;
}
