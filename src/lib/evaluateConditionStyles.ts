import type { EvaluateSource } from '@/lib/evaluateData';

export type EvaluateConditionStyles = {
  badge: string;
  border: string;
  panelBg: string;
};

const USER_STYLES: EvaluateConditionStyles = {
  badge: 'bg-sky-100 text-sky-800',
  border: 'border-sky-300',
  panelBg: 'bg-sky-50/60'
};

const DESIGNER_STYLES: EvaluateConditionStyles = {
  badge: 'bg-purple-100 text-purple-800',
  border: 'border-purple-300',
  panelBg: 'bg-purple-50/60'
};

export function getEvaluateConditionStyles(
  source: EvaluateSource
): EvaluateConditionStyles {
  return source === 'user' ? USER_STYLES : DESIGNER_STYLES;
}
