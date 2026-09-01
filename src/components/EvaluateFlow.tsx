import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader, Modal } from '@mantine/core';
import { useHotkeys } from 'react-hotkeys-hook';
import { useStore } from '@/store';
import { EVALUATE_COPY, EVALUATE_QUESTIONS } from '@/content/evaluateCopy';
import {
  buildEvaluatePairs,
  fetchEvaluateData,
  orderEvaluatePairs,
  type EvaluatePair,
  type EvaluateSource
} from '@/lib/evaluateData';
import {
  buildEvaluateExport,
  downloadEvaluateExport
} from '@/lib/evaluateExport';
import { uploadEvaluateResults } from '@/lib/studyDataUpload';
import {
  clearEvaluateProgress,
  loadEvaluateProgress,
  saveEvaluateProgress,
  type EvaluatePhase
} from '@/lib/evaluateProgress';
import {
  addRange,
  removeRangeContaining,
  type HighlightRange,
  type HighlightsByPair,
  type ItemHighlights,
  type PairHighlights
} from '@/lib/evaluateHighlights';
import { canSubmitQuestions, emptyAnswersForQuestions } from '@/components/QuestionField';
import { EvaluateIntroPage } from './EvaluateIntroPage';
import { EvaluatePairPage } from './EvaluatePairPage';
import { EvaluateSummaryPage } from './EvaluateSummaryPage';
import { EvaluateCompletionPage } from './EvaluateCompletionPage';

const perItemEmpty = () =>
  emptyAnswersForQuestions(EVALUATE_QUESTIONS.perItem);
const summaryEmpty = () =>
  emptyAnswersForQuestions(EVALUATE_QUESTIONS.summary);

