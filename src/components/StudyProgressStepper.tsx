export type StudyPhase = 'intro' | 'content' | 'aesthetics' | 'end';

interface StudyProgressStepperProps {
  /** Which high-level phase the participant is currently in. */
  phase: StudyPhase;
  /** Zero-based index of the active scene within content/aesthetics. */
  sceneIndex: number;
  /** Number of scenes (Content + Aesthetics each get one circle per scene). */
  totalScenes?: number;
  className?: string;
}

type CircleStatus = 'complete' | 'active' | 'upcoming';

const PHASE_ORDER: Record<StudyPhase, number> = {
  intro: 0,
  content: 1,
  aesthetics: 2,
  end: 3
};

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
      ? 'bg-blue-600 text-white ring-4 ring-blue-200'
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
        className={`text-xs font-bold uppercase tracking-wider ${
          active ? 'text-blue-600' : 'text-gray-400'
        }`}
      >
        {title}
      </span>
    </div>
  );
}

/**
 * Reusable end-to-end study progress indicator:
 * Intro (1) → Content (one per scene) → Aesthetics (one per scene) → End (1).
 */
export function StudyProgressStepper({
  phase,
  sceneIndex,
  totalScenes = 4,
  className = ''
}: StudyProgressStepperProps) {
  const order = PHASE_ORDER[phase];

  const sceneStatuses = (phaseKey: 'content' | 'aesthetics'): CircleStatus[] => {
    const phaseIdx = PHASE_ORDER[phaseKey];
    return Array.from({ length: totalScenes }, (_, i) => {
      if (order > phaseIdx) return 'complete';
      if (order < phaseIdx) return 'upcoming';
      // Currently in this phase
      if (i < sceneIndex) return 'complete';
      if (i === sceneIndex) return 'active';
      return 'upcoming';
    });
  };

  const introStatus: CircleStatus = phase === 'intro' ? 'active' : 'complete';
  const endStatus: CircleStatus = phase === 'end' ? 'active' : 'upcoming';

  return (
    <div
      className={`w-full flex items-start justify-center gap-3 md:gap-6 flex-wrap ${className}`}
    >
      <StepGroup title="Intro" statuses={[introStatus]} />
      <div className="hidden md:block flex-1 max-w-[3rem] h-px bg-gray-200 mt-3.5" />
      <StepGroup title="Content" statuses={sceneStatuses('content')} />
      <div className="hidden md:block flex-1 max-w-[3rem] h-px bg-gray-200 mt-3.5" />
      <StepGroup title="Aesthetics" statuses={sceneStatuses('aesthetics')} />
      <div className="hidden md:block flex-1 max-w-[3rem] h-px bg-gray-200 mt-3.5" />
      <StepGroup title="End" statuses={[endStatus]} />
    </div>
  );
}
