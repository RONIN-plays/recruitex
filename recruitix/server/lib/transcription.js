import Groq, { toFile } from 'groq-sdk';

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

// Fast, accurate, and — unlike the browser's Web Speech API this replaced — runs entirely under
// our control instead of depending on the candidate's browser/network reaching Google's speech
// backend, which proved unreliable (silent failures with no error event at all in some setups).
const MODEL = 'whisper-large-v3-turbo';

function extensionForMimeType(mimeType) {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

/** Transcribes a recorded answer clip. Returns an empty string (not a throw) for audio with no
 *  detectable speech, matching how a blank/empty answer is already handled everywhere else. */
export async function transcribeAudio(buffer, mimeType) {
  const file = await toFile(buffer, `answer.${extensionForMimeType(mimeType)}`);
  const transcription = await getClient().audio.transcriptions.create({
    file,
    model: MODEL,
    response_format: 'json',
  });
  return typeof transcription.text === 'string' ? transcription.text.trim() : '';
}
