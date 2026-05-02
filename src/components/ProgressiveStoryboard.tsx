import { Loader } from '@mantine/core';
import { useMemo, useState } from 'react';
import { SCENE_QUESTION_MAP, SceneQuestion } from '@/types/questionnaire';

interface StoryboardFramePreview {
  id: string;
  image?: string;
  caption: string;
}

export interface ProgressiveStoryboardProps {
  frames?: StoryboardFramePreview[];
  initialAnswers?: Record<string, string>;
  onComplete: (answers: Record<string, string>) => void;
}

const STEP_KEYS = [
  'warm_up',
  'scene_1_context',
  'scene_2_problem',
  'scene_3',
  'scene_4_solution'
] as const;

export function ProgressiveStoryboard({
  frames,
  initialAnswers,
  onComplete
}: ProgressiveStoryboardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers ?? {});
  const [error, setError] = useState('');

  const resolvedScene3Key = useMemo(() => {
    const easiest = answers['s2-1-easiest-option'];
    if (easiest === 'Delivery app') return 'scene_3_delivery';
    if (easiest === 'Dining hall') return 'scene_3_dining';
    return 'scene_3_home';
  }, [answers]);

  const currentQuestions: SceneQuestion[] = useMemo(() => {
    if (currentStep === 0) return SCENE_QUESTION_MAP.warm_up;
    if (currentStep === 1) return SCENE_QUESTION_MAP.scene_1_context;
    if (currentStep === 2) return SCENE_QUESTION_MAP.scene_2_problem;
    if (currentStep === 3) return SCENE_QUESTION_MAP[resolvedScene3Key];
    return SCENE_QUESTION_MAP.scene_4_solution;
  }, [currentStep, resolvedScene3Key]);

  const currentFrameIndex = currentStep - 1;
  const currentFrame = currentFrameIndex >= 0 ? frames?.[currentFrameIndex] : undefined;

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setError('');
  };

  const isAnswered = (question: SceneQuestion) => {
    const value = answers[question.id];
    if (!value) return false;
    return value.trim().length > 0;
  };

  const validateCurrentStep = () => {
    const allAnswered = currentQuestions.every(isAnswered);
    if (!allAnswered) {
      setError('Please answer all questions before continuing.');
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (!validateCurrentStep()) return;

    if (currentStep === STEP_KEYS.length - 1) {
      onComplete(answers);
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-blue-600 mb-1">
        Step {currentStep} of 4 • {currentStep === 3 ? resolvedScene3Key.replace(/_/g, ' ') : STEP_KEYS[currentStep].replace(/_/g, ' ')}
      </p>

      {currentStep === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          Warm-up: answer the questions to personalize your story before images begin.
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="aspect-video bg-white rounded border overflow-hidden flex items-center justify-center">
            {currentFrame?.image ? (
              <img src={currentFrame.image} alt={`Storyboard frame ${currentStep}`} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-600">
                <Loader size="sm" />
                <p className="text-xs">Generating frame {currentStep}...</p>
              </div>
            )}
          </div>
          {currentFrame?.caption ? (
            <p className="text-xs text-gray-700 mt-2">{currentFrame.caption}</p>
          ) : null}
        </div>
      )}

      <div className="space-y-4">
        {currentQuestions.map((question) => (
          <QuestionField
            key={question.id}
            question={question}
            value={answers[question.id] ?? ''}
            onChange={updateAnswer}
          />
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={handleContinue}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
      >
        {currentStep === STEP_KEYS.length - 1 ? 'Finish Story' : 'Continue Story'}
      </button>
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange
}: {
  question: SceneQuestion;
  value: string;
  onChange: (questionId: string, value: string) => void;
}) {
  if (question.type === 'short_text') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{question.text}</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-20"
          value={value}
          onChange={(e) => onChange(question.id, e.target.value)}
        />
      </div>
    );
  }

  if (question.type === 'multiple_choice') {
    const selected = value ? value.split('||') : [];
    return (
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">{question.text}</p>
        <div className="space-y-2">
          {question.options?.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => {
                  const next = selected.includes(option)
                    ? selected.filter((item) => item !== option)
                    : [...selected, option];
                  onChange(question.id, next.join('||'));
                }}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="block text-sm font-medium text-gray-700 mb-2">{question.text}</p>
      <div className="space-y-2">
        {question.options?.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={question.id}
              checked={value === option}
              onChange={() => onChange(question.id, option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
