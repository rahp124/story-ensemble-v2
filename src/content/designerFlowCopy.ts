import { parse } from 'yaml';
import designerFlowRaw from './designerFlowCopy.yaml?raw';

export type DesignerResponseQuestion = {
  id: string;
  prompt: string;
  required: boolean;
  placeholder?: string;
};

export type DesignerFlowCopy = {
  picker: {
    eyebrow: string;
    heading: string;
    continueButton: string;
  };
  response: {
    eyebrow: string;
    title: string;
    subtitle: string;
    continueButton: string;
    continueDisabledHint: string;
    questions: DesignerResponseQuestion[];
  };
};

export const DESIGNER_FLOW_COPY = parse(designerFlowRaw) as DesignerFlowCopy;
