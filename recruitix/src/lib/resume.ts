import { apiGet, apiPost } from './api';

export interface ResumeEducation {
  institution: string;
  degree: string | null;
  years: string | null;
}

export interface ResumeExperience {
  title: string;
  company: string | null;
  duration: string | null;
  description: string | null;
}

/** LLM-extracted structured details from the candidate's resume text — display-only, shown on the
 *  Profile page. Never used for grading (Live Interview / HR Simulation ground their questions in
 *  the raw resumeText server-side instead). Null when extraction failed or hasn't run yet. */
export interface ResumeProfile {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  summary: string | null;
  skills: string[];
  education: ResumeEducation[];
  experience: ResumeExperience[];
}

export interface ResumeStatus {
  hasResume: boolean;
  fileName: string | null;
  uploadedAt: string | null;
  textPreview: string | null;
  profile: ResumeProfile | null;
}

export function fetchResumeStatus(): Promise<ResumeStatus> {
  return apiGet<ResumeStatus>('/api/resume');
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result is "data:application/pdf;base64,<...>" — the server only wants the payload.
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadResume(file: File): Promise<ResumeStatus> {
  const fileBase64 = await readFileAsBase64(file);
  return apiPost<ResumeStatus>('/api/resume', { fileName: file.name, fileBase64 });
}
