export const EMBEDDING_LENGTH = 128;
// Euclidean "same person" cutoff for face-api.js's 128-d descriptors — same value used
// throughout the (superseded) Supabase plan's edge functions, carried over unchanged.
export const THRESHOLD = 0.5;

export function isValidEmbedding(value) {
  return (
    Array.isArray(value) &&
    value.length === EMBEDDING_LENGTH &&
    value.every((n) => typeof n === 'number' && Number.isFinite(n))
  );
}

export function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}
