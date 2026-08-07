import { useStore } from '../store';
import {
  STUDY_OVERVIEW_COPY,
  interpolate
} from '../content/onboardingCopy';
import { PriorExperienceOption } from './onboarding/PriorExperienceOption';
import { ENABLE_ADMIN_SETUP } from '@/lib/featureFlags';

export function StudyOverviewPage() {
  const designTopic = useStore((s) => s.designTopic);
  const priorExperience = useStore((s) => s.priorExperience);
  const setPriorExperience = useStore((s) => s.setPriorExperience);
  const setHasCompletedOverview = useStore((s) => s.setHasCompletedOverview);
  const setAdminSetupOpen = useStore((s) => s.setAdminSetupOpen);

  const copy = STUDY_OVERVIEW_COPY;
  const topicLabel =
    designTopic?.trim() || copy.topic.defaultTopic;
  const canContinue = priorExperience !== null;

  const handleContinue = () => {
    if (!canContinue) return;
    useStore.getState().addStudyEvent({
      initiator: 'user',
      type: 'STUDY_OVERVIEW_COMPLETE',
      count: 1,
      data: {
        priorExperience
      }
    });
    setHasCompletedOverview(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="min-h-full flex items-center justify-center p-4 py-10 sm:py-14">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 p-6 sm:p-10 md:p-14">

          {ENABLE_ADMIN_SETUP && (
            <button
              type="button"
              onClick={() => setAdminSetupOpen(true)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-xs font-semibold text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
            >
              {copy.adminSetup}
            </button>
          )}

          <div className="text-center">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
              {copy.header.eyebrow}
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {copy.header.title}
            </h1>
          </div>

          <div className="mt-10 space-y-3">
            {copy.intro.pre_paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="leading-relaxed"
              >
                {interpolate(paragraph, { topic: topicLabel })}
              </p>
            ))}
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
              {copy.intro.steps.map((step) => (
                <li key={step}><i>{step}</i></li>
              ))}
            </ol>            
          </div>

          <div className="mt-5">
            <img
              src={`${import.meta.env.BASE_URL}storyboards/example/example_storyboard_1.jpg`}
              alt="Example storyboard with context, problem, action, and resolution panels"
              className="w-full rounded-2xl ring-1 ring-slate-200/60"
            />
          </div>

          <div className="mt-10 space-y-3">
            {copy.intro.post_paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="leading-relaxed"
              >
                {interpolate(paragraph, { topic: topicLabel })}
              </p>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 ring-1 ring-blue-100">
              <span className="text-[10px] uppercase font-semibold tracking-[0.15em] text-blue-700/70">
                {copy.topic.label}
              </span>
              <span className="text-sm font-semibold text-blue-900">{topicLabel}</span>
            </div>
          </div>

          <fieldset className="mt-5">
            <legend className="text-base font-semibold text-slate-900">
              {interpolate(copy.priorExperience.legend, {
                topic: topicLabel,
                descriptor: copy.topic.descriptor,
              })}
            </legend>
            <p className="mt-1 text-sm text-slate-500">
              {copy.priorExperience.helper}
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {copy.priorExperience.options.map((option) => (
                <PriorExperienceOption
                  key={option.value}
                  selected={priorExperience === option.value}
                  onSelect={() => setPriorExperience(option.value)}
                  name="prior-experience"
                  value={option.value}
                  title={option.title}
                />
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            {copy.continueButton} <span aria-hidden>→</span>
          </button>
          {!canContinue && (
            <p className="mt-3 text-center text-xs text-slate-500">
              {copy.continueDisabledHint}
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
