import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader } from '@mantine/core';
import { useHotkeys } from 'react-hotkeys-hook';
import { useStore } from '@/store';
import { EVALUATE_QUESTIONS } from '@/content/evaluateCopy';
import {
  buildEvaluatePairs,
  fetchEvaluateData,
  seededShuffle,
  type EvaluatePair
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        let order: string[];
        let restoredPhase: EvaluatePhase = 'intro';
        let restoredIndex = 0;
        let restoredPairAnswers: Record<string, Record<string, string>> = {};
        let restoredSummaryAnswers = summaryEmpty();

        if (draft?.pairOrder?.length === pairs.length) {
          order = draft.pairOrder;
          restoredPhase =
            draft.phase === 'complete' ? 'intro' : draft.phase;
          restoredIndex = draft.pairIndex;
          restoredPairAnswers = draft.pairAnswers ?? {};
          restoredSummaryAnswers = {
            ...summaryEmpty(),
            ...draft.summaryAnswers
          };
        } else {
          const shuffled = seededShuffle(pairs, accessId);
          order = shuffled.map((p) => p.accessId);
        }

        const byAccess = new Map(pairs.map((p) => [p.accessId, p]));
        const ordered = order
          .map((id) => byAccess.get(id))
          .filter((p): p is EvaluatePair => p !== undefined);

        setPairOrder(order);
        setOrderedPairs(ordered);
        setPhase(restoredPhase);
        setPairIndex(restoredIndex);
        setPairAnswers(restoredPairAnswers);
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
      nextPairAnswers: Record<string, Record<string, string>>,
      nextSummaryAnswers: Record<string, string>
    ) => {
      if (!accessId || pairOrder.length === 0) return;
      saveEvaluateProgress(accessId, {
        phase: nextPhase,
        pairIndex: nextIndex,
        pairOrder,
        pairAnswers: nextPairAnswers,
        summaryAnswers: nextSummaryAnswers
      });
    },
    [accessId, pairOrder]
  );

  const handleBegin = () => {
    setPhase('items');
    persist('items', 0, pairAnswers, summaryAnswers);
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
    persist(phase, pairIndex, next, summaryAnswers);
  };

  const handleNext = () => {
    if (!currentPair || pairIndex >= orderedPairs.length - 1) return;
    const nextIndex = pairIndex + 1;
    setPairIndex(nextIndex);
    persist('items', nextIndex, pairAnswers, summaryAnswers);
  };

  const handleBack = () => {
    if (pairIndex <= 0) return;
    const nextIndex = pairIndex - 1;
    setPairIndex(nextIndex);
    persist('items', nextIndex, pairAnswers, summaryAnswers);
  };

  const handleFinish = useCallback(() => {
    if (completedPairs.length === 0) return;
    setPhase('summary');
    persist('summary', pairIndex, pairAnswers, summaryAnswers);
  }, [completedPairs.length, pairIndex, pairAnswers, summaryAnswers, persist]);

  useHotkeys(
    'pageup',
    (e) => {
      e.preventDefault();
      if (phase !== 'items' || completedPairs.length === 0) return;
      handleFinish();
    },
    { preventDefault: true, enableOnFormTags: true },
    [phase, completedPairs.length, handleFinish]
  );

  const handleSummaryAnswersChange = (answers: Record<string, string>) => {
    setSummaryAnswers(answers);
    persist('summary', pairIndex, pairAnswers, answers);
  };

  const handleSubmit = async () => {
    if (!accessId || isSubmitting) return;

    const exportData = buildEvaluateExport(
      accessId,
      allPairs,
      pairOrder,
      pairAnswers,
      summaryAnswers
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

    const shuffled = seededShuffle(allPairs, accessId);
    const order = shuffled.map((p) => p.accessId);
    setPairOrder(order);
    setOrderedPairs(shuffled);
    setPairIndex(0);
    setPairAnswers({});
    setSummaryAnswers(summaryEmpty());
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
    return (
      <EvaluatePairPage
        pair={currentPair}
        pairIndex={pairIndex}
        totalPairs={orderedPairs.length}
        answers={currentAnswers}
        onAnswersChange={handlePairAnswersChange}
        onNext={handleNext}
        onBack={handleBack}
        onFinish={handleFinish}
        canGoBack={pairIndex > 0}
        canFinish={canFinish}
      />
    );
  }

  if (phase === 'summary') {
    return (
      <EvaluateSummaryPage
        pairs={completedPairs}
        pairAnswers={pairAnswers}
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
