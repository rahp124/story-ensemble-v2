import { useState } from 'react';
import { useStore } from '../store';
import { USER_LANDING_COPY } from '../content/onboardingCopy';

export interface UserLandingPageProps {
  onComplete: () => void;
}

export function UserLandingPage({ onComplete }: UserLandingPageProps) {
  const setHasCompletedLanding = useStore((s) => s.setHasCompletedLanding);
  const setAdminSetupOpen = useStore((s) => s.setAdminSetupOpen);

  const [consent, setConsent] = useState(false);

  const copy = USER_LANDING_COPY;
  const canBegin = consent;

  const handleBegin = () => {
    if (!canBegin) return;
    setHasCompletedLanding(true);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="min-h-full flex items-center justify-center p-4 py-10 sm:py-14">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 p-6 sm:p-10 md:p-14">

          <button
            type="button"
            onClick={() => setAdminSetupOpen(true)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-xs font-semibold text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
          >
            {copy.adminSetup}
          </button>

          <div className="text-center">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
              {copy.header.eyebrow}
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {copy.header.title}
            </h1>
            <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
              {copy.header.subtitle}
            </p>
          </div>

          <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
            {copy.informedContext.heading && (
              <h2 className="text-base font-semibold text-slate-900">
                {copy.informedContext.heading}
              </h2>
            )}
            <div className={copy.informedContext.heading ? 'mt-3 space-y-3' : 'space-y-3'}>
              {copy.informedContext.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm text-slate-600 leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <label className="mt-8 flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
            />
            <span className="text-sm text-slate-700 leading-relaxed">
              {copy.consent}
            </span>
          </label>

          <button
            type="button"
            onClick={handleBegin}
            disabled={!canBegin}
            className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            {copy.beginButton} <span aria-hidden>→</span>
          </button>
          {!canBegin && (
            <p className="mt-3 text-center text-xs text-slate-500">
              {copy.beginDisabledHint}
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
