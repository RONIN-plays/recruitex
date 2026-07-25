import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { isValidEmbedding, euclideanDistance, THRESHOLD } from '../lib/faceMatch.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = express.Router();

// Mirrors the (superseded) Supabase plan's enroll_face_embedding RPC.
router.post('/enroll', requireAuth, asyncHandler(async (req, res) => {
  const { embedding } = req.body ?? {};
  if (!isValidEmbedding(embedding)) {
    return res.status(400).json({ error: 'invalid_embedding', detail: 'embedding must be an array of 128 finite numbers' });
  }

  const db = await getDb();
  const userId = new ObjectId(req.userId);
  const now = new Date();

  // $inc on an upsert-insert starts from 0 -> 1, so this is correct for both first
  // enrollment and re-enrollment without a separate existence check.
  await db.collection('faceEmbeddings').updateOne(
    { userId },
    {
      $set: { embedding, model: 'face-api-facerecognition-128', updatedAt: now },
      $setOnInsert: { userId, createdAt: now },
      $inc: { sampleCount: 1 },
    },
    { upsert: true },
  );

  await db.collection('users').updateOne(
    { _id: userId },
    { $set: { faceEnrolled: true, enrollmentStatus: 'completed', updatedAt: now } },
  );

  res.json({ ok: true });
}));

// Identity-only distance check — used by the exam face gate and continuous proctoring re-verify.
// Always 1:1 (caller's own stored embedding), resolved from the JWT, never a client-supplied id.
router.post('/match', requireAuth, asyncHandler(async (req, res) => {
  const { embedding } = req.body ?? {};
  if (!isValidEmbedding(embedding)) {
    return res.status(400).json({ error: 'invalid_embedding' });
  }

  const db = await getDb();
  const stored = await db.collection('faceEmbeddings').findOne({ userId: new ObjectId(req.userId) });
  if (!stored) return res.status(404).json({ error: 'no_enrollment' });

  const distance = euclideanDistance(embedding, stored.embedding);
  res.json({ match: distance <= THRESHOLD, distance, threshold: THRESHOLD });
}));

export default router;
