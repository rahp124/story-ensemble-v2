import { EVALUATE_QUESTIONS } from '@/content/evaluateCopy';

export type EvaluateSource = 'user' | 'designer';

export type EvaluateFieldDef = {
  key: string;
  label: string;
  encoding?: string;
};

export type EvaluateViewJson = {
  view: string;
  exportedAt: string;
  accessIdFilter?: string;
  fields: EvaluateFieldDef[];
  rows: Record<string, string>[];
};

export type EvaluateItemField = {
  key: string;
  label: string;
  value: string;
};

export type EvaluateItem = {
  id: string;
  source: EvaluateSource;
  accessId: string;
  imageSrc: string;
  fields: EvaluateItemField[];
  metadata: Record<string, string>;
};

const DESIGNER_IMAGE_DIR = `${import.meta.env.BASE_URL}storyboards/designer_example/`;

function resolveImageSrc(
  value: string,
  encoding: string | undefined
): string {
  if (!value) return '';
  if (encoding === 'base64') {
    return value.startsWith('data:')
      ? value
      : `data:image/jpeg;base64,${value}`;
  }
  if (encoding === 'filename') {
    return `${DESIGNER_IMAGE_DIR}${value}`;
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  if (value.startsWith('data:')) {
    return value;
  }
  return `${DESIGNER_IMAGE_DIR}${value}`;
}

function buildLabelMap(fields: EvaluateFieldDef[]): Map<string, string> {
  return new Map(fields.map((f) => [f.key, f.label]));
}

function buildEncodingMap(fields: EvaluateFieldDef[]): Map<string, string> {
  return new Map(
    fields
      .filter((f) => f.encoding)
      .map((f) => [f.key, f.encoding as string])
  );
}

function rowToItem(
  source: EvaluateSource,
  row: Record<string, string>,
  labelMap: Map<string, string>,
  encodingMap: Map<string, string>,
  displayKeys: string[]
): EvaluateItem {
  const accessId = row.access_id ?? '';
  const imageKey = 'storyboard_img';
  const imageSrc = resolveImageSrc(
    row[imageKey] ?? '',
    encodingMap.get(imageKey)
  );

  const metadata: Record<string, string> = {};
  if (source === 'designer' && row.storyboard_chosen) {
    metadata.storyboard_chosen = row.storyboard_chosen;
  }

  const fields: EvaluateItemField[] = displayKeys
    .filter((key) => key in row)
    .map((key) => ({
      key,
      label: labelMap.get(key) ?? key,
      value: row[key] ?? ''
    }));

  return {
    id: `${source}:${accessId}`,
    source,
    accessId,
    imageSrc,
    fields,
    metadata
  };
}

export async function fetchEvaluateData(): Promise<{
  user: EvaluateViewJson;
  designer: EvaluateViewJson;
}> {
  const base = `${import.meta.env.BASE_URL}evaluate/`;
  const [userRes, designerRes] = await Promise.all([
    fetch(`${base}view-user.json`),
    fetch(`${base}view-designer.json`)
  ]);

  if (!userRes.ok) {
    throw new Error(`Failed to load view-user.json (${userRes.status})`);
  }
  if (!designerRes.ok) {
    throw new Error(`Failed to load view-designer.json (${designerRes.status})`);
  }

  const [user, designer] = await Promise.all([
    userRes.json() as Promise<EvaluateViewJson>,
    designerRes.json() as Promise<EvaluateViewJson>
  ]);

  return { user, designer };
}

export function buildEvaluateItems(
  user: EvaluateViewJson,
  designer: EvaluateViewJson
): EvaluateItem[] {
  const userLabels = buildLabelMap(user.fields);
  const userEncodings = buildEncodingMap(user.fields);
  const designerLabels = buildLabelMap(designer.fields);
  const designerEncodings = buildEncodingMap(designer.fields);

  const userKeys = EVALUATE_QUESTIONS.itemFields.user;
  const designerKeys = EVALUATE_QUESTIONS.itemFields.designer;

  const userItems = user.rows.map((row) =>
    rowToItem('user', row, userLabels, userEncodings, userKeys)
  );
  const designerItems = designer.rows.map((row) =>
    rowToItem('designer', row, designerLabels, designerEncodings, designerKeys)
  );

  return [...userItems, ...designerItems];
}

/** Deterministic seeded shuffle (Fisher-Yates). Same seed → same order. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }

  const random = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function prepareShuffledItems(
  user: EvaluateViewJson,
  designer: EvaluateViewJson,
  accessId: string
): EvaluateItem[] {
  const items = buildEvaluateItems(user, designer);
  return seededShuffle(items, accessId);
}
