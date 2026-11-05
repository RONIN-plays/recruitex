import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = express.Router();

router.use(requireAuth, requireRole('recruiter'));

const ROUND_KEYS = ['technical', 'personal', 'hr'];
const SUBMITTED_STATUSES = ['submitted', 'auto_submitted'];
const ACTIVE_STATUSES = ['face_gate_pending', 'pending_manual_review', 'in_progress'];

function roundStatus(sessionStatus) {
  if (SUBMITTED_STATUSES.includes(sessionStatus)) return 'completed';
  if (ACTIVE_STATUSES.includes(sessionStatus)) return 'in-progress';
  return sessionStatus;
}

const ROUND_DURATION_FIELD = { technical: 'technicalDurationMin', personal: 'personalDurationMin', hr: 'hrDurationMin' };
const LIVE_GRACE_MIN = 10;

// A session that was never submitted (candidate closed the tab, crashed, etc.) stays
// status: 'in_progress' forever — without this check it would show as "live" indefinitely,
// long after the candidate is gone, which is what made Live Monitoring look like it was
// displaying random/stale names.
function isSessionStillLive(session, company) {
  if (!session.startedAt) return false;
  const durationMin = company?.[ROUND_DURATION_FIELD[session.round]] ?? 60;
  const ageMs = Date.now() - new Date(session.startedAt).getTime();
  return ageMs <= (durationMin + LIVE_GRACE_MIN) * 60000;
}

// One combined snapshot of everything the recruiter dashboard needs, computed straight from
// live MongoDB collections (users/examSessions/violations) rather than the old Firebase
// userActivity feed, which nothing in the current candidate flow ever writes to. The frontend
// polls this on an interval for a near-real-time view.
router.get('/overview', asyncHandler(async (req, res) => {
  const db = await getDb();
  const [candidateUsers, sessions, allViolations, companies] = await Promise.all([
    db.collection('users').find({ role: 'candidate' }).sort({ createdAt: -1 }).toArray(),
    db.collection('examSessions').find({}).sort({ createdAt: -1 }).toArray(),
    db.collection('violations').find({}).sort({ createdAt: -1 }).toArray(),
    db.collection('companies').find({}).toArray(),
  ]);

  const companyById = new Map(companies.map((c) => [c._id.toString(), c]));
  const companyNameById = new Map(companies.map((c) => [c._id.toString(), c.name]));
  const userNameById = new Map(candidateUsers.map((u) => [u._id.toString(), u.displayName || u.email]));

  const sessionsByUser = new Map();
  for (const s of sessions) {
    const key = s.userId.toString();
    if (!sessionsByUser.has(key)) sessionsByUser.set(key, []);
    sessionsByUser.get(key).push(s);
  }

  const violationCountByUser = new Map();
  for (const v of allViolations) {
    const key = v.userId.toString();
    violationCountByUser.set(key, (violationCountByUser.get(key) ?? 0) + 1);
  }

  const candidates = candidateUsers.map((u) => {
    const userSessions = sessionsByUser.get(u._id.toString()) ?? [];
    const rounds = {};
    let mostRecentSession = null;

    // userSessions is already newest-first, so the first hit per round is that round's latest attempt.
    for (const s of userSessions) {
      if (!mostRecentSession) mostRecentSession = s;
      if (!rounds[s.round]) {
        const company = companyById.get(s.companyId.toString());
        const abandoned = ACTIVE_STATUSES.includes(s.status) && !isSessionStillLive(s, company);
        rounds[s.round] = {
          status: abandoned ? 'abandoned' : roundStatus(s.status),
          pct: s[`${s.round}Pct`] ?? null,
          durationMin: s.startedAt && s.endedAt
            ? Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000)
            : null,
          updatedAt: s.endedAt ?? s.createdAt,
        };
      }
    }

    const pctValues = ROUND_KEYS.map((r) => rounds[r]?.pct).filter((p) => typeof p === 'number');
    const overallPct = pctValues.length ? Math.round(pctValues.reduce((a, b) => a + b, 0) / pctValues.length) : null;
    const completedRounds = ROUND_KEYS.filter((r) => rounds[r]?.status === 'completed').length;

    return {
      id: u._id.toString(),
      name: u.displayName || u.email.split('@')[0],
      email: u.email,
      registeredAt: u.createdAt,
      faceEnrolled: Boolean(u.faceEnrolled),
      appliedFor: mostRecentSession ? companyNameById.get(mostRecentSession.companyId.toString()) ?? null : null,
      technical: rounds.technical ?? null,
      personal: rounds.personal ?? null,
      hr: rounds.hr ?? null,
      overallPct,
      completedRounds,
      violationsCount: violationCountByUser.get(u._id.toString()) ?? 0,
    };
  });

  const totalCandidates = candidates.length;
  const completed = candidates.filter((c) => c.completedRounds === ROUND_KEYS.length).length;
  const inProgress = candidates.filter((c) => ROUND_KEYS.some((r) => c[r]?.status === 'in-progress')).length;

  const withScore = candidates.filter((c) => c.overallPct !== null);
  const passThreshold = companies[0]?.passThresholdPct ?? 60;
  const passed = withScore.filter((c) => c.overallPct >= passThreshold).length;
  const passRate = withScore.length ? Math.round((passed / withScore.length) * 100) : 0;

  const distribution = {
    excellent: withScore.filter((c) => c.overallPct >= 90).length,
    good: withScore.filter((c) => c.overallPct >= 80 && c.overallPct < 90).length,
    average: withScore.filter((c) => c.overallPct >= 70 && c.overallPct < 80).length,
    belowAverage: withScore.filter((c) => c.overallPct < 70).length,
  };

  const liveSessions = sessions
    .filter((s) => s.status === 'in_progress' && isSessionStillLive(s, companyById.get(s.companyId.toString())))
    .map((s) => ({
      sessionId: s._id.toString(),
      userId: s.userId.toString(),
      candidateName: userNameById.get(s.userId.toString()) ?? 'Unknown',
      round: s.round,
      company: companyNameById.get(s.companyId.toString()) ?? null,
      startedAt: s.startedAt,
      integrityScore: s.integrityScore,
    }));

  const recentViolations = allViolations.slice(0, 20).map((v) => ({
    id: v._id.toString(),
    userId: v.userId.toString(),
    userName: userNameById.get(v.userId.toString()) ?? 'Unknown',
    sessionId: v.sessionId.toString(),
    type: v.type,
    severity: v.severity,
    message: v.message,
    createdAt: v.createdAt,
  }));

  res.json({
    candidates,
    stats: { totalCandidates, completed, inProgress, passRate, distribution },
    liveSessions,
    recentViolations,
  });
}));

