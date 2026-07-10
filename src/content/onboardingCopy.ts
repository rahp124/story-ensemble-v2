import { parse } from 'yaml';
import userLandingRaw from './userLandingCopy.yaml?raw';
import studyOverviewRaw from './studyOverviewCopy.yaml?raw';
import characterCreationRaw from './characterCreationCopy.yaml?raw';

export type PriorExperienceOption = {
  value: 'yes' | 'no';
  title: string;
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
  intro: {
    pre_paragraphs: string[];
    post_paragraphs: string[];
    steps: string[];
  };
  topic: {
    label: string;
    defaultTopic: string;
  };
  priorExperience: {
    legend: string;
    helper: string;
    options: PriorExperienceOption[];
  };
  continueButton: string;
  continueDisabledHint: string;
};

export type CharacterCreationCopy = {
  adminSetup: string;
  pick: {
    eyebrow: string;
    title: string;
    subtitle: string;
    continueButton: string;
    continueDisabledHint: string;
    uploadDividerLabel: string;
    uploadButton: string;
  };
  upload: {
    modalTitle: string;
    takeSelfieButton: string;
    chooseFileButton: string;
    captureButton: string;
    retakeButton: string;
    chooseDifferentButton: string;
    backButton: string;
    continueButton: string;
    cancelButton: string;
    processing: string;
    cameraError: string;
    genericError: string;
  };
  refine: {
    eyebrow: string;
    title: string;
    subtitle: string;
    face: { label: string; helper: string; placeholder: string };
    hairAccessories: { label: string; helper: string; placeholder: string };
    clothing: { label: string; helper: string; placeholder: string };
    updateButton: string;
    continueButton: string;
    generating: string;
  };
};

export const USER_LANDING_COPY = parse(userLandingRaw) as UserLandingCopy;
export const STUDY_OVERVIEW_COPY = parse(studyOverviewRaw) as StudyOverviewCopy;
export const CHARACTER_CREATION_COPY = parse(characterCreationRaw) as CharacterCreationCopy;

export function interpolate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
}
