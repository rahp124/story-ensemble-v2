import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';

// Import sub-screen components (to be created)
import { PreSurveyScreen } from './evaluation/PreSurveyScreen';
import { ContentIntroScreen } from './evaluation/ContentIntroScreen';
import { ContentQuestionScreen } from './evaluation/ContentQuestionScreen';
import { AestheticsIntroScreen } from './evaluation/AestheticsIntroScreen';
import { AestheticsQuestionScreen } from './evaluation/AestheticsQuestionScreen';
import { FinalStoryboardScreen } from './evaluation/FinalStoryboardScreen';

/**
 * EvaluationRouter: Routes to the correct evaluation screen based on store state
 *
 * State Flow:
 * 1. appPhase: 'pre-survey' | 'evaluating' | 'final-storyboard'
 * 2. Inside 'evaluating': loops through 4 scenes with nested micro-flow
 * 3. currentSceneIndex: 0-3
 * 4. evalSubStep: content-intro → content-q (x3) → aesthetics-intro → aesthetics-q (x3)
 * 5. questionIndex: 0-2 (for content-q and aesthetics-q)
 */
export function EvaluationRouter() {
  const evaluation = useStore(
    useShallow((state) => state.evaluation)
  );

  const { appPhase, currentSceneIndex, evalSubStep, questionIndex } = evaluation;

  // Pre-survey phase
  if (appPhase === 'pre-survey') {
    return <PreSurveyScreen />;
  }

  // Final storyboard phase
  if (appPhase === 'final-storyboard') {
    return <FinalStoryboardScreen />;
  }

  // Evaluating phase - nested loop through scenes
  if (appPhase === 'evaluating') {
    switch (evalSubStep) {
      case 'content-intro':
        return <ContentIntroScreen sceneIndex={currentSceneIndex} />;

      case 'content-q':
        return (
          <ContentQuestionScreen
            sceneIndex={currentSceneIndex}
            questionIndex={questionIndex}
          />
        );

      case 'aesthetics-intro':
        return <AestheticsIntroScreen sceneIndex={currentSceneIndex} />;

      case 'aesthetics-q':
        return (
          <AestheticsQuestionScreen
            sceneIndex={currentSceneIndex}
            questionIndex={questionIndex}
          />
        );

      default:
        return <div>Unknown evaluation step</div>;
    }
  }

  return <div>Invalid app phase</div>;
}
