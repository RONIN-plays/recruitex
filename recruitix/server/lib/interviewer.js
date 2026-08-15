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

// Free-tier Groq model — fast, good instruction-following for conversational JSON output.
const MODEL = 'llama-3.3-70b-versatile';

const INTERVIEWER_SYSTEM_BASE =
  "You are conducting a live, spoken mock interview for a software engineering candidate, standing in " +
  "for a human interviewer. Ask one question at a time — a mix of behavioral and technical/problem-solving " +
  "questions appropriate for a general software role. The candidate's answers arrive as speech-to-text " +
  "transcriptions, which may contain minor transcription errors — read past small glitches rather than " +
  "commenting on them. Ask a natural, specific follow-up based on what the candidate actually said, the way " +
  "a real interviewer would. Keep your own questions concise, one or two sentences, since they are spoken " +
  "aloud via text-to-speech. After 5 to 7 questions covering a reasonable range of topics, wrap up warmly " +
  "and set interviewComplete to true on that final reply instead of asking another question.";

const INTERVIEWER_SYSTEM_JSON_SHAPE =
  'Respond with ONLY a raw JSON object of this exact shape, no markdown fences, no extra text: ' +
  '{"reply": string, "interviewComplete": boolean}';

function buildInterviewerSystem(resumeText) {
  const resumeSection = resumeText
    ? "\n\nHere is the candidate's resume:\n\n" +
      `${resumeText}\n\n` +
      'Ground most of your questions in this resume — ask about specific projects, roles, technologies, ' +
      'and claims it mentions, the way a real interviewer who read it beforehand would, rather than asking ' +
      'generic questions a candidate with any background could answer.'
    : '';
  return `${INTERVIEWER_SYSTEM_BASE}${resumeSection}\n\n${INTERVIEWER_SYSTEM_JSON_SHAPE}`;
}

const EVALUATOR_SYSTEM =
  "You are grading a completed live interview transcript. Be fair, specific, and evidence-based — cite " +
  "what the candidate actually said.\n\n" +
  'Respond with ONLY a raw JSON object of this exact shape, no markdown fences, no extra text: ' +
  '{"score": <integer 0-100>, "summary": <string, 2-3 sentences>, "strengths": <string array, 2-4 items>, ' +
  '"areasToImprove": <string array, 2-4 items>}';

function toApiMessages(transcriptMessages) {
  return transcriptMessages.map((m) => ({ role: m.role, content: m.text }));
}

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
// rare, but a live interview mid-conversation or a just-finished exam is a bad place to just
// throw, so every generation gets one retry before falling back to a safe default below.
async function withOneRetry(fn) {
  try {
    return await fn();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Groq generation failed, retrying once:', err?.message || err);
    return fn();
  }
}

export async function generateInterviewerTurn(transcriptMessages, resumeText) {
  let parsed;
  try {
    parsed = await withOneRetry(async () => {
      const completion = await getClient().chat.completions.create({
        model: MODEL,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: buildInterviewerSystem(resumeText) }, ...toApiMessages(transcriptMessages)],
      });
      return parseJsonResponse(completion.choices[0]?.message?.content ?? '{}');
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Interviewer turn generation failed twice, using fallback reply:', err?.message || err);
    parsed = {};
  }

  return {
    reply: typeof parsed.reply === 'string' && parsed.reply.trim() ? parsed.reply : "Sorry, could you say that again?",
    interviewComplete: parsed.interviewComplete === true,
  };
}

export async function generateInterviewEvaluation(transcriptMessages) {
  const transcriptText = transcriptMessages
    .map((m) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.text}`)
    .join('\n\n');

  let parsed;
  try {
    parsed = await withOneRetry(async () => {
      const completion = await getClient().chat.completions.create({
        model: MODEL,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: EVALUATOR_SYSTEM },
          { role: 'user', content: `Here is the full interview transcript:\n\n${transcriptText}\n\nEvaluate the candidate's performance.` },
        ],
      });
      return parseJsonResponse(completion.choices[0]?.message?.content ?? '{}');
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Interview evaluation generation failed twice, using fallback evaluation:', err?.message || err);
    parsed = {};
  }

  const fallback = Object.keys(parsed).length === 0;
  return {
    score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.score))) : 50,
    summary: typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary
      : fallback
        ? 'Automated scoring failed for this interview. A recruiter should review the transcript directly.'
        : 'No summary available.',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((s) => typeof s === 'string') : [],
    areasToImprove: Array.isArray(parsed.areasToImprove) ? parsed.areasToImprove.filter((s) => typeof s === 'string') : [],
  };
}
