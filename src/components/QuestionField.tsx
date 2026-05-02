import { SceneQuestion } from '@/types/questionnaire';

export function QuestionField({
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
