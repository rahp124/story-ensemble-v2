import { EvalLayout } from '../EvalLayout';
import { useStore } from '@/store';
import { useState } from 'react';

interface AestheticsIntroScreenProps {
  sceneIndex: number;
}

/**
 * AestheticsIntroScreen: Introduction to aesthetics evaluation for a scene
 * Displays scene overview and prepares user for aesthetics questions
 */
export function AestheticsIntroScreen({ sceneIndex }: AestheticsIntroScreenProps) {
  const advanceEval = useStore((state) => state.advanceEval);
  const [accuracy, setAccuracy] = useState(50);

  const sceneTitle = `Scene ${sceneIndex + 1}: Aesthetics Evaluation`;
  const sceneCaption = `In this phase, you'll evaluate the visual aesthetics of Scene ${sceneIndex + 1}. 
You'll be asked 3 questions about visual composition, style, color palette, and overall visual appeal.`;

  // TODO: Replace with actual storyboard image from store
  const storyboardImage =
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop';

  return (
    <EvalLayout
      storyboardImage={storyboardImage}
      title={sceneTitle}
      caption={sceneCaption}
    >
      <div className="flex flex-col gap-4 h-full">
        <h3 className="text-lg font-semibold text-gray-900">
          Getting Started with Aesthetics Questions
        </h3>

        <div className="space-y-3 flex-1 overflow-y-auto">
          <p className="text-gray-700">
            <span className="font-medium">What you'll do:</span>
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
            <li>Review the visual elements of the storyboard</li>
            <li>Answer 3 questions about visual aesthetics</li>
            <li>Evaluate composition, color, style, and appeal</li>
            <li>Move to the next scene or complete evaluation</li>
          </ul>

          <p className="text-gray-700 mt-4">
            <span className="font-medium">Focus areas:</span>
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
            <li>Visual composition and balance</li>
            <li>Color palette and harmony</li>
            <li>Artistic style consistency</li>
            <li>Overall visual appeal and impact</li>
          </ul>
        </div>

        <button
          onClick={advanceEval}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Start Aesthetics Questions
        </button>
      </div>
    </EvalLayout>
  );
}
