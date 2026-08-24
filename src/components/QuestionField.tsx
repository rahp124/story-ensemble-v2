import type { EvaluateQuestion } from '@/content/evaluateCopy';

type QuestionFieldProps = {
  question: EvaluateQuestion;
  value: string;
  onChange: (value: string) => void;
  idPrefix?: string;
};

export function QuestionField({
  question,
  value,
  onChange,
  idPrefix = 'question'
}: QuestionFieldProps) {
  const inputId =
    question.type === 'open_response'
      ? `${idPrefix}-${question.id}`
      : undefined;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-base font-semibold text-slate-900 mb-3"
      >
        {question.prompt}
        {question.required && (
          <span className="text-blue-600 ml-1" aria-hidden>
            *
          </span>
        )}
      </label>

      {question.type === 'likert' ? (
        <fieldset>
          <legend className="sr-only">{question.prompt}</legend>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-xs font-medium text-slate-500 w-20 shrink-0 text-right">
              {question.minLabel}
            </span>
            <div className="flex flex-1 items-center justify-between">
              {Array.from({ length: question.points }, (_, i) => {
                const pointValue = String(i);
                const selected = value === pointValue;
                return (
                  <label
                    key={pointValue}
                    className="flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`${idPrefix}-${question.id}`}
                      value={pointValue}
                      checked={selected}
                      onChange={() => onChange(pointValue)}
                      className="sr-only"
                    />
                    <span
                      className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-colors ${
                        selected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 bg-white text-gray-500 hover:border-blue-400'
                      }`}
                    >
                      {pointValue}
                    </span>
                  </label>
                );
              })}
            </div>
            <span className="text-xs font-medium text-slate-500 w-20 shrink-0">
              {question.maxLabel}
            </span>
          </div>
        </fieldset>
      ) : (
        <textarea
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y text-sm"
        />
      )}
    </div>
  );
}

export function canSubmitQuestions(
  questions: EvaluateQuestion[],
  answers: Record<string, string>
): boolean {
  return questions.every((question) => {
    if (!question.required) return true;
    return answers[question.id]?.trim().length > 0;
  });
}

export function emptyAnswersForQuestions(
  questions: EvaluateQuestion[]
): Record<string, string> {
  return Object.fromEntries(questions.map((q) => [q.id, '']));
}
