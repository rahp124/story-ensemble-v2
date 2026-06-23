import { EvalLayout } from '../EvalLayout';
import { useStore } from '@/store';
import { useState } from 'react';

interface AestheticsQuestionScreenProps {
  sceneIndex: number;
  questionIndex: number; // 0, 1, or 2 for Q1, Q2, Q3
}

/**
 * AestheticsQuestionScreen: Displays a single aesthetics question
 * Loops through Q1, Q2, Q3 for each scene
 */
export function AestheticsQuestionScreen({
  sceneIndex,
  questionIndex
}: AestheticsQuestionScreenProps) {
  const advanceEval = useStore((state) => state.advanceEval);
  const [answer, setAnswer] = useState('');

  // Question templates (customize as needed)
  const aestheticsQuestions = [
    {
      title: 'Visual Aesthetics - Question 1',
      question: 'Evaluate the composition and balance of the visual elements.'
    },
    {
      title: 'Visual Aesthetics - Question 2',
      question: 'How effective is the color palette in conveying the scene\'s mood?'
    },
    {
      title: 'Visual Aesthetics - Question 3',
      question: 'What is your overall assessment of the visual appeal and artistic quality?'
    }
  ];

  const currentQ = aestheticsQuestions[questionIndex];
  const isLastQuestion = questionIndex === 2;
  const isLastScene = sceneIndex === 3;

  // TODO: Replace with actual storyboard image from store
  const storyboardImage =
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop';

  return (
    <EvalLayout
      storyboardImage={storyboardImage}
      title={currentQ.title}
      caption={`Scene ${sceneIndex + 1} - Question ${questionIndex + 1} of 3`}
    >
      <div className="flex flex-col gap-4 h-full">
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {currentQ.question}
          </h3>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter your response here..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            rows={8}
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={advanceEval}
            disabled={answer.trim().length === 0}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              answer.trim().length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLastQuestion && isLastScene
              ? 'Complete Evaluation'
              : isLastQuestion
                ? `Go to Scene ${sceneIndex + 2}`
                : 'Next Question'}
          </button>
        </div>
      </div>
    </EvalLayout>
  );
}
