import { useStore } from '@/store';
import { useState } from 'react';

const WARM_UP_QUESTIONS = [
  {
    id: 'q1-where-are-you',
    label: 'Where are you right now?',
    type: 'single_choice' as const,
    options: ['Dorm', 'Library', 'Classroom building', 'Student center', 'Outside']
  },
  {
    id: 'q2-what-matters-most',
    label: 'What matters most for your next meal?',
    type: 'single_choice' as const,
    options: ['Price', 'Speed', 'Healthy options', 'Taste', 'Convenience']
  },
  {
    id: 'q3-how-do-you-decide',
    label: 'How do you usually decide what to eat on campus?',
    type: 'single_choice' as const,
    options: [
      'Walk around and check lines',
      'Ask friends',
      'Use a delivery app',
      'Go to the same place every time'
    ]
  },
  {
    id: 'q6-frustration-note',
    label: 'What is the most frustrating part of choosing food on campus?',
    type: 'short_text' as const
  }
];

export function PreSurveyScreen() {
  const beginEvaluation = useStore((state) => state.beginEvaluation);
  const [answers, setAnswers] = useState<Record<string, string>>({
    'q1-where-are-you': '',
    'q2-what-matters-most': '',
    'q3-how-do-you-decide': '',
    'q6-frustration-note': ''
  });

  const handleChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleStart = () => {
    // TODO: Store pre-survey answers somewhere (optional)
    beginEvaluation();
  };

  const allAnswered = WARM_UP_QUESTIONS.every(
    (q) => answers[q.id] && answers[q.id].trim().length > 0
  );

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Step 0: The Warm-Up</h1>
        <p className="text-gray-600 mb-8">Answer these 4 questions before evaluation begins.</p>

        <div className="space-y-6">
          {WARM_UP_QUESTIONS.map((question) => (
            <div key={question.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {question.label}
              </label>

              {question.type === 'single_choice' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {question.options?.map((option) => {
                    const selected = answers[question.id] === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleChange(question.id, option)}
                        className={`text-left px-4 py-2 rounded-lg border transition-colors ${
                          selected
                            ? 'border-blue-600 bg-blue-50 text-blue-800'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  value={answers[question.id]}
                  onChange={(e) => handleChange(question.id, e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  rows={4}
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleStart}
          disabled={!allAnswered}
          className={`mt-8 w-full py-3 rounded-lg font-semibold transition-colors ${
            allAnswered
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Begin Evaluation
        </button>
      </div>
    </div>
  );
}
