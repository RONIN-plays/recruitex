import express from 'express';
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

export default router;
