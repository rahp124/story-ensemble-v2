import { EvalLayout } from '../EvalLayout';
import { useStore } from '@/store';
import { useState } from 'react';

interface ContentQuestionScreenProps {
  sceneIndex: number;
  questionIndex: number; // 0, 1, or 2 for Q1, Q2, Q3
}

/**
 * ContentQuestionScreen: Displays a single content question
 * Loops through Q1, Q2, Q3 for each scene
 */
export function ContentQuestionScreen({
  sceneIndex,
  questionIndex
}: ContentQuestionScreenProps) {
  const advanceEval = useStore((state) => state.advanceEval);
  const [accuracy, setAccuracy] = useState(50);
  const [answer, setAnswer] = useState('');

  // Question templates (customize as needed)
  const contentQuestions = [
    {
      title: 'Content Accuracy - Question 1',
      question: 'Does the storyboard accurately represent the narrative context? Explain.'
    },
    {
      title: 'Content Accuracy - Question 2',
      question: 'Are the characters and their interactions portrayed correctly?'
    },
    {
      title: 'Content Accuracy - Question 3',
      question: 'How well does the scene communicate the intended message?'
    }
  ];

  const currentQ = contentQuestions[questionIndex];
  const isLastQuestion = questionIndex === 2;

  // TODO: Replace with actual storyboard image from store
  const storyboardImage =
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop';

  return (
    <EvalLayout
      storyboardImage={storyboardImage}
      title={currentQ.title}
      caption={`Scene ${sceneIndex + 1} - Question ${questionIndex + 1} of 3`}
      accuracy={accuracy}
      onAccuracyChange={setAccuracy}
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
            {isLastQuestion ? 'Go to Aesthetics Intro' : 'Next Question'}
          </button>
        </div>
      </div>
    </EvalLayout>
  );
}
