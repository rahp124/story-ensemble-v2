import { useEffect, useMemo, useState } from 'react';
import { Question, STORY_QUESTIONS } from '@/types/questionnaire';

export interface DynamicStoryWizardProps {
  onGenerateStoryboard: (answers: Record<string, string>) => void;
  isGenerating?: boolean;
}

export function DynamicStoryWizard({
  onGenerateStoryboard,
  isGenerating = false
}: DynamicStoryWizardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleQuestions = useMemo(() => {
    return STORY_QUESTIONS.filter((question) => {
      if (!question.dependsOn) return true;

      const selectedValue = answers[question.dependsOn.questionId];
      return selectedValue === question.dependsOn.value;
    });
  }, [answers]);

  useEffect(() => {
    if (visibleQuestions.length === 0) {
      setCurrentIndex(0);
      return;
    }

    if (currentIndex > visibleQuestions.length - 1) {
      setCurrentIndex(visibleQuestions.length - 1);
    }
  }, [currentIndex, visibleQuestions.length]);

  const currentQuestion = visibleQuestions[currentIndex];
  const isLastQuestion = currentIndex === visibleQuestions.length - 1;

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) return;
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => prev - 1);
  };

  const handleSubmit = () => {
    if (isGenerating) return;
    onGenerateStoryboard(answers);
  };

  if (!currentQuestion) {
    return (
      <div className="p-4 rounded-lg border border-gray-200 bg-white">
        <p className="text-sm text-gray-600">No questions available.</p>
      </div>
    );
  }

  const currentValue = answers[currentQuestion.id] ?? '';
  const canProceed =
    currentQuestion.type === 'short_text' || currentQuestion.type === 'long_text'
      ? currentValue.trim().length > 0
      : currentValue.length > 0;

  return (
    <div className="max-w-2xl w-full mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <p className="text-xs font-semibold tracking-wide uppercase text-blue-600">
        {currentQuestion.category.replace('_', ' ')}
      </p>
      <h2 className="text-xl font-semibold text-gray-900 mt-1 mb-2">
        Question {currentIndex + 1} of {visibleQuestions.length}
      </h2>
      <p className="text-gray-800 mb-5">{currentQuestion.text}</p>

      <QuestionField
        question={currentQuestion}
        value={currentValue}
        onChange={handleAnswerChange}
      />

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50"
          onClick={handlePrevious}
          disabled={currentIndex === 0 || isGenerating}
        >
          Previous
        </button>

        {!isLastQuestion ? (
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
            onClick={handleNext}
            disabled={!canProceed || isGenerating}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!canProceed || isGenerating}
          >
            {isGenerating ? 'AI is processing your answers...' : 'Generate Storyboard'}
          </button>
        )}
      </div>
    </div>
  );
}

interface QuestionFieldProps {
  question: Question;
  value: string;
  onChange: (questionId: string, value: string) => void;
}

function QuestionField({ question, value, onChange }: QuestionFieldProps) {
  if (question.type === 'single_choice') {
    return (
      <div className="space-y-2">
        {question.options?.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 cursor-pointer"
          >
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
    );
  }

  if (question.type === 'short_text') {
    return (
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg p-3"
        value={value}
        onChange={(e) => onChange(question.id, e.target.value)}
        placeholder="Type your answer..."
      />
    );
  }

  if (question.type === 'long_text') {
    return (
      <textarea
        className="w-full border border-gray-300 rounded-lg p-3 min-h-28"
        value={value}
        onChange={(e) => onChange(question.id, e.target.value)}
        placeholder="Type your answer..."
      />
    );
  }

  if (question.type === 'scale') {
    return (
      <select
        className="w-full border border-gray-300 rounded-lg p-3"
        value={value}
        onChange={(e) => onChange(question.id, e.target.value)}
      >
        <option value="">Select a value</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={String(n)}>
            {n}
          </option>
        ))}
      </select>
    );
  }

  if (question.type === 'multiple_choice') {
    const selected = value ? value.split('||') : [];

    const toggle = (option: string) => {
      const next = selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option];

      onChange(question.id, next.join('||'));
    };

    return (
      <div className="space-y-2">
        {question.options?.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggle(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  }

  return null;
}
