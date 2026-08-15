import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb, getResumeBucket } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { parseResumePdf } from '../lib/resumeParser.js';
import { extractResumeProfile } from '../lib/resumeProfile.js';

const router = express.Router();

const MAX_RESUME_BYTES = 4 * 1024 * 1024; // 4MB raw PDF

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const db = await getDb();
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(req.userId) },
    { projection: { resumeFileName: 1, resumeUploadedAt: 1, resumeText: 1, resumeProfile: 1 } },
  );
  res.json({
    hasResume: Boolean(user?.resumeText),
    fileName: user?.resumeFileName ?? null,
    uploadedAt: user?.resumeUploadedAt ?? null,
    textPreview: user?.resumeText ? user.resumeText.slice(0, 240) : null,
    profile: user?.resumeProfile ?? null,
  });
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { fileName, fileBase64 } = req.body ?? {};
  if (!fileName || typeof fileBase64 !== 'string' || !fileBase64) {
    return res.status(400).json({ error: 'invalid_input', detail: 'fileName and fileBase64 are required.' });
  }
  if (!fileName.toLowerCase().endsWith('.pdf')) {
    return res.status(400).json({ error: 'invalid_input', detail: 'Only PDF resumes are accepted.' });
  }

  const buffer = Buffer.from(fileBase64, 'base64');
  if (buffer.length === 0 || buffer.length > MAX_RESUME_BYTES) {
    return res.status(400).json({ error: 'invalid_input', detail: 'PDF must be non-empty and under 4MB.' });
  }
  if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return res.status(400).json({ error: 'invalid_input', detail: 'File is not a valid PDF.' });
  }

  let resumeText;
  try {
    resumeText = await parseResumePdf(buffer);
  } catch (err) {
    return res.status(400).json({ error: 'unparseable_pdf', detail: err.message });
  }
  const resumeProfile = await extractResumeProfile(resumeText);

  const db = await getDb();
  const userId = new ObjectId(req.userId);
  const existing = await db.collection('users').findOne({ _id: userId }, { projection: { resumeFileId: 1 } });

  const bucket = await getResumeBucket();
  const uploadStream = bucket.openUploadStream(`${req.userId}_${Date.now()}_${fileName}`, { contentType: 'application/pdf' });
  await new Promise((resolve, reject) => {
    uploadStream.end(buffer, (err) => (err ? reject(err) : resolve()));
  });

  // Old file is superseded by this upload — clean it up rather than leaking storage, but a
  // failure to delete it must not fail the upload that already succeeded.
  if (existing?.resumeFileId) {
    await bucket.delete(existing.resumeFileId).catch((err) => console.error('Failed to delete old resume file:', err));
  }

  const uploadedAt = new Date();
  await db.collection('users').updateOne(
    { _id: userId },
    {
      $set: {
        resumeFileId: uploadStream.id,
        resumeFileName: fileName,
        resumeText,
        resumeProfile,
        resumeUploadedAt: uploadedAt,
        updatedAt: uploadedAt,
      },
    },
  );

  res.json({ hasResume: true, fileName, uploadedAt, textPreview: resumeText.slice(0, 240), profile: resumeProfile });
}));

export default router;
