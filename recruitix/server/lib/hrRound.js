import Groq from 'groq-sdk';

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Missing GROQ_API_KEY environment variable.');
    }
    client = new Groq();
  }
  return client;
}

const MODEL = 'llama-3.3-70b-versatile';

const QUESTION_GEN_SYSTEM_BASE =
  'You are an HR interviewer designing a written behavioral screening round for a software engineering ' +
  'candidate. Generate a fresh set of 10 behavioral and situational-judgment questions — the kind covering ' +
  'motivation, teamwork, conflict, failure, growth, and communication that a real HR round would ask. Vary ' +
  'wording each time so no two generated sets are identical.\n\n' +
  'For each question: a one- or two-sentence prompt; and a short "rubric" string that lists the key themes ' +
  '/ keywords a strong answer would touch on (used only for grading via keyword overlap, never shown to the ' +
  'candidate).';

const QUESTION_GEN_JSON_SHAPE =
  'Respond with ONLY a raw JSON object of this exact shape, no markdown fences, no extra text: ' +
  '{"questions": [{"prompt": string, "rubric": string}]}';

function buildQuestionGenSystem(resumeText) {
  const resumeSection = resumeText
    ? "\n\nHere is the candidate's resume:\n\n" +
      `${resumeText}\n\n` +
      'At least half the questions should be grounded in this resume — e.g. asking them to reflect on a ' +
      'specific project, role transition, team, or gap it mentions — rather than being entirely generic.'
    : '';
  return `${QUESTION_GEN_SYSTEM_BASE}${resumeSection}\n\n${QUESTION_GEN_JSON_SHAPE}`;
}

const GRADING_SYSTEM =
  "You are grading one candidate's written answer to a behavioral/HR interview question in a screening " +
  'round. You are given the question, a brief rubric listing the key themes a strong answer should touch ' +
  "on, and the candidate's answer. Judge the answer on relevance, specificity (concrete examples beat vague " +
  'statements), and how well it actually addresses the rubric themes — not grammar or polish.\n\n' +
  'Respond with ONLY a raw JSON object of this exact shape, no markdown fences, no extra text: ' +
  '{"scoreFraction": <number 0 to 1>, "feedback": <string, 1 sentence>}';

function parseJsonResponse(text) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

// llama-3.3-70b's constrained JSON mode occasionally still emits a grammatically invalid object
// (Groq's own server-side validator rejects it with a 400 before we ever see the completion) —
// without a retry, that transient glitch would zero out gradeHrAnswer's result for a candidate's
// answer regardless of how good it actually was, which has nothing to do with their answer's
// quality. Same fix already used in interviewer.js for the same model/failure mode.
async function withOneRetry(fn) {
  try {
    return await fn();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Groq generation failed, retrying once:', err?.message || err);
    return fn();
  }
}

function sanitizeQuestions(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((q) => q && typeof q.prompt === 'string' && q.prompt.trim())
    .map((q) => ({
      qtype: 'behavioral',
      category: 'Behavioral',
      prompt: q.prompt.trim(),
      options: null,
      correctAnswer: typeof q.rubric === 'string' && q.rubric.trim() ? q.rubric.trim() : q.prompt.trim(),
      points: 1,
    }));
}

export async function generateHrQuestions(resumeText) {
  const completion = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0.9,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildQuestionGenSystem(resumeText) },
      { role: 'user', content: 'Generate the HR round questions now.' },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  const questions = sanitizeQuestions(parseJsonResponse(raw).questions);
  if (questions.length === 0) throw new Error('Model returned no usable HR questions.');
  return questions;
}

// Mirrors technicalRound.js's gradeCodingAnswer — grading happens server-side against the rubric
// (correctAnswer) rather than trusting a client-computed score, and the rubric itself is never
// sent to the client for this round.
export async function gradeHrAnswer(question, answer) {
  const parsed = await withOneRetry(async () => {
    const completion = await getClient().chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: GRADING_SYSTEM },
        {
          role: 'user',
          content:
            `Question: ${question.prompt}\n\n` +
            `Expected themes (rubric): ${question.correctAnswer || 'N/A'}\n\n` +
            `Candidate's answer:\n${answer || '(no answer given)'}\n\nGrade this answer.`,
        },
      ],
    });
    return parseJsonResponse(completion.choices[0]?.message?.content ?? '{}');
  });

  const scoreFraction = typeof parsed.scoreFraction === 'number' ? Math.max(0, Math.min(1, parsed.scoreFraction)) : 0;
  return { scoreFraction, feedback: typeof parsed.feedback === 'string' ? parsed.feedback : '' };
}
