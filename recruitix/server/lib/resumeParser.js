import pdfParse from 'pdf-parse';

// Keeps the extracted resume text small enough to comfortably fit alongside a full interview
// transcript in every LLM call that uses it (interviewer + HR question generation), while still
// covering a multi-page resume's worth of content.
const MAX_RESUME_TEXT_CHARS = 8000;

export async function parseResumePdf(buffer) {
  const { text } = await pdfParse(buffer);
  const cleaned = text.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!cleaned) throw new Error('No extractable text found in this PDF.');
  return cleaned.slice(0, MAX_RESUME_TEXT_CHARS);
}
