// Offline fallback for the LLM-driven Technical / HR rounds: used when Groq question generation
// or grading fails (expired/missing key, rate limit, outage), so an exam can still be taken end to
// end. Questions come from the static seeded bank; grading is a simple rubric-keyword overlap.
import { TECHNICAL_QUESTIONS, HR_QUESTIONS } from '../seed.js';

const shuffled = (list) => [...list].sort(() => Math.random() - 0.5);

export function fallbackTechnicalQuestions() {
  return shuffled(TECHNICAL_QUESTIONS).map((q) => ({ ...q }));
}

export function fallbackHrQuestions() {
  return shuffled(HR_QUESTIONS).map((q) => ({ ...q }));
}

const tokens = (text) => (String(text).toLowerCase().match(/[a-z0-9²₂]{4,}/g) ?? []);

// Fraction of the rubric's keywords present in the answer, plus a small credit for a substantive
// attempt. Deliberately crude — real grading is the LLM's job; this just keeps scores meaningful.
export function fallbackGrade(question, answer) {
  const text = String(answer ?? '').trim();
  if (!text) return { scoreFraction: 0, feedback: '' };
  const rubric = [...new Set(tokens(question.correctAnswer))];
  const answerTokens = new Set(tokens(text));
  const overlap = rubric.length ? rubric.filter((t) => answerTokens.has(t)).length / rubric.length : 0;
  const effort = Math.min(1, text.length / 120);
  return { scoreFraction: Math.min(1, 0.3 * effort + 0.7 * Math.min(1, overlap * 1.5)), feedback: '' };
}
