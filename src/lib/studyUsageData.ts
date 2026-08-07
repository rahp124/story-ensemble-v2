import { downloadObjectAsJson } from '@/lib/utils';
import type { StoryboardNodeData } from '@/types';
import type { Node } from 'reactflow';

export type StudyUsageEvent = {
  timestamp: string;
  initiator: 'user' | 'system';
  type: string;
  data: Record<string, unknown>;
};

export type StudyUsageExport = {
  exportedAt: string;
  storyboardId: string;
  storyboardTitle: string;
  designTopic: string | null;
  priorExperience: 'yes' | 'no' | null;
  accessId: string | null;
  flow: 'user' | 'designer';
  selectedVariantId: string | null;
  events: StudyUsageEvent[];
  frames: Array<{
    frameIndex: number;
    frameType: string;
    caption?: string;
    contentAnswers?: Record<string, string>;
    reflectionAnswers?: Record<string, string>;
    aestheticNotes?: Record<string, string>;
    updateHistory?: unknown[];
  }>;
};

type StoredStudyEvent = {
  timestamp?: string;
  initiator: 'user' | 'system';
  type: string;
  count: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};

type AddStudyEventFn = (event: Omit<StoredStudyEvent, 'timestamp'>) => void;

export function normalizeStudyEvent(event: StoredStudyEvent): StudyUsageEvent {
  return {
    timestamp: event.timestamp ?? '',
    initiator: event.initiator,
    type: event.type,
    data: event.data ?? {}
  };
}

export function buildStudyUsageExport(
  node: Node<StoryboardNodeData>,
  studyEvents: StoredStudyEvent[],
  meta: {
    designTopic: string | null;
    priorExperience: 'yes' | 'no' | null;
    accessId?: string | null;
    selectedVariantId?: string | null;
  }
): StudyUsageExport {
  const { storyboard } = node.data;

  return {
    exportedAt: new Date().toISOString(),
    storyboardId: node.id,
    storyboardTitle: storyboard.title,
    designTopic: meta.designTopic,
    priorExperience: meta.priorExperience,
    accessId: meta.accessId ?? null,
    flow: meta.selectedVariantId ? 'designer' : 'user',
    selectedVariantId: meta.selectedVariantId ?? null,
    events: studyEvents.map(normalizeStudyEvent),
    frames: storyboard.outline.map((frame, frameIndex) => ({
      frameIndex,
      frameType: frame.frameType,
      caption: frame.caption,
      contentAnswers: frame.contentAnswers,
      reflectionAnswers: frame.reflectionAnswers,
      aestheticNotes: frame.aestheticNotes,
      updateHistory: frame.updateHistory
    }))
  };
}

export function studyUsageDownloadBasename(exportData: StudyUsageExport): string {
  const downloadEvent = [...exportData.events]
    .reverse()
    .find((e) => e.type === 'DOWNLOAD_STORYBOARD');
  const iso = downloadEvent?.timestamp || exportData.exportedAt;
  const datePart = iso.slice(0, 10);
  return `${datePart}_${exportData.storyboardId}`;
}

export function downloadStudyUsageData(exportData: StudyUsageExport): void {
  downloadObjectAsJson(exportData, studyUsageDownloadBasename(exportData));
}

export function logSystemPanelGeneration(
  addStudyEvent: AddStudyEventFn,
  payload: {
    storyboardId: string;
    frameIndex: number;
    frameType: string;
    stage: 'content' | 'aesthetic';
    caption: string;
    captionChanged: boolean;
    imagePrompt: string;
    contentAnswers: Record<string, string>;
    reflectionAnswers?: Record<string, string>;
    aestheticNotes?: Record<string, string>;
    referenceCaption?: string;
    createFromScratch: boolean;
    hasReferenceImage: boolean;
  }
): void {
  addStudyEvent({
    initiator: 'system',
    type: 'SYSTEM_GENERATE_PANEL',
    count: 1,
    data: payload
  });
}

export function logSystemRegenerateStoryboardFrame(
  addStudyEvent: AddStudyEventFn,
  payload: {
    storyboardId: string;
    frameIndex: number;
    frameType: string;
    caption: string;
    imagePrompt: string;
    negativePrompt: string;
    artStyle: string;
    anchorImageUsed: boolean;
  }
): void {
  addStudyEvent({
    initiator: 'system',
    type: 'SYSTEM_REGENERATE_STORYBOARD_FRAME',
    count: 1,
    data: payload
  });
}
