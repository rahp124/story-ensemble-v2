import { useState } from 'react';
import { useStore } from '../store';

export interface UserLandingPageProps {
  onComplete: () => void;
}

export function UserLandingPage({ onComplete }: UserLandingPageProps) {
  const designTopic = useStore((s) => s.designTopic);
  const priorExperience = useStore((s) => s.priorExperience);
  const setPriorExperience = useStore((s) => s.setPriorExperience);
  const setHasCompletedLanding = useStore((s) => s.setHasCompletedLanding);
  const setAdminSetupOpen = useStore((s) => s.setAdminSetupOpen);

  const [consent, setConsent] = useState(false);
  const [experienceSummary, setExperienceSummary] = useState('');

  const topicLabel = designTopic?.trim() || 'campus lunch decisions';
  const canBegin = priorExperience !== null && consent;

  const handleBegin = () => {
    if (!canBegin) return;
    setHasCompletedLanding(true);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="min-h-full flex items-center justify-center p-4 py-10 sm:py-14">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 p-6 sm:p-10 md:p-14">

          {/* Admin entry */}
          <button
            type="button"
            onClick={() => setAdminSetupOpen(true)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-xs font-semibold text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
          >
            Admin Setup
          </button>

          {/* Header */}
          <div className="text-center">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
              Welcome
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Tell us your story
            </h1>
            <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
              We&apos;ll walk you through a short series of illustrated scenes
              and ask you to reflect on your own experience.
            </p>
          </div>

          {/* What you'll do */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Feature
              icon="📖"
              title="See illustrated scenes"
              description="A short visual story unfolds, one frame at a time."
            />
            <Feature
              icon="💭"
              title="Reflect on your experience"
              description="Share what feels true — or what would, if it were you."
            />
            <Feature
              icon="🎨"
              title="Make it more accurate"
              description="Adjust the visuals so the scenes match your reality."
            />
          </div>

          {/* Topic pill */}
          <div className="mt-10 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 ring-1 ring-blue-100">
              <span className="text-[10px] uppercase font-semibold tracking-[0.15em] text-blue-700/70">
                Topic
              </span>
              <span className="text-sm font-semibold text-blue-900">{topicLabel}</span>
            </div>
          </div>

          {/* Prior experience */}
          <fieldset className="mt-10">
            <legend className="text-base font-semibold text-slate-900">
              Have you had a previous experience with {topicLabel}?
            </legend>
            <p className="mt-1 text-sm text-slate-500">
              Either is fine — your answer just helps frame what comes next.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Option
                selected={priorExperience === 'yes'}
                onSelect={() => setPriorExperience('yes')}
                name="prior-experience"
                value="yes"
                title="Yes, I've experienced this"
                description="I have firsthand context with this topic."
              />
              <Option
                selected={priorExperience === 'no'}
                onSelect={() => setPriorExperience('no')}
                name="prior-experience"
                value="no"
                title="No, but I can imagine it"
                description="I'll picture myself in this context."
              />
            </div>
          </fieldset>

          {/* Optional experience summary */}
          <div className="mt-8">
            <label
              htmlFor="experience-summary"
              className="block text-base font-semibold text-slate-900"
            >
              Briefly describe this experience{' '}
              <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <textarea
              id="experience-summary"
              value={experienceSummary}
              onChange={(e) => setExperienceSummary(e.target.value)}
              rows={3}
              placeholder="What comes to mind when you think about this?"
              aria-describedby="experience-summary-help"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
            />
            <p
              id="experience-summary-help"
              className="mt-2 text-xs text-slate-500"
            >
              A sentence or two is enough.
            </p>
          </div>

          {/* Consent */}
          <label className="mt-8 flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
            />
            <span className="text-sm text-slate-700 leading-relaxed">
              I understand this is a research study and I agree to participate.
            </span>
          </label>

          {/* Begin */}
          <button
            type="button"
            onClick={handleBegin}
            disabled={!canBegin}
            className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            Begin study <span aria-hidden>→</span>
          </button>
          {!canBegin && (
            <p className="mt-3 text-center text-xs text-slate-500">
              Pick an answer and confirm consent to continue.
            </p>
          )}

        </div>
      </div>
    </div>
  );
}

type FeatureProps = { icon: string; title: string; description: string };

function Feature({ icon, title, description }: FeatureProps) {
  return (
    <div className="rounded-2xl bg-slate-50/70 ring-1 ring-slate-100 p-4">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 text-xl"
        aria-hidden
      >
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

type OptionProps = {
  selected: boolean;
  onSelect: () => void;
  name: string;
  value: string;
  title: string;
  description: string;
};

function Option({
  selected,
  onSelect,
  name,
  value,
  title,
  description
}: OptionProps) {
  return (
    <label
      className={`relative flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-blue-200 ${
        selected
          ? 'border-blue-600 bg-blue-50'
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors ${
            selected ? 'border-blue-600' : 'border-slate-300'
          }`}
          aria-hidden
        >
          {selected && <span className="h-2 w-2 rounded-full bg-blue-600" />}
        </span>
        {title}
      </span>
      <span className="pl-6 text-xs text-slate-600 leading-relaxed">
        {description}
      </span>
    </label>
  );
}
