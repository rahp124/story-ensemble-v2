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
  return { backgroundColor: WIZARD_PHASE_THEME[theme].secondary };
}

export function panelCardBorderStyle(theme: WizardPhaseTheme) {
  return { borderColor: WIZARD_PHASE_THEME[theme].primary };
}
