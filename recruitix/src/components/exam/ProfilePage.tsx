import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Upload,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { useAuthProfile } from '@/hooks/useAuthProfile';
import { fetchResumeStatus, uploadResume, type ResumeStatus } from '@/lib/resume';

interface ProfilePageProps {
  onBack: () => void;
}

type UploadState = 'idle' | 'uploading' | 'error';

/** Candidate profile: identity details plus the resume on file, including the structured details
 *  (skills / education / experience) extracted from it. Reachable from the Company Select header;
 *  also where a candidate can add or replace their resume outside of the onboarding prompts. */
const ProfilePage = ({ onBack }: ProfilePageProps) => {
  const { profile, loading: profileLoading, refreshProfile } = useAuthProfile();
  const [resume, setResume] = useState<ResumeStatus | null>(null);
  const [resumeLoading, setResumeLoading] = useState(true);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchResumeStatus()
      .then(setResume)
      .catch(() => {})
      .finally(() => setResumeLoading(false));
  }, []);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please choose a PDF file.');
      setUploadState('error');
      return;
    }
    setUploadState('uploading');
    setErrorMessage('');
    try {
      const updated = await uploadResume(file);
      setResume(updated);
      setUploadState('idle');
      await refreshProfile();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setUploadState('error');
    }
  };

  const resumeProfile = resume?.profile ?? null;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/brain-logo.png" alt="Recruitix Brain Logo" className="w-10 h-10 object-contain" />
            <div>
              <span className="text-xl font-bold text-black dark:text-white">Recruitix</span>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI-Powered</div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-6 py-16 max-w-4xl space-y-8">
        <div className="space-y-2">
          <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
            <User className="w-3 h-3 mr-1.5" />
            Your Profile
          </Badge>
          <h1 className="text-4xl font-bold text-black dark:text-white tracking-tight">Profile</h1>
        </div>

        {/* Identity */}
        <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">Identity</CardTitle>
            <CardDescription>Details tied to your candidate account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profileLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            ) : profile ? (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 dark:text-gray-400 w-28 shrink-0">Name</span>
                  <span className="font-medium text-black dark:text-white">{profile.displayName ?? '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 dark:text-gray-400 w-28 shrink-0">Email</span>
                  <span className="font-medium text-black dark:text-white">{profile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 dark:text-gray-400 w-28 shrink-0">Date of birth</span>
                  <span className="font-medium text-black dark:text-white">{profile.dateOfBirth ?? '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {profile.faceEnrolled ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span className="text-gray-500 dark:text-gray-400 w-28 shrink-0">Face enrollment</span>
                  <Badge
                    className={
                      profile.faceEnrolled
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                    }
                  >
                    {profile.faceEnrolled ? 'Enrolled' : profile.enrollmentStatus}
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Could not load your profile.</p>
            )}
          </CardContent>
        </Card>

        {/* Resume */}
        <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-black dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5" /> Resume
            </CardTitle>
            <CardDescription>
              Used to ground the Live Interview and HR Simulation rounds in your actual experience. PDF only, one kept on file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumeLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            ) : resume?.hasResume ? (
              <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-black dark:text-white truncate">{resume.fileName}</p>
                  {resume.uploadedAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 shrink-0">
                  On file
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No resume on file yet.</p>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-red-600 dark:text-red-400 text-sm">{errorMessage}</p>
              </div>
            )}

            <Button
              onClick={() => inputRef.current?.click()}
              disabled={uploadState === 'uploading'}
              variant="outline"
              className="border-gray-300 dark:border-gray-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadState === 'uploading' ? 'Uploading...' : resume?.hasResume ? 'Replace resume' : 'Upload resume'}
            </Button>
          </CardContent>
        </Card>

        {/* Parsed resume details */}
        {resumeProfile && (
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-black dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Parsed From Your Resume
              </CardTitle>
              <CardDescription>Extracted automatically — for your review only, not used for grading.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {resumeProfile.summary && (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{resumeProfile.summary}</p>
              )}

              {resumeProfile.skills.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-black dark:text-white">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {resumeProfile.skills.map((skill) => (
                      <Badge key={skill} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {resumeProfile.experience.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-black dark:text-white flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-gray-400" /> Experience
                  </h3>
                  <div className="space-y-3">
                    {resumeProfile.experience.map((exp, i) => (
                      <div key={i} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                        <p className="text-sm font-medium text-black dark:text-white">
                          {exp.title}
                          {exp.company ? ` · ${exp.company}` : ''}
                        </p>
                        {exp.duration && <p className="text-xs text-gray-500 dark:text-gray-400">{exp.duration}</p>}
                        {exp.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resumeProfile.education.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-black dark:text-white flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-gray-400" /> Education
                  </h3>
                  <div className="space-y-3">
                    {resumeProfile.education.map((ed, i) => (
                      <div key={i} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                        <p className="text-sm font-medium text-black dark:text-white">{ed.institution}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {[ed.degree, ed.years].filter(Boolean).join(' · ') || null}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {resume?.hasResume && !resumeProfile && !resumeLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We couldn't extract structured details from this resume, but it's still on file and used for your Live Interview and HR Simulation rounds.
          </p>
        )}

        <div className="flex justify-center">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-8 h-12 transition-colors"
          >
            ← Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
