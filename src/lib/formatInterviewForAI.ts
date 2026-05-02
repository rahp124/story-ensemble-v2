import { Question } from '@/types/questionnaire';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatInterviewForAI(
  answers: Record<string, string>,
  questions: Question[]
): string {
  const scenes = questions
    .map((question) => {
      const answer = answers[question.id];
      if (!answer || !answer.trim()) return null;

      return [
        `<scene category='${escapeXml(question.category)}'>`,
        `<question>${escapeXml(question.text)}</question>`,
        `<answer>${escapeXml(answer)}</answer>`,
        `</scene>`
      ].join('\n');
    })
    .filter((scene): scene is string => scene !== null)
    .join('\n');

  return `<user_interview>\n${scenes}\n</user_interview>`;
}
