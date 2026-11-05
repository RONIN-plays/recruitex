// Verifying an ID token only checks its signature against Google's public certs plus the aud/iss
// claims — it doesn't call any authenticated Firebase API — so this needs nothing beyond the
// project ID, no service-account credentials required.
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'recruitex-7557c';

// Verified directly against Firebase's published JWKS via `jose`, rather than through
// firebase-admin/auth: that path pulls in jwks-rsa, whose latest published version (4.1.0, as of
// writing) declares jose@^6 as a dependency but still does a synchronous require() of it
// internally — jose 6 ships ESM-only, so that require() throws ERR_REQUIRE_ESM on every call and
// verification always fails. It's a bug in jwks-rsa itself, not something a version bump on our
// side fixes. `jose` works fine here since it's loaded via a real dynamic import() instead.
// See: https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
const GOOGLE_SECURETOKEN_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let jwks = null;

/** Verifies a Firebase Auth ID token (from the client's signInWithPopup(googleProvider) call) and returns its decoded claims. Throws if invalid/expired. */
export async function verifyGoogleIdToken(idToken) {
  const { createRemoteJWKSet, jwtVerify } = await import('jose');
  if (!jwks) jwks = createRemoteJWKSet(new URL(GOOGLE_SECURETOKEN_JWKS_URL));

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID,
  });

  // Firebase ID tokens always carry a non-empty `sub` (the Firebase uid) — this is the one extra
  // check Firebase's own docs call out beyond issuer/audience/signature/expiry, which jwtVerify
  // already covers via the `issuer`/`audience` options and its own exp/iat handling.
  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('ID token has no subject claim.');
  }
  return payload;
}
