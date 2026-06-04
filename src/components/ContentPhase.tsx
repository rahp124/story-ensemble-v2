import { useEffect, useState } from 'react';
import { SCENE_QUESTION_MAP, SceneQuestion } from '@/types/questionnaire';
import { QuestionField } from './QuestionField';

export type SceneContent = Record<string, string | undefined>;

interface ContentPhaseProps {
  sceneIndex: number;
  content: SceneContent;
  onChange: (field: keyof SceneContent, value: string) => void;
  onSubmit: (content: SceneContent) => void;
}

const SCENE_TITLES = ['The Setup', 'The Challenge', 'The Response', 'The Reflection'];

export function ContentPhase({ sceneIndex, content, onChange, onSubmit }: ContentPhaseProps) {
  const [step, setStep] = useState<'generation' | 'reflection'>('generation');
  useEffect(() => {
    setStep('generation');
  }, [sceneIndex]);
  // Map sceneIndex to the generation question key in SCENE_QUESTION_MAP
  // Map panels to the user's desired flow:
  // Panel 1 (sceneIndex 0) -> warm_up (Context)
  // Panel 2 (sceneIndex 1) -> scene_2_problem (Problem)
  // Panel 3 (sceneIndex 2) -> scene_3_delivery (Solution)
  // Panel 4 (sceneIndex 3) -> scene_4_solution (Resolution)
  const generationKey = (() => {
    if (sceneIndex === 0) return 'warm_up';
    if (sceneIndex === 1) return 'scene_2_problem';
    if (sceneIndex === 2) return 'scene_3_delivery';
    if (sceneIndex === 3) return 'scene_4_solution';
    return 'warm_up';
  })();
  const generationQuestions: SceneQuestion[] = (SCENE_QUESTION_MAP as any)[generationKey] ?? [];
  const getValueForQuestion = (q: SceneQuestion) => {
    if (q.id.endsWith('familiarity')) return content.familiarity ?? '';
    if (q.id.endsWith('mindset')) return content.mindset ?? '';
    if (q.id.endsWith('frustration')) return content.frustration ?? '';
    return content[q.id] ?? '';
  };

  const isComplete = generationQuestions.every((q) => !!(getValueForQuestion(q).trim()));

  const handleFieldChange = (questionId: string, value: string) => {
    // Map generation question IDs to canonical reflection keys by suffix
    if (questionId.endsWith('familiarity')) onChange('familiarity', value);
    else if (questionId.endsWith('mindset')) onChange('mindset', value);
    else if (questionId.endsWith('frustration')) onChange('frustration', value);
    else onChange(questionId as keyof SceneContent, value);
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
        {step === 'generation' ? (
          // Generation questions view
          <>
            {generationQuestions.map((gq) => (
              <QuestionField
                key={gq.id}
                question={gq}
                value={getValueForQuestion(gq)}
                onChange={handleFieldChange}
              />
            ))}
          </>
        ) : (
          // Reflection view (separate step shown after Generation)
          <div>
            <h3 className="text-lg font-semibold mb-2">Scene {sceneIndex + 1} - Reflection</h3>
            <p className="text-sm text-gray-500 mb-4">Caption about reflection</p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-800 mb-1">Briefly describe what this moment felt like for you.</label>
              <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none" value={content?.mindset ?? ''} onChange={(e) => onChange('mindset', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">What was the main thing on your mind at this moment? Write a sentence describing your specific thought or feeling at this moment.</label>
              <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none" value={content?.frustration ?? ''} onChange={(e) => onChange('frustration', e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-gray-100">
        {step === 'generation' ? (
          <button
            type="button"
            onClick={() => setStep('reflection')}
            disabled={!isComplete}
            className="w-full py-3 md:py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSubmit(content)}
            className="w-full py-3 md:py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
