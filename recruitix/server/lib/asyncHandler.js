// Express 4 doesn't forward rejected promises from async handlers to the error middleware —
// without this, a thrown/rejected error (e.g. a Mongo failure) just hangs the request forever
// instead of returning a clean 500.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
