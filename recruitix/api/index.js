// Vercel serverless entry point — wraps the same Express app used for local dev
// (server/app.js). Express apps are plain (req, res) => {} handlers, so this works
// directly as a Vercel Node function; see vercel.json for the /api/(.*) rewrite that
// routes every API request here while preserving the original path.
import app from '../server/app.js';

export default app;
