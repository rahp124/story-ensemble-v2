import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env['VITE_FIREBASE_API_KEY'],
  authDomain: import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'],
  projectId: import.meta.env['VITE_FIREBASE_PROJECT_ID'],
  messagingSenderId: import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'],
  appId: import.meta.env['VITE_FIREBASE_APP_ID']
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

let app: FirebaseApp | undefined;
let firestore: Firestore | undefined;

export function getDb(): Firestore {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Set the VITE_FIREBASE_* env vars.');
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  if (!firestore) {
    firestore = getFirestore(app);
  }
  return firestore;
}
