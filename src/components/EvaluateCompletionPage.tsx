import { EVALUATE_COPY } from '@/content/evaluateCopy';

type EvaluateCompletionPageProps = {
  onStartOver: () => void;
};

export function EvaluateCompletionPage({ onStartOver }: EvaluateCompletionPageProps) {
  const copy = EVALUATE_COPY.completion;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="min-h-full flex items-center justify-center p-4 py-10 sm:py-14">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 p-6 sm:p-10 md:p-14">
          <div className="text-center">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
              {copy.eyebrow}
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {copy.completionTitle}
            </h1>
          </div>

          <p className="mt-6 text-center text-slate-600 leading-relaxed">
            {copy.completionMessage}
          </p>

          <button
            type="button"
            onClick={onStartOver}
            className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 transition-all"
          >
            {copy.startOverButton}
          </button>
        </div>
      </div>
    </div>
  );
}
