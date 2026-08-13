import { ReactNode, useState } from 'react';
import { STUDY_OVERVIEW_COPY } from '../content/onboardingCopy';
import { DESIGNER_FLOW_COPY } from '../content/designerFlowCopy';

type DesignerScenarioDescriptionPageProps = {
  storyboardPreview: ReactNode;
  initialDescription: string;
  onContinue: (description: string) => void;
};

export function DesignerScenarioDescriptionPage({
  storyboardPreview,
  initialDescription,
  onContinue
}: DesignerScenarioDescriptionPageProps) {
  const overviewCopy = STUDY_OVERVIEW_COPY;
  const responseCopy = DESIGNER_FLOW_COPY.response;
  const [description, setDescription] = useState(initialDescription);
  const canContinue = description.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    onContinue(description.trim());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="min-h-full flex items-center justify-center p-4 py-10 sm:py-14">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 p-6 sm:p-10 md:p-14">
          <div className="text-center">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
              {responseCopy.eyebrow}
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {responseCopy.title}
            </h1>
          </div>

          <div className="mt-8">{storyboardPreview}</div>

          <div className="mt-10">
            <label
              htmlFor="designer-scenario-description"
              className="block text-base font-semibold text-slate-900 mb-3"
            >
              {overviewCopy.experienceDescription.label}
              <span className="text-blue-600 ml-1" aria-hidden>
                *
              </span>
            </label>
            <textarea
              id="designer-scenario-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={overviewCopy.experienceDescription.placeholder}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y text-sm"
            />
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            {overviewCopy.continueButton} <span aria-hidden>→</span>
          </button>
          {!canContinue && (
            <p className="mt-3 text-center text-xs text-slate-500">
              {overviewCopy.experienceDescription.requiredHint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
