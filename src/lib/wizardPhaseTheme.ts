export type WizardPhaseTheme = 'content' | 'aesthetics';

export const WIZARD_PHASE_THEME = {
  content: {
    primary: 'rgba(241, 211, 16, 1)',
    secondary: 'rgba(241, 211, 16, 0.1)'
  },
  aesthetics: {
    primary: 'rgba(232, 200, 230, 1)',
    secondary: 'rgba(232, 200, 230, 0.3)'
  }
} as const;

export function panelCardStyle(theme: WizardPhaseTheme) {
  void theme;
  return { backgroundColor: 'rgba(249, 250, 251, 1)' };
}

export function panelCardBorderStyle(theme: WizardPhaseTheme) {
  void theme;
  return { borderColor: 'rgba(229, 231, 235, 1)' };
}
