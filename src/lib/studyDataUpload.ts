import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import {
  studyUsageDownloadBasename,
  type StudyUsageExport
} from '@/lib/studyUsageData';

const FIRESTORE_DOC_LIMIT_BYTES = 1_048_576;
const DOC_SIZE_SAFETY_MARGIN = 0.9;

export async function uploadStudyUsageData(
  exportData: StudyUsageExport,
  embedImageDataUrl: string
): Promise<{ docId: string }> {
  const docId = studyUsageDownloadBasename(exportData);

  const payload = {
    ...exportData,
    image: embedImageDataUrl,
    imageMimeType: 'image/jpeg',
    createdAt: serverTimestamp()
  };

  const approxBytes = new Blob([JSON.stringify(payload)]).size;
  if (approxBytes > FIRESTORE_DOC_LIMIT_BYTES * DOC_SIZE_SAFETY_MARGIN) {
    throw new Error(
      `Study usage document is too large for Firestore (${approxBytes} bytes, limit ${FIRESTORE_DOC_LIMIT_BYTES}).`
    );
  }

  await setDoc(doc(getDb(), 'studyUsage', docId), payload);

  return { docId };
}
