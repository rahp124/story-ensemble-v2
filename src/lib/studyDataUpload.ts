import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { compressJpegDataUrl } from '@/lib/compressImage';
import {
  evaluateExportBasename,
  type EvaluateExport
} from '@/lib/evaluateExport';
import {
  studyUsageDownloadBasename,
  type StudyUsageExport
} from '@/lib/studyUsageData';

const FIRESTORE_DOC_LIMIT_BYTES = 1_048_576;
const DOC_SIZE_SAFETY_MARGIN = 0.9;

/** Recursively replace undefined with null so Firestore setDoc accepts the payload. */
function sanitizeForFirestore(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) {
    return value.map(sanitizeForFirestore);
  }
  if (typeof value === 'object') {
    // Leave Firestore FieldValue / Timestamp / other SDK objects as-is
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      return value;
    }
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      result[key] = sanitizeForFirestore(entry);
    }
    return result;
  }
  return value;
}

export async function uploadStudyUsageData(
  exportData: StudyUsageExport,
  embedImageDataUrl?: string
): Promise<{ docId: string }> {
  const docId = studyUsageDownloadBasename(exportData);

  const basePayload = sanitizeForFirestore({
    ...exportData,
    imageMimeType: 'image/jpeg',
    createdAt: serverTimestamp()
  }) as Record<string, unknown>;

  let payload = basePayload;
  if (embedImageDataUrl) {
    // Reserve space for the "image" key overhead in JSON ("image":"...").
    const baseBytes = new Blob([JSON.stringify({ ...basePayload, image: '' })]).size;
    const budget =
      Math.floor(FIRESTORE_DOC_LIMIT_BYTES * DOC_SIZE_SAFETY_MARGIN) - baseBytes;
    const image = await compressJpegDataUrl(embedImageDataUrl, budget);
    payload = { ...basePayload, image };
  }

  const approxBytes = new Blob([JSON.stringify(payload)]).size;
  if (approxBytes > FIRESTORE_DOC_LIMIT_BYTES * DOC_SIZE_SAFETY_MARGIN) {
    throw new Error(
      `Study usage document is too large for Firestore (${approxBytes} bytes, limit ${FIRESTORE_DOC_LIMIT_BYTES}).`
    );
  }

  await setDoc(doc(getDb(), 'studyUsage', docId), payload);

  return { docId };
}

export async function uploadEvaluateResults(
  exportData: EvaluateExport
): Promise<{ docId: string }> {
  const docId = evaluateExportBasename(exportData);

  const payload = sanitizeForFirestore({
    ...exportData,
    createdAt: serverTimestamp()
  }) as Record<string, unknown>;

  const approxBytes = new Blob([JSON.stringify(payload)]).size;
  if (approxBytes > FIRESTORE_DOC_LIMIT_BYTES * DOC_SIZE_SAFETY_MARGIN) {
    throw new Error(
      `Evaluation results document is too large for Firestore (${approxBytes} bytes, limit ${FIRESTORE_DOC_LIMIT_BYTES}).`
    );
  }

  await setDoc(doc(getDb(), 'evaluationResults', docId), payload);

  return { docId };
}
