import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { toUserDto } from '../lib/sanitize.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = express.Router();
const TOKEN_EXPIRY = '7d';

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

router.post('/signup', asyncHandler(async (req, res) => {
  const { name, email, dateOfBirth, password } = req.body ?? {};
  if (!name || !email || !dateOfBirth || !password || password.length < 6) {
    return res.status(400).json({ error: 'invalid_input', detail: 'name, email, dateOfBirth, and a password of 6+ characters are required.' });
  }

  const db = await getDb();
  const users = db.collection('users');

  const existing = await users.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: 'email_taken' });

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();
  const doc = {
    email: email.toLowerCase(),
    passwordHash,
    displayName: name,
    dateOfBirth,
    role: 'candidate',
    faceEnrolled: false,
    enrollmentStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  const { insertedId } = await users.insertOne(doc);
  doc._id = insertedId;

  res.status(201).json({ token: issueToken(doc), user: toUserDto(doc) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'invalid_input' });

  const db = await getDb();
  const user = await db.collection('users').findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  res.json({ token: issueToken(user), user: toUserDto(user) });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const db = await getDb();
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
  if (!user) return res.status(404).json({ error: 'not_found' });
  res.json({ user: toUserDto(user) });
}));

export default router;
