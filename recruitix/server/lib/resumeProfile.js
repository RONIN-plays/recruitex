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

const EXTRACTION_SYSTEM =
  "You extract structured profile information from the raw text of a candidate's resume PDF. Only pull " +
  "out details that are actually present in the text — use null (or an empty array) for anything that " +
  "isn't there rather than guessing or inventing content.\n\n" +
  'Respond with ONLY a raw JSON object of this exact shape, no markdown fences, no extra text: ' +
  '{"fullName": string|null, "email": string|null, "phone": string|null, "summary": string|null, ' +
  '"skills": string[], ' +
  '"education": [{"institution": string, "degree": string|null, "years": string|null}], ' +
  '"experience": [{"title": string, "company": string|null, "duration": string|null, "description": string|null}]}';

function parseJsonResponse(text) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

function sanitizeProfile(parsed) {
  const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  return {
    fullName: str(parsed.fullName),
    email: str(parsed.email),
    phone: str(parsed.phone),
    summary: str(parsed.summary),
    skills: Array.isArray(parsed.skills) ? parsed.skills.filter((s) => typeof s === 'string' && s.trim()) : [],
    education: Array.isArray(parsed.education)
      ? parsed.education
          .filter((e) => e && typeof e.institution === 'string' && e.institution.trim())
          .map((e) => ({ institution: e.institution.trim(), degree: str(e.degree), years: str(e.years) }))
      : [],
    experience: Array.isArray(parsed.experience)
      ? parsed.experience
          .filter((e) => e && typeof e.title === 'string' && e.title.trim())
          .map((e) => ({ title: e.title.trim(), company: str(e.company), duration: str(e.duration), description: str(e.description) }))
      : [],
  };
}

// Best-effort — a failure here must not fail the resume upload itself, since the raw resumeText
// (already extracted and stored) is what actually powers the Live Interview / HR question
// generation. The structured profile is only for display on the candidate's Profile page.
export async function extractResumeProfile(resumeText) {
  try {
    const completion = await getClient().chat.completions.create({
      model: MODEL,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM },
        { role: 'user', content: resumeText },
      ],
    });
    return sanitizeProfile(parseJsonResponse(completion.choices[0]?.message?.content ?? '{}'));
  } catch (err) {
    console.error('Resume profile extraction failed:', err);
    return null;
  }
}
