import { parse } from 'yaml';
import evaluateCopyRaw from './evaluateCopy.yaml?raw';
import evaluateQuestionsRaw from './evaluateQuestions.yaml?raw';

export type EvaluateLikertQuestion = {
  id: string;
  type: 'likert';
  prompt: string;
  required: boolean;
  points: number;
  minLabel: string;
  maxLabel: string;
};

export type EvaluateOpenResponseQuestion = {
  id: string;
  type: 'open_response';
  prompt: string;
  required: boolean;
  placeholder?: string;
};

export type EvaluateQuestion =
  | EvaluateLikertQuestion
  | EvaluateOpenResponseQuestion;

export type EvaluateCopy = {
  intro: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    beginButton: string;
  };
  item: {
    eyebrow: string;
    nextButton: string;
    backButton: string;
    finishButton: string;
    continueDisabledHint: string;
  };
  summary: {
    eyebrow: string;
    title: string;
    subtitle: string;
    userColumnTitle: string;
    designerColumnTitle: string;
    downloadButton: string;
    submitDisabledHint: string;
    expandRowHint: string;
    previewNotesLabel: string;
    emptyPairsHint: string;
  };
  completion: {
    eyebrow: string;
    completionTitle: string;
    completionMessage: string;
    startOverButton: string;
  };
};

export type EvaluateQuestions = {
  summaryPreviewQuestionId: string;
  itemFields: {
    user: string[];
    designer: string[];
  };
  perItem: EvaluateQuestion[];
  summary: EvaluateQuestion[];
};

export const EVALUATE_COPY = parse(evaluateCopyRaw) as EvaluateCopy;
export const EVALUATE_QUESTIONS = parse(evaluateQuestionsRaw) as EvaluateQuestions;

export function interpolate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    String(vars[key] ?? '')
  );
}