export function EvaluateFlow() {
  const accessId = useStore((s) => s.accessId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allPairs, setAllPairs] = useState<EvaluatePair[]>([]);
  const [orderedPairs, setOrderedPairs] = useState<EvaluatePair[]>([]);
  const [pairOrder, setPairOrder] = useState<string[]>([]);

  const [phase, setPhase] = useState<EvaluatePhase>('intro');
  const [pairIndex, setPairIndex] = useState(0);
  const [pairAnswers, setPairAnswers] = useState<
    Record<string, Record<string, string>>
  >({});
  const [summaryAnswers, setSummaryAnswers] = useState<Record<string, string>>(
    () => summaryEmpty()
  );
  const [highlights, setHighlights] = useState<HighlightsByPair>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);

  useEffect(() => {
    if (!accessId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { user, designer } = await fetchEvaluateData();
        if (cancelled) return;

        const pairs = buildEvaluatePairs(user, designer, accessId);
        setAllPairs(pairs);

        const draft = loadEvaluateProgress(accessId);
        const ordered = orderEvaluatePairs(pairs, accessId);
        const order = ordered.map((p) => p.accessId);
        let restoredPhase: EvaluatePhase = 'intro';
        let restoredIndex = 0;
        let restoredPairAnswers: Record<string, Record<string, string>> = {};
        let restoredSummaryAnswers = summaryEmpty();
        let restoredHighlights: HighlightsByPair = {};

        if (draft) {
          restoredPhase =
            draft.phase === 'complete' ? 'intro' : draft.phase;
          restoredIndex = Math.min(
            Math.max(draft.pairIndex, 0),
            pairs.length - 1
          );
          restoredPairAnswers = draft.pairAnswers ?? {};
          restoredSummaryAnswers = {
            ...summaryEmpty(),
            ...draft.summaryAnswers
          };
          restoredHighlights = draft.highlights ?? {};
        }

        setPairOrder(order);
        setOrderedPairs(ordered);
        setPhase(restoredPhase);
        setPairIndex(restoredIndex);
        setPairAnswers(restoredPairAnswers);
        setSummaryAnswers(restoredSummaryAnswers);
        setHighlights(restoredHighlights);
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
      nextPairAnswers: Record<string, Record<string, string>>,
      nextSummaryAnswers: Record<string, string>,
      nextHighlights: HighlightsByPair
    ) => {
      if (!accessId || pairOrder.length === 0) return;
      saveEvaluateProgress(accessId, {
        phase: nextPhase,
        pairIndex: nextIndex,
        pairOrder,
        pairAnswers: nextPairAnswers,
        summaryAnswers: nextSummaryAnswers,
        highlights: nextHighlights
      });
    },
    [accessId, pairOrder]
  );

  const handleBegin = () => {
    setPhase('items');
    persist('items', 0, pairAnswers, summaryAnswers, highlights);
  };

  const currentPair = orderedPairs[pairIndex] ?? null;

  const currentAnswers = useMemo(() => {
    if (!currentPair) return perItemEmpty();
    return {
      ...perItemEmpty(),
      ...pairAnswers[currentPair.accessId]
    };
  }, [currentPair, pairAnswers]);

  const completedPairs = useMemo(
    () =>
      orderedPairs.filter((pair) =>
        canSubmitQuestions(
          EVALUATE_QUESTIONS.perItem,
          pairAnswers[pair.accessId] ?? {}
        )
      ),
    [orderedPairs, pairAnswers]
  );

  const canFinish = completedPairs.length > 0;

  const handlePairAnswersChange = (answers: Record<string, string>) => {
    if (!currentPair) return;
    const next = { ...pairAnswers, [currentPair.accessId]: answers };
    setPairAnswers(next);
    persist(phase, pairIndex, next, summaryAnswers, highlights);
  };

  const updatePairHighlights = useCallback(
    (
      pairAccessId: string,
      updater: (current: PairHighlights) => PairHighlights
    ) => {
      const current = highlights[pairAccessId] ?? {};
      const nextPairHighlights = updater(current);
      const nextHighlights = { ...highlights, [pairAccessId]: nextPairHighlights };
      setHighlights(nextHighlights);
      persist(phase, pairIndex, pairAnswers, summaryAnswers, nextHighlights);
      return nextHighlights;
    },
    [highlights, persist, phase, pairIndex, pairAnswers, summaryAnswers]
  );

  const handleAddHighlight = useCallback(
    (source: EvaluateSource, fieldKey: string, range: HighlightRange) => {
      if (!currentPair) return;
      updatePairHighlights(currentPair.accessId, (current) => {
        const item =
          source === 'user' ? currentPair.userItem : currentPair.designerItem;
        const field = item.fields.find((f) => f.key === fieldKey);
        const itemHighlights: ItemHighlights = {
          ...(current[source] ?? {})
        };
        const textLength = field?.value.length ?? 0;
        itemHighlights[fieldKey] = addRange(
          itemHighlights[fieldKey] ?? [],
          range,
          textLength
        );
        return { ...current, [source]: itemHighlights };
      });
    },
    [currentPair, updatePairHighlights]
  );

  const handleRemoveHighlight = useCallback(
    (source: EvaluateSource, fieldKey: string, offset: number) => {
      if (!currentPair) return;
      updatePairHighlights(currentPair.accessId, (current) => {
        const itemHighlights: ItemHighlights = {
          ...(current[source] ?? {})
        };
        itemHighlights[fieldKey] = removeRangeContaining(
          itemHighlights[fieldKey] ?? [],
          offset
        );
        return { ...current, [source]: itemHighlights };
      });
    },
    [currentPair, updatePairHighlights]
  );

  const handleNext = () => {
    if (!currentPair || pairIndex >= orderedPairs.length - 1) return;
    const nextIndex = pairIndex + 1;
    setPairIndex(nextIndex);
    persist('items', nextIndex, pairAnswers, summaryAnswers, highlights);
  };

  const handleBack = () => {
    if (pairIndex <= 0) return;
    const nextIndex = pairIndex - 1;
    setPairIndex(nextIndex);
    persist('items', nextIndex, pairAnswers, summaryAnswers, highlights);
  };

  const handleFinish = useCallback(() => {
    if (completedPairs.length === 0) return;
    setPhase('summary');
    persist('summary', pairIndex, pairAnswers, summaryAnswers, highlights);
  }, [
    completedPairs.length,
    pairIndex,
    pairAnswers,
    summaryAnswers,
    highlights,
    persist
  ]);

  const requestFinish = useCallback(() => {
    if (completedPairs.length === 0) return;
    setFinishConfirmOpen(true);
  }, [completedPairs.length]);

  const confirmFinish = () => {
    setFinishConfirmOpen(false);
    handleFinish();
  };

  useHotkeys(
    'pageup',
    (e) => {
      e.preventDefault();
      if (phase !== 'items' || completedPairs.length === 0) return;
      requestFinish();
    },
    { preventDefault: true, enableOnFormTags: true },
    [phase, completedPairs.length, requestFinish]
  );

  const handleSummaryAnswersChange = (answers: Record<string, string>) => {
    setSummaryAnswers(answers);
    persist('summary', pairIndex, pairAnswers, answers, highlights);
  };

  const handleSubmit = async () => {
    if (!accessId || isSubmitting) return;

    const exportData = buildEvaluateExport(
      accessId,
      allPairs,
      pairOrder,
      pairAnswers,
      summaryAnswers,
      highlights
    );

    setIsSubmitting(true);

    try {
      await uploadEvaluateResults(exportData);
    } catch (err) {
      console.error('[evaluation results upload]', err);
    }

    downloadEvaluateExport(exportData);
    clearEvaluateProgress(accessId);
    setIsSubmitting(false);
    setPhase('complete');
  };

  const handleStartOver = () => {
    if (!accessId) return;

    clearEvaluateProgress(accessId);

    const ordered = orderEvaluatePairs(allPairs, accessId);
    const order = ordered.map((p) => p.accessId);
    setPairOrder(order);
    setOrderedPairs(ordered);
    setPairIndex(0);
    setPairAnswers({});
    setSummaryAnswers(summaryEmpty());
    setHighlights({});
    setPhase('intro');
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

  if (phase === 'items' && currentPair) {
    const itemCopy = EVALUATE_COPY.item;

    return (
      <>
        <EvaluatePairPage
          pair={currentPair}
          pairIndex={pairIndex}
          totalPairs={orderedPairs.length}
          answers={currentAnswers}
          pairHighlights={highlights[currentPair.accessId] ?? {}}
          onAnswersChange={handlePairAnswersChange}
          onAddHighlight={handleAddHighlight}
          onRemoveHighlight={handleRemoveHighlight}
          onNext={handleNext}
          onBack={handleBack}
          onFinish={requestFinish}
          canGoBack={pairIndex > 0}
          canFinish={canFinish}
        />

        <Modal
          opened={finishConfirmOpen}
          onClose={() => setFinishConfirmOpen(false)}
          title={itemCopy.finishConfirmTitle}
          centered
        >
          <p className="text-sm text-slate-600 leading-relaxed">
            {itemCopy.finishConfirmMessage}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFinishConfirmOpen(false)}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              {itemCopy.finishCancelButton}
            </button>
            <button
              type="button"
              onClick={confirmFinish}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              {itemCopy.finishConfirmButton}
            </button>
          </div>
        </Modal>
      </>
    );
  }

  if (phase === 'summary') {
    return (
      <EvaluateSummaryPage
        pairs={completedPairs}
        pairAnswers={pairAnswers}
        highlights={highlights}
        summaryAnswers={summaryAnswers}
        onSummaryAnswersChange={handleSummaryAnswersChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (phase === 'complete') {
    return <EvaluateCompletionPage onStartOver={handleStartOver} />;
  }

  return null;
}
