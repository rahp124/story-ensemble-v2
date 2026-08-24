import { ReactNode, useMemo, useState } from 'react';
import { Button } from '@mantine/core';
import { NodeType } from '@/rf-components';
import { useStore } from '@/store';
import type { StoryboardNodeData } from '@/types';
import type { Node } from 'reactflow';
import {
  buildStudyUsageExport,
  downloadStudyUsageData
} from '@/lib/studyUsageData';
import { uploadStudyUsageData } from '@/lib/studyDataUpload';
import { POST_SURVEY_COPY } from '@/content/postSurveyCopy';
import {
  canSubmitQuestions,
  QuestionField
} from '@/components/QuestionField';
import type { StoryboardFinalizeArtifact } from './StoryboardEditorPage';

type PostStoryboardSurveyPageProps = {
  /** Captured storyboard image; omitted when the storyboard is rendered directly. */
  artifact?: StoryboardFinalizeArtifact;
  /** Rendered storyboard shown in place of the captured image. */
  storyboardPreview?: ReactNode;
};

export function PostStoryboardSurveyPage({
  artifact,
  storyboardPreview
}: PostStoryboardSurveyPageProps) {
  const copy = POST_SURVEY_COPY;
  const addStudyEvent = useStore((s) => s.addStudyEvent);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(copy.questions.map((q) => [q.id, '']))
  );
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Empty when the storyboard could not be captured; the survey and log upload
  // still proceed without it.
  const capturedImage = artifact?.imageDataUrl?.trim() ? artifact.imageDataUrl : null;

  const canSubmit = useMemo(
    () => canSubmitQuestions(copy.questions, answers),
    [answers, copy.questions]
  );

  const handleChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleDownloadStoryboard = () => {
    if (!artifact || !capturedImage) return;
    const a = document.createElement('a');
    a.setAttribute('href', capturedImage);
    a.setAttribute('download', artifact.filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitted || isSubmitting) return;

    setIsSubmitting(true);

    addStudyEvent({
      initiator: 'user',
      type: 'POST_STORY_SURVEY_SUBMITTED',
      count: 1,
      data: { answers }
    });

    const state = useStore.getState();
    const storyboards = state.nodes.filter(
      (n): n is Node<StoryboardNodeData> => n.type === NodeType.Storyboard
    );
    const activeNode = storyboards[storyboards.length - 1];
    if (activeNode) {
      const exportData = buildStudyUsageExport(activeNode, state.studyEvents, {
        designTopic: state.designTopic,
        priorExperience: state.priorExperience,
        experienceDescription: state.experienceDescription,
        accessId: state.accessId,
        selectedVariantId: state.designerSelectedVariantId
      });
      try {
        await uploadStudyUsageData(exportData, artifact?.embedImageDataUrl);
      } catch (err) {
        console.error('[study usage upload]', err);
        downloadStudyUsageData(exportData);
      }
    }

    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="min-h-full flex items-center justify-center p-4 py-10 sm:py-14">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 p-6 sm:p-10 md:p-14">
          <div className="text-center">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
              {copy.eyebrow}
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {submitted ? copy.completionTitle : copy.title}
            </h1>
            {!submitted && (
              <p className="mt-2 text-sm max-w-xl mx-auto text-slate-600">
                {copy.subtitle}
              </p>
            )}
          </div>

          {!submitted && (
            <>
              <div className="mt-8">
                {storyboardPreview ??
                  (capturedImage && (
                    <>
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <img
                          src={capturedImage}
                          alt="Your completed storyboard"
                          className="w-full h-auto"
                        />
                      </div>
                      <div className="mt-4 flex justify-center">
                        <Button variant="default" onClick={handleDownloadStoryboard}>
                          {copy.downloadStoryboardButton}
                        </Button>
                      </div>
                    </>
                  ))}
              </div>

              <div className="mt-10 space-y-8">
                {copy.questions.map((question) => (
                  <QuestionField
                    key={question.id}
                    question={question}
                    value={answers[question.id]}
                    onChange={(value) => handleChange(question.id, value)}
                    idPrefix="survey"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? 'Submitting…' : copy.submitButton}
              </button>
              {!canSubmit && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  {copy.submitDisabledHint}
                </p>
              )}
            </>
          )}

          {submitted && (
            <p className="mt-6 text-center text-slate-600 leading-relaxed">
              {copy.completionMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
