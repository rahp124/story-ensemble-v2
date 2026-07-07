import { useState } from 'react';
import { Loader } from '@mantine/core';
import { useStore } from '../store';
import type { CharacterProfileAdjustments } from '../store';
import { CHARACTER_CREATION_COPY } from '../content/onboardingCopy';
import { CHARACTER_HEADSHOTS } from '@/data/characterHeadshots';
import { generateCharacterProfileImage, toDataUrl } from '@/api/images';
import { CharacterRefinementPhase } from './CharacterRefinementPhase';

type Step = 'pick' | 'refine';

function cardClass(selected: boolean) {
  return `w-full text-left rounded-2xl border-2 p-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
    selected
      ? 'border-blue-600 ring-2 ring-blue-600 bg-blue-50/40 shadow-sm'
      : 'border-gray-200 bg-white hover:border-blue-300'
  }`;
}

function HeadshotThumb({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="w-full aspect-square bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400 px-2 text-center">
        Missing image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
    />
  );
}

export function CharacterCreationPage() {
  const setAdminSetupOpen = useStore((s) => s.setAdminSetupOpen);
  const setCharacterProfile = useStore((s) => s.setCharacterProfile);
  const setHasCompletedCharacterCreation = useStore((s) => s.setHasCompletedCharacterCreation);

  const copy = CHARACTER_CREATION_COPY;
  const [step, setStep] = useState<Step>('pick');
  const [selectedHeadshotId, setSelectedHeadshotId] = useState<string | null>(null);
  const [workingImage, setWorkingImage] = useState('');
  const [adjustments, setAdjustments] = useState<CharacterProfileAdjustments>({});
  const [wasRegenerated, setWasRegenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePickContinue = () => {
    if (!selectedHeadshotId) return;
    const headshot = CHARACTER_HEADSHOTS.find((h) => h.id === selectedHeadshotId);
    if (!headshot) return;

    useStore.getState().addStudyEvent({
      initiator: 'user',
      type: 'CHARACTER_HEADSHOT_SELECTED',
      count: 1,
      data: { headshotId: selectedHeadshotId }
    });

    setWorkingImage(headshot.image);
    setStep('refine');
  };

  const handleAdjustmentChange = (
    field: keyof CharacterProfileAdjustments,
    value: string
  ) => {
    setAdjustments((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreview = async (nextAdjustments: CharacterProfileAdjustments) => {
    if (!workingImage) return;
    setIsGenerating(true);
    try {
      useStore.getState().addStudyEvent({
        initiator: 'user',
        type: 'CHARACTER_PROFILE_PREVIEW',
        count: 1,
        data: { adjustments: nextAdjustments }
      });

      const { image, imagePrompt } = await generateCharacterProfileImage({
        currentImage: workingImage,
        adjustments: nextAdjustments
      });

      setWorkingImage(image);
      setWasRegenerated(true);

      useStore.getState().addStudyEvent({
        initiator: 'system',
        type: 'CHARACTER_PROFILE_GENERATED',
        count: 1,
        data: { imagePrompt, hasReferenceImage: true }
      });
    } catch (err) {
      console.error('[character profile preview]', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalize = async (nextAdjustments: CharacterProfileAdjustments) => {
    if (!selectedHeadshotId || !workingImage) return;

    try {
      const imageDataUrl = await toDataUrl(workingImage);

      useStore.getState().addStudyEvent({
        initiator: 'user',
        type: 'CHARACTER_PROFILE_COMPLETE',
        count: 1,
        data: {
          headshotId: selectedHeadshotId,
          adjustments: nextAdjustments,
          wasRegenerated
        }
      });

      setCharacterProfile({
        image: imageDataUrl,
        sourceHeadshotId: selectedHeadshotId,
        adjustments: nextAdjustments
      });
      setHasCompletedCharacterCreation(true);
    } catch (err) {
      console.error('[character profile finalize]', err);
    }
  };

  if (step === 'pick') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="min-h-full flex items-center justify-center p-4 py-10 sm:py-14">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 p-6 sm:p-10 md:p-14">
            <button
              type="button"
              onClick={() => setAdminSetupOpen(true)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-xs font-semibold text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
            >
              {copy.adminSetup}
            </button>

            <div className="text-center">
              <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
                {copy.pick.eyebrow}
              </span>
              <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                {copy.pick.title}
              </h1>
              <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
                {copy.pick.subtitle}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {CHARACTER_HEADSHOTS.map((headshot) => (
                <button
                  key={headshot.id}
                  type="button"
                  onClick={() => setSelectedHeadshotId(headshot.id)}
                  className={cardClass(selectedHeadshotId === headshot.id)}
                  aria-pressed={selectedHeadshotId === headshot.id}
                >
                  <HeadshotThumb src={headshot.image} alt={`Portrait option ${headshot.id}`} />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePickContinue}
              disabled={!selectedHeadshotId}
              className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              {copy.pick.continueButton} <span aria-hidden>→</span>
            </button>
            {!selectedHeadshotId && (
              <p className="mt-3 text-center text-xs text-slate-500">
                {copy.pick.continueDisabledHint}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
              {copy.refine.eyebrow}
            </span>
            <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              {copy.refine.title}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-3 text-gray-400 p-8">
                      <Loader size="lg" color="blue" />
                      <p className="text-sm font-medium text-blue-700">{copy.refine.generating}</p>
                    </div>
                  ) : workingImage ? (
                    <img
                      src={workingImage}
                      alt="Your character portrait"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <CharacterRefinementPhase
                copy={copy.refine}
                adjustments={adjustments}
                onChange={handleAdjustmentChange}
                onPreview={handlePreview}
                onContinue={handleFinalize}
                isGenerating={isGenerating}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
