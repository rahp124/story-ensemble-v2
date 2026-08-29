import { EVALUATE_COPY } from '@/content/evaluateCopy';

const EVALUATE_FIGURES_BASE = `${import.meta.env.BASE_URL}evaluate/figures/`;

type EvaluateIntroPageProps = {
  onBegin: () => void;
};

export function EvaluateIntroPage({ onBegin }: EvaluateIntroPageProps) {
  const copy = EVALUATE_COPY.intro;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="min-h-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 p-4 sm:p-6 lg:p-8">
          <div className="text-center">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
              {copy.eyebrow}
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {copy.title}
            </h1>
          </div>

          <div className="mt-8 space-y-4 text-slate-600 leading-relaxed">
            {copy.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8 grid w-full grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
            {copy.figures.map((figure) => (
              <div
                key={figure.image}
                className="flex w-full items-center justify-center h-[clamp(180px,32vh,320px)] rounded-xl border border-slate-200 bg-white px-1 py-2"
              >
                <img
                  src={`${EVALUATE_FIGURES_BASE}${figure.image}`}
                  alt={figure.alt}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onBegin}
            className="mt-10 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 transition-all"
          >
            {copy.beginButton} <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
