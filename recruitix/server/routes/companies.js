import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = express.Router();

router.get('/companies', asyncHandler(async (_req, res) => {
  const db = await getDb();
  const companies = await db.collection('companies').find({ isActive: true }).sort({ name: 1 }).toArray();
  res.json({
    companies: companies.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      passThresholdPct: c.passThresholdPct,
      technicalDurationMin: c.technicalDurationMin,
      personalDurationMin: c.personalDurationMin,
      hrDurationMin: c.hrDurationMin,
    })),
  });
}));

router.get('/companies/:id', asyncHandler(async (req, res) => {
  let companyObjectId;
  try {
    companyObjectId = new ObjectId(req.params.id);
  } catch {
    return res.status(400).json({ error: 'invalid_input' });
  }
  const db = await getDb();
  const c = await db.collection('companies').findOne({ _id: companyObjectId });
  if (!c) return res.status(404).json({ error: 'not_found' });
  res.json({
    company: {
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      passThresholdPct: c.passThresholdPct,
      technicalDurationMin: c.technicalDurationMin,
      personalDurationMin: c.personalDurationMin,
      hrDurationMin: c.hrDurationMin,
    },
  });
}));

router.get('/question-bank', asyncHandler(async (req, res) => {
  const { companyId, round } = req.query;
  if (!companyId || !round) return res.status(400).json({ error: 'invalid_input', detail: 'companyId and round are required' });

  let companyObjectId;
  try {
    companyObjectId = new ObjectId(String(companyId));
  } catch {
    return res.status(400).json({ error: 'invalid_input', detail: 'companyId is not a valid id' });
  }

  const db = await getDb();
  const questions = await db.collection('questionBank').find({ companyId: companyObjectId, round }).toArray();
  res.json({
    questions: questions.map((q) => ({
      id: q._id.toString(),
      round: q.round,
      qtype: q.qtype,
      category: q.category ?? null,
      prompt: q.prompt,
      options: q.options ?? null,
      correctAnswer: q.correctAnswer ?? null,
      points: q.points,
    })),
  });
}));

export default router;
