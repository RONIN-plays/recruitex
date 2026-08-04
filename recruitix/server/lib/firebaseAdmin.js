import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Verifying an ID token only checks its signature against Google's public certs plus the aud/iss
// claims — it doesn't call any authenticated Firebase API — so this needs nothing beyond the
// project ID, no service-account credentials required.
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'recruitx-b3d63';

function getFirebaseApp() {
  const existing = getApps();
  return existing.length ? existing[0] : initializeApp({ projectId: PROJECT_ID });
}

/** Verifies a Firebase Auth ID token (from the client's signInWithPopup(googleProvider) call) and returns its decoded claims. Throws if invalid/expired. */
export async function verifyGoogleIdToken(idToken) {
  return getAuth(getFirebaseApp()).verifyIdToken(idToken);
}
