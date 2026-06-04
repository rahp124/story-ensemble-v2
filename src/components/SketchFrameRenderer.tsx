import { Icon } from '@iconify/react';
import { SketchActor, SketchFrameData, SketchObject } from '@/types';

interface SketchFrameRendererProps {
  frame: SketchFrameData;
}

const SVG_WIDTH = 480;
const SVG_HEIGHT = 320;
const HEADER_ZONE = { top: 20, bottom: 80 };
const VISUAL_ZONE = { top: 105, bottom: 230 };
const CAPTION_ZONE = { top: 245, bottom: 305 };
const CONTEXT_ZONE = {
  actor: { x: 240, y: 165 },
  leftCue: { x: 150, y: 175 },
  rightCue: { x: 330, y: 175 }
};
const ACTION_ZONE = {
  actor: { x: 30, y: 92 },
  path: { x: 132, y: 120 },
  target: { x: 320, y: 88 },
  chips: { x: 94, y: 214 }
};
const HEADER_HEIGHT = HEADER_ZONE.bottom - HEADER_ZONE.top + 2;
const FOOTER_TOP = CAPTION_ZONE.top + 13;

const FRAME_THEME: Record<
  SketchFrameData['frameType'],
  { accent: string; tint: string; chip: string; label: string }
> = {
  Context: { accent: '#2563eb', tint: '#eff6ff', chip: '#dbeafe', label: 'Context' },
  Problem: { accent: '#dc2626', tint: '#fef2f2', chip: '#fee2e2', label: 'Problem' },
  Action: { accent: '#7c3aed', tint: '#f5f3ff', chip: '#ede9fe', label: 'Action' },
  Resolution: { accent: '#059669', tint: '#ecfdf5', chip: '#d1fae5', label: 'Resolution' }
};

const ICONS = {
  person: 'material-symbols:person-rounded',
  walk: 'material-symbols:directions-walk-rounded',
  access: 'material-symbols:accessibility-new-rounded',
  wheelchair: 'material-symbols:accessible-rounded',
  school: 'material-symbols:school-rounded',
  food: 'material-symbols:restaurant-rounded',
  menu: 'material-symbols:menu-book-rounded',
  line: 'material-symbols:groups-rounded',
  time: 'material-symbols:schedule-rounded',
  store: 'material-symbols:storefront-rounded',
  phone: 'material-symbols:smartphone-rounded',
  bag: 'material-symbols:shopping-bag-rounded',
  check: 'material-symbols:check-circle-rounded',
  warning: 'material-symbols:warning-rounded',
  x: 'material-symbols:close-rounded',
  arrow: 'material-symbols:arrow-forward-rounded',
  search: 'material-symbols:manage-search-rounded',
  lowEnergy: 'material-symbols:schedule-rounded',
  hand: 'material-symbols:touch-app-rounded',
  class: 'material-symbols:school-rounded'
} as const;

