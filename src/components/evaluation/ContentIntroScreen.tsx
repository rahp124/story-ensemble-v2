import { EvalLayout } from '../EvalLayout';
import { useStore } from '@/store';

interface ContentIntroScreenProps {
  sceneIndex: number;
}

/**
 * ContentIntroScreen: Introduction to content evaluation for a scene
 * Displays scene overview and prepares user for content questions
 */
export function ContentIntroScreen({ sceneIndex }: ContentIntroScreenProps) {
  const advanceEval = useStore((state) => state.advanceEval);

  const sceneTitle = `Scene ${sceneIndex + 1}: Content Evaluation`;
  const sceneCaption = `In this phase, you'll evaluate the content accuracy of Scene ${sceneIndex + 1}. 
You'll be asked 3 questions about how well the storyboard represents the intended narrative and context.`;

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
          Getting Started with Content Questions
        </h3>

        <div className="space-y-3 flex-1 overflow-y-auto">
          <p className="text-gray-700">
            <span className="font-medium">What you'll do:</span>
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
            <li>Review the storyboard on the left</li>
            <li>Answer 3 questions about content accuracy</li>
            <li>Rate your confidence for each answer</li>
            <li>Move on to aesthetics evaluation</li>
          </ul>

          <p className="text-gray-700 mt-4">
            <span className="font-medium">Tips:</span>
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
            <li>Take your time to review the image</li>
            <li>Consider the narrative context</li>
            <li>Be honest about your assessment</li>
          </ul>
        </div>

        <button
          onClick={advanceEval}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Start Content Questions
        </button>
      </div>
    </EvalLayout>
  );
}