// Per-round breakdown for one candidate: the actual questions asked, the answer they gave, and
// how each was marked — for Technical/HR this is a question-by-question list (joining that
// round's questionBank against examResponses); for the Live Interview (round 'personal', which
// has no question bank — it's a free-form Claude conversation) this is the full transcript plus
// the LLM's evaluation summary. Uses the *latest* session per round for this candidate, same
// "newest first, first hit per round wins" rule /overview already uses.
router.get('/candidates/:id', asyncHandler(async (req, res) => {
  const db = await getDb();
  let userId;
  try {
    userId = new ObjectId(req.params.id);
  } catch {
    return res.status(400).json({ error: 'invalid_input' });
  }

  const user = await db.collection('users').findOne({ _id: userId, role: 'candidate' });
  if (!user) return res.status(404).json({ error: 'not_found' });

  const [sessions, companies] = await Promise.all([
    db.collection('examSessions').find({ userId }).sort({ createdAt: -1 }).toArray(),
    db.collection('companies').find({}).toArray(),
  ]);
  const companyNameById = new Map(companies.map((c) => [c._id.toString(), c.name]));

  const latestByRound = {};
  for (const s of sessions) {
    if (!latestByRound[s.round]) latestByRound[s.round] = s;
  }

  function baseRoundInfo(session) {
    const company = companies.find((c) => c._id.toString() === session.companyId.toString());
    const abandoned = ACTIVE_STATUSES.includes(session.status) && !isSessionStillLive(session, company);
    return {
      status: abandoned ? 'abandoned' : roundStatus(session.status),
      pct: session[`${session.round}Pct`] ?? null,
      score: session[`${session.round}Score`] ?? null,
      company: companyNameById.get(session.companyId.toString()) ?? null,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
    };
  }

  // Technical / HR: question-by-question, joining this session's questionBank rows (the actual
  // question + rubric/correct answer, never shown to the candidate during the exam) against the
  // examResponses rows (the candidate's answer + the score it was actually given).
  async function buildQuestionRound(session) {
    if (!session) return null;
    const [responses, questions] = await Promise.all([
      db.collection('examResponses').find({ sessionId: session._id }).toArray(),
      db.collection('questionBank').find({ sessionId: session._id }).toArray(),
    ]);
    const questionById = new Map(questions.map((q) => [q._id.toString(), q]));

    const items = responses
      .map((r) => {
        const q = r.questionId ? questionById.get(r.questionId.toString()) : null;
        if (!q) return null;
        return {
          prompt: q.prompt,
          qtype: q.qtype,
          category: q.category ?? null,
          options: q.options ?? null,
          correctAnswer: q.correctAnswer ?? null,
          points: q.points,
          answer: r.answer,
          score: r.score,
        };
      })
      .filter(Boolean);

    return { ...baseRoundInfo(session), questions: items };
  }

  // Live Interview: no question bank — the "questions and answers" are the conversation itself,
  // plus the LLM's post-hoc evaluation (summary/strengths/areasToImprove) already computed at
  // /interview/finish time and stored on the session.
  async function buildPersonalRound(session) {
    if (!session) return null;
    const transcript = await db.collection('interviewTranscripts').findOne({ sessionId: session._id });
    const messages = transcript?.messages ?? [];
    // The very first message is always the synthetic "Begin the interview." prompt used
    // internally to kick off the LLM (see /interview/start) — not something the candidate
    // actually said, so showing it as their message would misrepresent the record.
    const candidateFacing = messages[0]?.role === 'user' && messages[0]?.text === 'Begin the interview.' ? messages.slice(1) : messages;
    return {
      ...baseRoundInfo(session),
      feedback: session.personalFeedback ?? null,
      transcript: candidateFacing.map((m) => ({ role: m.role, text: m.text, createdAt: m.createdAt })),
    };
  }

  const [technical, personal, hr] = await Promise.all([
    buildQuestionRound(latestByRound.technical),
    buildPersonalRound(latestByRound.personal),
    buildQuestionRound(latestByRound.hr),
  ]);

  res.json({
    candidate: {
      id: user._id.toString(),
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
    },
    rounds: { technical, personal, hr },
  });
}));

export default router;
