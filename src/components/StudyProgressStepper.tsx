import { Fragment } from "react/jsx-runtime";

export type StoryWizardPhase =
  | 'variant-select'
  | 'panel-generate'
  | 'content'
  | 'aesthetics'
  | 'reflection'
  | 'story-lock'
  | 'visual-style'
  | 'error';

interface StudyProgressStepperProps {
  /** Current StoryWizard phase (designer flow). */
  phase: StoryWizardPhase;
  /** Zero-based panel index in the designer flow (0..3). */
  sceneIndex: number;
  className?: string;
}

type CircleStatus = 'complete' | 'active' | 'upcoming';

function StepCircle({
  status,
  label
}: {
  status: CircleStatus;
  label?: string;
}) {
  const base =
    'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors';

  const styles =
    status === 'complete'
      ? 'bg-blue-600 text-white'
      : status === 'active'
        ? 'bg-gray-200 text-gray-900 ring-4 ring-gray-300'
        : 'bg-white border-2 border-gray-300 text-gray-400';

  return (
    <div className={`${base} ${styles}`}>
      {status === 'complete' ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        label
      )}
    </div>
  );
}

function StepGroup({
  title,
  statuses
}: {
  title: string;
  statuses: CircleStatus[];
}) {
  const active = statuses.some((s) => s === 'active');

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5">
        {statuses.map((status, i) => (
          <StepCircle
            key={i}
            status={status}
            label={statuses.length > 1 ? String(i + 1) : undefined}
          />
        ))}
      </div>
      <span
        className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-gray-900' : 'text-gray-400'}`}
      >
        {title}
      </span>
    </div>
  );
}

export function StudyProgressStepper({
  phase,
  sceneIndex,
  className = ''
}: StudyProgressStepperProps) {
  const panelTitles = ['Context', 'Problem', 'Action', 'Resolution'] as const;

  const isDone = phase === 'story-lock' || phase === 'visual-style';
  const activePanelIndex = Math.min(Math.max(sceneIndex, 0), panelTitles.length - 1);

  const activeSubstepIndex = (() => {
    if (phase === 'aesthetics') return 1;
    if (phase === 'reflection') return 2;
    // Treat both panel generation and content-update screens as the first page of the panel.
    return 0;
  })();

  const panelStatuses = (panelIndex: number): CircleStatus[] => {
    if (isDone) return ['complete', 'complete', 'complete'];
    if (panelIndex < activePanelIndex) return ['complete', 'complete', 'complete'];
    if (panelIndex > activePanelIndex) return ['upcoming', 'upcoming', 'upcoming'];
    return (['upcoming', 'upcoming', 'upcoming'] as CircleStatus[]).map((_, i) => {
      if (i < activeSubstepIndex) return 'complete';
      if (i === activeSubstepIndex) return 'active';
      return 'upcoming';
    });
  };

  const introStatus: CircleStatus = isDone ? 'complete' : 'complete';
  const overviewStatus: CircleStatus = isDone ? 'active' : 'upcoming';

  return (
    <div
      className={`w-full flex items-start justify-center gap-3 md:gap-6 flex-wrap ${className}`}
    >
      <StepGroup title="Intro" statuses={[introStatus]} />
      <div className="hidden md:block flex-1 max-w-[3rem] h-px bg-gray-200 mt-3.5" />
      {panelTitles.map((title) => (
        <Fragment key={title}>
          <div key={title} className="flex items-start gap-3 md:gap-6">
            <StepGroup title={title} statuses={panelStatuses(panelTitles.indexOf(title))} />
          </div>
          <div className="hidden md:block flex-1 max-w-[3rem] h-px bg-gray-200 mt-3.5" />
        </Fragment>
      ))}
      <StepGroup title="Review" statuses={[overviewStatus]} />
    </div>
  );
}
