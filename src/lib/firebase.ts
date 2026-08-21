/// <reference types="vite/client" />
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

/**
 * Nutri Guide - Firebase Architecture Foundation
 * Standard Firebase initialization configured with environment variable or json safety.
 */

const metaEnv = (import.meta as unknown as { env: Record<string, string | undefined> }).env || {};

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || metaEnv.VITE_FIREBASE_API_KEY,
  authDomain: firebaseConfigJson.authDomain || metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseConfigJson.projectId || metaEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfigJson.storageBucket || metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfigJson.messagingSenderId || metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseConfigJson.appId || metaEnv.VITE_FIREBASE_APP_ID
};

let app: FirebaseApp;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  console.log('[Firebase Auth Diagnostic] Initialized Firebase App and Auth with config:', {
    projectId: app.options.projectId,
    authDomain: app.options.authDomain,
    hasApiKey: Boolean(app.options.apiKey)
  });

  const dbId = firebaseConfigJson.firestoreDatabaseId;
  if (dbId && dbId !== '(default)') {
    db = getFirestore(app, dbId);
  } else {
    db = getFirestore(app);
  }
} catch (error) {
  console.warn("Firebase initialization deferred or running in fallback mode:", error);
}

export { app, auth, db };

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "AIzaSy_MOCK_KEY_FOR_INITIAL_BUILD" &&
    firebaseConfig.projectId
  );
};

