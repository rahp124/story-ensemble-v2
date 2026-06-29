import { parse } from 'yaml';
import userLandingRaw from './userLandingCopy.yaml?raw';
import studyOverviewRaw from './studyOverviewCopy.yaml?raw';

export type OnboardingFeature = {
  icon: string;
  title: string;
  description: string;
};

export type PriorExperienceOption = {
  value: 'yes' | 'no';
  title: string;
  description: string;
};

export type UserLandingCopy = {
  adminSetup: string;
  header: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  informedContext: {
    heading?: string;
    paragraphs: string[];
  };
  consent: string;
  participantName: {
    label: string;
    placeholder: string;
  };
  beginButton: string;
  beginDisabledHint: string;
};

export type StudyOverviewCopy = {
  adminSetup: string;
  header: {
    eyebrow: string;
    title: string;
  };
  features: OnboardingFeature[];
  topic: {
    label: string;
    defaultTopic: string;
  };
  priorExperience: {
    legend: string;
    helper: string;
    options: PriorExperienceOption[];
  };
  experienceSummary: {
    label: string;
    optional: string;
    placeholder: string;
    helper: string;
  };
  continueButton: string;
  continueDisabledHint: string;
};

export const USER_LANDING_COPY = parse(userLandingRaw) as UserLandingCopy;
export const STUDY_OVERVIEW_COPY = parse(studyOverviewRaw) as StudyOverviewCopy;

export function interpolate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
}
