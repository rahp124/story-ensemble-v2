import { SCENE_CONTENT_QUESTIONS } from '@/types/questionnaire';
import { QuestionField } from './QuestionField';

export type SceneContent = {
  familiarity?: string;
  mindset?: string;
  frustration?: string;
};

interface ContentPhaseProps {
  sceneIndex: number;
  content: SceneContent;
  onChange: (field: keyof SceneContent, value: string) => void;
  onSubmit: (content: SceneContent) => void;
}

const SCENE_TITLES = ['The Setup', 'The Challenge', 'The Response', 'The Reflection'];

export function ContentPhase({ sceneIndex, content, onChange, onSubmit }: ContentPhaseProps) {
  const questionSet = SCENE_CONTENT_QUESTIONS[sceneIndex];
  const isComplete =
    !!content.familiarity?.trim() &&
    !!content.mindset?.trim() &&
    !!content.frustration?.trim();

  const handleFieldChange = (questionId: string, value: string) => {
    if (questionId === questionSet.familiarity.id) onChange('familiarity', value);
    else if (questionId === questionSet.mindset.id) onChange('mindset', value);
    else if (questionId === questionSet.frustration.id) onChange('frustration', value);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 lg:p-8 min-h-[500px] flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          {SCENE_TITLES[sceneIndex]}
        </h2>
        <p className="text-sm text-gray-500 mt-1">Tell us about what you see in this scene.</p>
      </div>

      <div className="flex-grow space-y-6 md:space-y-8">
        <QuestionField
          question={questionSet.familiarity}
          value={content.familiarity ?? ''}
          onChange={handleFieldChange}
        />
        <QuestionField
          question={questionSet.mindset}
          value={content.mindset ?? ''}
          onChange={handleFieldChange}
        />
        <QuestionField
          question={questionSet.frustration}
          value={content.frustration ?? ''}
          onChange={handleFieldChange}
        />
      </div>

      <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-gray-100">
        <button
          type="button"
          onClick={() => onSubmit(content)}
          disabled={!isComplete}
          className="w-full py-3 md:py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
