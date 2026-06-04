import { useState } from 'react';
import { VisualStylePreferences } from '../types';

interface VisualStylePhaseProps {
  initialPreferences?: VisualStylePreferences;
  isGenerating: boolean;
  onSave: (preferences: VisualStylePreferences) => void;
}

export function VisualStylePhase({
  initialPreferences,
  isGenerating,
  onSave
}: VisualStylePhaseProps) {
  const [preferences, setPreferences] = useState<VisualStylePreferences>(
    initialPreferences || {
      visualStyle: 'clean_ux_illustration',
      detailLevel: 'medium',
      peopleRepresentation: 'generic_figures',
      environmentDetail: 'moderate',
      tone: 'neutral',
      mustShow: '',
      mustAvoid: ''
    }
  );

  const handleSubmit = () => {
    onSave(preferences);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          Visual Style Direction
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose how you'd like your story visualized. These settings will guide image generation.
        </p>
      </div>

      <div className="space-y-8">
        {/* Visual Style */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Visual Style
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { value: 'simple_sketch', label: 'Simple Sketch', desc: 'Minimal line-based illustrations' },
              { value: 'clean_ux_illustration', label: 'Clean UX Illustration', desc: 'Modern, professional style' },
              { value: 'comic_panel', label: 'Comic Panel', desc: 'Sequential art with borders' },
              { value: 'realistic_scene', label: 'Realistic Scene', desc: 'Photorealistic or detailed rendering' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPreferences({ ...preferences, visualStyle: option.value as any })}
                className={`p-3 text-left rounded-lg border-2 transition-all ${
                  preferences.visualStyle === option.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-sm text-gray-900">{option.label}</p>
                <p className="text-xs text-gray-500">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Level */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Detail Level
          </label>
          <div className="flex gap-3">
            {[
              { value: 'low', label: 'Low', desc: 'Simplified elements' },
              { value: 'medium', label: 'Medium', desc: 'Balanced detail' },
              { value: 'high', label: 'High', desc: 'Rich, intricate details' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPreferences({ ...preferences, detailLevel: option.value as any })}
                className={`flex-1 p-3 rounded-lg border-2 transition-all text-center ${
                  preferences.detailLevel === option.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-sm text-gray-900">{option.label}</p>
                <p className="text-xs text-gray-500">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* People Representation */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            People Representation
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: 'generic_figures', label: 'Generic Figures', desc: 'Simple stick/silhouette style' },
              { value: 'more_human_detail', label: 'More Human Detail', desc: 'Expressive faces and bodies' },
              { value: 'match_context', label: 'Match Context', desc: 'Reflect described demographics' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPreferences({ ...preferences, peopleRepresentation: option.value as any })}
                className={`p-3 text-left rounded-lg border-2 transition-all ${
                  preferences.peopleRepresentation === option.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-sm text-gray-900">{option.label}</p>
                <p className="text-xs text-gray-500">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Environment Detail */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Environment Detail
          </label>
          <div className="flex gap-3">
            {[
              { value: 'minimal', label: 'Minimal', desc: 'Sparse, clean backgrounds' },
              { value: 'moderate', label: 'Moderate', desc: 'Contextual details present' },
              { value: 'detailed', label: 'Detailed', desc: 'Rich environmental storytelling' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPreferences({ ...preferences, environmentDetail: option.value as any })}
                className={`flex-1 p-3 rounded-lg border-2 transition-all text-center ${
                  preferences.environmentDetail === option.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-sm text-gray-900">{option.label}</p>
                <p className="text-xs text-gray-500">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Overall Tone
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'neutral', label: 'Neutral', desc: 'Objective' },
              { value: 'warm', label: 'Warm', desc: 'Friendly, inviting' },
              { value: 'serious', label: 'Serious', desc: 'Professional, formal' },
              { value: 'urgent', label: 'Urgent', desc: 'Energetic, immediate' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPreferences({ ...preferences, tone: option.value as any })}
                className={`p-3 text-center rounded-lg border-2 transition-all ${
                  preferences.tone === option.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-sm text-gray-900">{option.label}</p>
                <p className="text-xs text-gray-500">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Must Show */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Must Show (optional)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Specific elements, props, or details that must appear in all or most frames.
          </p>
          <textarea
            value={preferences.mustShow ?? ''}
            onChange={(e) => setPreferences({ ...preferences, mustShow: e.target.value })}
            disabled={isGenerating}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[60px] resize-none focus:outline-none focus:border-blue-500"
            placeholder="e.g. Always show a laptop, include warm lighting, feature the app UI prominently..."
          />
        </div>

        {/* Must Avoid */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Must Avoid (optional)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Elements, styles, or details to avoid across all frames.
          </p>
          <textarea
            value={preferences.mustAvoid ?? ''}
            onChange={(e) => setPreferences({ ...preferences, mustAvoid: e.target.value })}
            disabled={isGenerating}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[60px] resize-none focus:outline-none focus:border-blue-500"
            placeholder="e.g. No people smiling, avoid corporate aesthetics, no dark colors..."
          />
        </div>
      </div>

      <div className="pt-6 md:pt-8 mt-8 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isGenerating}
          className="w-full py-3 md:py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Saving Visual Style...' : 'Save Visual Style & Continue'}
        </button>
        <p className="text-xs text-gray-500 mt-3 text-center">
          You'll be able to generate high-fidelity images with these settings next.
        </p>
      </div>
    </div>
  );
}
