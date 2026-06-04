import { Loader } from '@mantine/core';

interface StoryLockPhaseProps {
  storyboardFrames?: Array<{ caption: string }>;
  isGenerating: boolean;
  onLockStory: () => void;
}

export function StoryLockPhase({
  storyboardFrames,
  isGenerating,
  onLockStory
}: StoryLockPhaseProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 lg:p-8 min-h-[500px] flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          Story Ready to Lock
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Review your story across all frames. Once locked, you can move to visual style selection and image generation.
        </p>
      </div>

      <div className="flex-grow space-y-4 overflow-y-auto">
        {storyboardFrames && storyboardFrames.length > 0 ? (
          <div className="space-y-3">
            {storyboardFrames.map((frame, idx) => (
              <div
                key={idx}
                className="p-4 bg-blue-50 border border-blue-100 rounded-lg"
              >
                <p className="text-xs font-semibold text-blue-900 mb-1">
                  Frame {idx + 1}
                </p>
                <p className="text-sm text-blue-800">
                  {frame.caption}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500">Loading frames...</p>
          </div>
        )}
      </div>

      {isGenerating && (
        <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader size="sm" color="blue" />
          <p className="text-sm font-medium text-blue-700">Processing...</p>
        </div>
      )}

      <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-gray-100">
        <button
          type="button"
          onClick={onLockStory}
          disabled={isGenerating}
          className="w-full py-3 md:py-4 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Story Looks Right — Lock & Choose Visual Style
        </button>
        <p className="text-xs text-gray-500 mt-3 text-center">
          Once locked, you'll select a visual style and direction before generating high-fidelity images.
        </p>
      </div>
    </div>
  );
}
