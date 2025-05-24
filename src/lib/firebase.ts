
import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Log environment variables at the module level to see what the server-side build sees
// console.log('[firebase.ts] Server-side process.env.NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
// console.log('[firebase.ts] Server-side process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Perform upfront checks for essential config values
if (!firebaseConfig.apiKey) {
  console.error('[firebase.ts] CRITICAL: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or empty.');
  // throw new Error('Firebase API Key is missing.'); // Optionally throw to halt
}
if (!firebaseConfig.projectId) {
  console.error('[firebase.ts] CRITICAL: Firebase Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID) is missing or empty.');
  // throw new Error('Firebase Project ID is missing.'); // Optionally throw
}
// Add more checks if needed for other critical keys

let app: FirebaseApp;
let authInstance: Auth; // Renamed to avoid conflict with exported 'auth'
let dbInstance: Firestore; // Renamed

try {
  if (getApps().length === 0) {
    console.log('[firebase.ts] Initializing Firebase app with config:', JSON.stringify(firebaseConfig)); // Log the actual config
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
    console.log('[firebase.ts] Using existing Firebase app.');
  }

  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
  console.log('[firebase.ts] Firebase initialized successfully.');

} catch (error) {
  console.error('[firebase.ts] CRITICAL ERROR initializing Firebase:', error);
  console.error('[firebase.ts] Firebase config used for initialization attempt:', JSON.stringify(firebaseConfig));
  // Re-throw the error or handle it gracefully if you want the app to show a custom message
  // For debugging, re-throwing helps see the original Firebase error clearly.
  throw error;
}

// Export the instances
export { app, authInstance as auth, dbInstance as db, firebaseConfig as fbConfigForDebug };