function clampText(text: string, maxLength: number) {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 1))}…` : text;
}

function wrapText(text: string, maxWidth: number, maxLines = 3) {
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

function renderIcon(icon: string, size = 42, color = '#0f172a') {
  return <Icon icon={icon} width={size} height={size} style={{ color }} />;
}

function getMainActor(frame: SketchFrameData) {
  return frame.actors[0];
}

function getPrimaryObject(frame: SketchFrameData) {
  const keywords = ['quick serve', 'pickup', 'kiosk', 'food', 'meal', 'menu', 'clock', 'time', 'class', 'school', 'line', 'queue', 'crowd', 'phone', 'app', 'bag', 'box'];
  const scored = [...frame.objects].map((object) => {
    const text = `${object.type} ${object.label || ''} ${object.description || ''} ${frame.settingLabel} ${frame.caption}`.toLowerCase();
    const score = keywords.reduce((sum, keyword, idx) => (text.includes(keyword) ? sum + (keywords.length - idx) : sum), 0);
    return { object, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.object || frame.objects[0];
}

function getActorIcon(actor?: SketchActor) {
  if (actor?.mobility === 'wheelchair') return ICONS.wheelchair;
  if (actor?.mobility === 'cane') return ICONS.access;
  if (actor?.posture === 'walking') return ICONS.walk;
  return ICONS.person;
}

function getMainActorStatusIcon(frame: SketchFrameData, actor?: SketchActor) {
  const text = `${actor?.description || ''} ${(frame.userCorrections ?? []).join(' ')}`.toLowerCase();
  if (!text) return '';

  if (/tired|rushed|stressed|overwhelmed/.test(text)) return ICONS.lowEnergy;
  if (/frustrated|anxious/.test(text)) return ICONS.warning;
  if (/confused|lost|unsure/.test(text)) return ICONS.search;
  return '';
}

function getMainActorStatusPosition(frameType: SketchFrameData['frameType']) {
  if (frameType === 'Context') return { x: CONTEXT_ZONE.actor.x + 42, y: CONTEXT_ZONE.actor.y - 36 };
  if (frameType === 'Problem') return { x: 106, y: 84 };
  if (frameType === 'Action') return { x: ACTION_ZONE.actor.x + 52, y: ACTION_ZONE.actor.y - 8 };
  return { x: 144, y: 86 };
}

function semanticObjectIcon(frame: SketchFrameData, object?: SketchObject) {
  const text = `${object?.type || ''} ${object?.label || ''} ${object?.description || ''} ${frame.settingLabel} ${frame.caption}`.toLowerCase();

  if (/class|lecture|school|classroom/.test(text)) return ICONS.school;
  if (/student center|cafeteria|food|lunch|meal|eat|dining|restaurant/.test(text)) return ICONS.food;
  if (/menu|options|choices|board/.test(text)) return ICONS.menu;
  if (/line|queue|crowd/.test(text)) return ICONS.line;
  if (/clock|time|deadline|before class|late/.test(text)) return ICONS.time;
  if (/quick serve|pickup|kiosk|storefront|serve/.test(text)) return ICONS.store;
  if (/app|phone|mobile/.test(text)) return ICONS.phone;
  if (/bag|box|grab-and-go|grab and go/.test(text)) return ICONS.bag;
  if (/door/.test(text)) return 'material-symbols:door-open-rounded';
  if (/stairs|ramp/.test(text)) return 'material-symbols:stairs-rounded';
  if (/counter/.test(text)) return ICONS.food;
  return ICONS.menu;
}

function getMainCueIcon(frame: SketchFrameData) {
  const text = `${frame.settingLabel} ${frame.caption} ${frame.thoughtBubble || ''}`.toLowerCase();
  if (/time|clock|before class|deadline|late/.test(text)) return ICONS.time;
  if (/menu|options|choices/.test(text)) return ICONS.menu;
  if (/search|look|check|consider/.test(text)) return ICONS.search;
  if (/meal|food|lunch|eat/.test(text)) return ICONS.food;
  return ICONS.search;
}

function getSupportingCues(frame: SketchFrameData) {
  const text = `${frame.settingLabel} ${frame.caption} ${frame.thoughtBubble || ''}`.toLowerCase();
  const cues: string[] = [];

  if (/line|queue|crowd/.test(text)) cues.push(ICONS.line);
  if (/time|clock|late|before class|deadline/.test(text)) cues.push(ICONS.time);
  if (/menu|options|choices/.test(text)) cues.push(ICONS.menu);
  if (/food|meal|lunch|eat/.test(text)) cues.push(ICONS.food);
  if (/phone|app|mobile/.test(text)) cues.push(ICONS.phone);

  return [...new Set(cues)].slice(0, 2);
}

function IconCard({
  icon,
  accent,
  x,
  y,
  size = 42,
  glow = false,
  dimmed = false
}: {
  icon: string;
  accent: string;
  x: number;
  y: number;
  size?: number;
  glow?: boolean;
  dimmed?: boolean;
}) {
  return (
    <g transform={`translate(${x}, ${y})`} opacity={dimmed ? 0.45 : 1}>
      {glow ? <circle cx={size / 2} cy={size / 2} r={size * 0.62} fill={accent} opacity="0.08" /> : null}
      {renderIcon(icon, size, accent)}
    </g>
  );
}

function Badge({ icon, accent, x, y, width = 88 }: { icon: string; accent: string; x: number; y: number; width?: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={0} y={0} width={width} height={24} rx={12} fill="#ffffff" stroke={accent} strokeWidth="1" />
      <g transform="translate(7, 4)">{renderIcon(icon, 16, accent)}</g>
    </g>
  );
}

function renderContextLayout({
  frame,
  theme,
  actorIcon,
  targetIcon,
  cues
}: {
  frame: SketchFrameData;
  theme: (typeof FRAME_THEME)[SketchFrameData['frameType']];
  actorIcon: string;
  targetIcon: string;
  cues: string[];
}) {
  const mainCue = cues[0] || getMainCueIcon(frame);

  return (
    <g>
      <rect x={30} y={VISUAL_ZONE.top + 7} width={420} height={108} rx={20} fill="#ffffff" opacity="0.9" stroke={theme.accent} strokeWidth="1" />
      <line
        x1={72}
        y1={CONTEXT_ZONE.actor.y + 10}
        x2={408}
        y2={CONTEXT_ZONE.actor.y + 10}
        stroke={theme.accent}
        strokeOpacity="0.14"
        strokeWidth="2"
        strokeDasharray="6 8"
      />

      <g transform={`translate(${CONTEXT_ZONE.actor.x}, ${CONTEXT_ZONE.actor.y})`}>
        <circle cx={0} cy={0} r={44} fill={theme.chip} opacity="0.5" />
        <IconCard icon={actorIcon} accent={theme.accent} x={-24} y={-24} size={48} glow />
      </g>

      <g transform={`translate(${CONTEXT_ZONE.leftCue.x}, ${CONTEXT_ZONE.leftCue.y})`}>
        <circle cx={0} cy={0} r={31} fill="#ffffff" stroke={theme.accent} strokeOpacity="0.22" strokeWidth="1" />
        <IconCard icon={targetIcon} accent={theme.accent} x={-18} y={-18} size={36} />
      </g>

      <g transform={`translate(${CONTEXT_ZONE.rightCue.x}, ${CONTEXT_ZONE.rightCue.y})`}>
        <circle cx={0} cy={0} r={31} fill="#ffffff" stroke={theme.accent} strokeOpacity="0.22" strokeWidth="1" />
        <IconCard icon={mainCue} accent={theme.accent} x={-17} y={-17} size={34} />
      </g>
    </g>
  );
}

function renderProblemLayout({
  theme,
  actorIcon,
  targetIcon,
  cues
}: {
  theme: (typeof FRAME_THEME)[SketchFrameData['frameType']];
  actorIcon: string;
  targetIcon: string;
  cues: string[];
}) {
  return (
    <g>
      <g transform="translate(30, 92)">
        <IconCard icon={actorIcon} accent={theme.accent} x={0} y={0} size={62} glow />
      </g>

      <g transform="translate(182, 84)">
        <circle cx={44} cy={44} r={34} fill={theme.chip} opacity="0.9" />
        <IconCard icon={ICONS.warning} accent={theme.accent} x={20} y={20} size={48} glow />
        <g transform="translate(20, 90)">
          <Badge icon={ICONS.x} accent={theme.accent} x={0} y={0} width={48} />
        </g>
      </g>

      <g transform="translate(330, 96)">
        <IconCard icon={targetIcon} accent={theme.accent} x={0} y={0} size={56} dimmed />
      </g>

      <g transform="translate(68, 214)">
        {cues.slice(0, 2).map((cue, index) => (
          <g key={`${cue}-${index}`} transform={`translate(${index * 104}, 0)`}>
            <Badge icon={cue} accent={theme.accent} x={0} y={0} width={96} />
          </g>
        ))}
      </g>
    </g>
  );
}

function renderActionLayout({
  theme,
  actorIcon,
  targetIcon
}: {
  theme: (typeof FRAME_THEME)[SketchFrameData['frameType']];
  actorIcon: string;
  targetIcon: string;
}) {
  return (
    <g>
      <g transform={`translate(${ACTION_ZONE.actor.x}, ${ACTION_ZONE.actor.y})`}>
        <IconCard icon={actorIcon} accent={theme.accent} x={0} y={0} size={62} glow />
      </g>

      <g transform={`translate(${ACTION_ZONE.path.x}, ${ACTION_ZONE.path.y})`}>
        <line x1={0} y1={0} x2={144} y2={0} stroke={theme.accent} strokeWidth="3" markerEnd="url(#story-arrow)" />
        <g transform="translate(56, -16)">
          <IconCard icon={ICONS.hand} accent={theme.accent} x={0} y={0} size={30} />
        </g>
      </g>

      <g transform={`translate(${ACTION_ZONE.target.x}, ${ACTION_ZONE.target.y})`}>
        <IconCard icon={targetIcon} accent={theme.accent} x={0} y={0} size={72} glow />
      </g>

      <g transform={`translate(${ACTION_ZONE.chips.x}, ${ACTION_ZONE.chips.y})`}>
        <Badge icon={ICONS.arrow} accent={theme.accent} x={0} y={0} width={84} />
        <g transform="translate(98, 0)">
          <Badge icon={targetIcon} accent={theme.accent} x={0} y={0} width={94} />
        </g>
      </g>
    </g>
  );
}

function renderResolutionLayout({
  theme,
  actorIcon,
  targetIcon,
  cues
}: {
  theme: (typeof FRAME_THEME)[SketchFrameData['frameType']];
  actorIcon: string;
  targetIcon: string;
  cues: string[];
}) {
  const support = cues[0] || ICONS.time;

  return (
    <g>
      <g transform="translate(100, 98)">
        <IconCard icon={actorIcon} accent={theme.accent} x={0} y={0} size={64} glow />
      </g>

      <g transform="translate(188, 96)">
        <IconCard icon={targetIcon} accent={theme.accent} x={0} y={0} size={66} glow />
      </g>

      <g transform="translate(268, 80)">
        <IconCard icon={ICONS.check} accent={theme.accent} x={0} y={0} size={64} />
      </g>

      <g transform="translate(86, 214)">
        <Badge icon={support} accent={theme.accent} x={0} y={0} width={88} />
        <g transform="translate(98, 0)">
          <Badge icon={ICONS.class} accent={theme.accent} x={0} y={0} width={88} />
        </g>
        <g transform="translate(196, 0)">
          <Badge icon={ICONS.food} accent={theme.accent} x={0} y={0} width={88} />
        </g>
      </g>
    </g>
  );
}

export default function SketchFrameRenderer({ frame }: SketchFrameRendererProps) {
  const theme = FRAME_THEME[frame.frameType];
  const mainActor = getMainActor(frame);
  const primaryObject = getPrimaryObject(frame);
  const actorIcon = getActorIcon(mainActor);
  const targetIcon = semanticObjectIcon(frame, primaryObject);
  const cues = getSupportingCues(frame);
  const statusIcon = getMainActorStatusIcon(frame, mainActor);
  const statusPosition = getMainActorStatusPosition(frame.frameType);
  const captionLines = wrapText(frame.caption, 60, 3);

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="w-full h-full bg-white border border-gray-300 rounded"
      style={{ minWidth: '480px', minHeight: '320px' }}
      role="img"
      aria-label={`${frame.frameType} storyboard sketch`}
    >
      <defs>
        <marker id="story-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill={theme.accent} />
        </marker>
        <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.10" />
        </filter>
      </defs>

      <rect x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} rx={18} fill="#ffffff" />
      <rect x={10} y={10} width={SVG_WIDTH - 20} height={SVG_HEIGHT - 20} rx={16} fill={theme.tint} stroke={theme.accent} strokeWidth="1.2" />

      <g>
        <rect x={18} y={HEADER_ZONE.top - 6} width={SVG_WIDTH - 36} height={HEADER_HEIGHT} rx={14} fill="#ffffff" opacity="0.95" />
        <text x={32} y={HEADER_ZONE.top + 11} fontSize="15" fontWeight="700" fill="#0f172a">
          {clampText(frame.settingLabel || 'Scene', 24)}
        </text>
        <g transform={`translate(${SVG_WIDTH - 146}, ${HEADER_ZONE.top - 2})`}>
          <rect x={0} y={0} width={122} height={24} rx={12} fill={theme.chip} stroke={theme.accent} strokeWidth="1" />
          <text x={61} y={16} textAnchor="middle" fontSize="10.2" fontWeight="700" fill={theme.accent}>
            {theme.label}
          </text>
        </g>
      </g>

      <line x1={24} y1={HEADER_ZONE.bottom} x2={SVG_WIDTH - 24} y2={HEADER_ZONE.bottom} stroke="#dbe3ef" strokeWidth="1" />

      {frame.frameType === 'Context' ? renderContextLayout({ frame, theme, actorIcon, targetIcon, cues }) : null}
      {frame.frameType === 'Problem' ? renderProblemLayout({ theme, actorIcon, targetIcon, cues }) : null}
      {frame.frameType === 'Action' ? renderActionLayout({ theme, actorIcon, targetIcon }) : null}
      {frame.frameType === 'Resolution' ? renderResolutionLayout({ theme, actorIcon, targetIcon, cues }) : null}

      {statusIcon ? (
        <g transform={`translate(${statusPosition.x}, ${statusPosition.y})`}>
          <circle cx={0} cy={0} r={14} fill="#ffffff" stroke={theme.accent} strokeWidth="1" />
          <IconCard icon={statusIcon} accent={theme.accent} x={-8} y={-8} size={16} />
        </g>
      ) : null}

      <g>
        <rect x={18} y={FOOTER_TOP} width={SVG_WIDTH - 36} height={52} rx={14} fill="#ffffff" stroke="#dbe3ef" strokeWidth="1" />
        {captionLines.map((line, index) => (
          <text key={`${line}-${index}`} x={32} y={FOOTER_TOP + 18 + index * 12} fontSize="11" fill="#0f172a">
            {line}
          </text>
        ))}
      </g>
    </svg>
  );
}