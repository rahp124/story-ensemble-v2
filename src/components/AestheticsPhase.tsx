import { Loader } from '@mantine/core';

export type SceneAesthetics = {
  character?: string;
  environment?: string;
  custom?: string;
};

interface AestheticsPhaseProps {
  sceneIndex: number;
  aesthetics: SceneAesthetics;
  onChange: (field: keyof SceneAesthetics, value: string) => void;
  onPreview: (aesthetics: SceneAesthetics) => void;
  onContinue: (aesthetics: SceneAesthetics) => void;
  isGenerating: boolean;
  isLastScene: boolean;
}

export function AestheticsPhase({
  sceneIndex,
  aesthetics,
  onChange,
  onPreview,
  onContinue,
  isGenerating,
  isLastScene
}: AestheticsPhaseProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 lg:p-8 min-h-[500px] flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          Scene {sceneIndex + 1} — Aesthetics
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Adjust the visual style of this scene. Use "Preview Update" to see changes before continuing.
        </p>
      </div>

      <div className="flex-grow space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Character adjustment
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Describe how the character should look or feel differently.
          </p>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[80px] resize-none"
            placeholder="e.g. More tired-looking, wearing a hoodie, slouched posture..."
            value={aesthetics.character ?? ''}
            onChange={(e) => onChange('character', e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Environment adjustment
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Describe changes to the setting, lighting, or background.
          </p>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[80px] resize-none"
            placeholder="e.g. Rainy outdoor courtyard, dimly lit cafeteria, crowded hallway..."
            value={aesthetics.environment ?? ''}
            onChange={(e) => onChange('environment', e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Additional notes <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[60px] resize-none"
            placeholder="Any other visual details you'd like to add or change..."
            value={aesthetics.custom ?? ''}
            onChange={(e) => onChange('custom', e.target.value)}
            disabled={isGenerating}
          />
        </div>
      </div>

      {isGenerating && (
        <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader size="sm" color="blue" />
          <p className="text-sm font-medium text-blue-700">Regenerating scene...</p>
        </div>
      )}

      <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-gray-100 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onPreview(aesthetics)}
          disabled={isGenerating}
          className="w-full py-3 px-6 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl border border-gray-300 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Preview Update
        </button>
        <button
          type="button"
          onClick={() => onContinue(aesthetics)}
          disabled={isGenerating}
          className="w-full py-3 md:py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLastScene ? 'Finish & Reveal Full Story' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
