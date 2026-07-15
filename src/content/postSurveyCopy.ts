import { parse } from 'yaml';
import postSurveyRaw from './postSurveyCopy.yaml?raw';

export type PostSurveyLikertQuestion = {
  id: string;
  type: 'likert';
  prompt: string;
  required: boolean;
  points: number;
  minLabel: string;
  maxLabel: string;
};

export type PostSurveyOpenResponseQuestion = {
  id: string;
  type: 'open_response';
  prompt: string;
  required: boolean;
  placeholder?: string;
};

export type PostSurveyQuestion =
  | PostSurveyLikertQuestion
  | PostSurveyOpenResponseQuestion;

export type PostSurveyCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  downloadStoryboardButton: string;
  submitButton: string;
  submitDisabledHint: string;
  completionTitle: string;
  completionMessage: string;
  questions: PostSurveyQuestion[];
};

export const POST_SURVEY_COPY = parse(postSurveyRaw) as PostSurveyCopy;
