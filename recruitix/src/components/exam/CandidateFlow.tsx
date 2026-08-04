import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck } from 'lucide-react';
import CompanySelect, { type Company } from './CompanySelect';
import ExamTypeSelect from './ExamTypeSelect';
import ExamFaceGate from './ExamFaceGate';
import AssignmentBriefing from './AssignmentBriefing';
import ExamRunner from './ExamRunner';
import type { RoundName } from '@/lib/examRounds';

interface CandidateFlowProps {
  onBack: () => void;
}

type Step = 'select_company' | 'select_exam_type' | 'face_gate' | 'assignment_briefing' | 'manual_review' | 'exam';

/** Orchestrates company selection -> exam type selection -> face+liveness gate -> assignment briefing -> proctored exam. */
const CandidateFlow = ({ onBack }: CandidateFlowProps) => {
  const [step, setStep] = useState<Step>('select_company');
  const [company, setCompany] = useState<Company | null>(null);
  const [examType, setExamType] = useState<RoundName | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  if (step === 'select_company') {
    return (
      <CompanySelect
        onBack={onBack}
        onCompanySelected={(c) => {
          setCompany(c);
          setStep('select_exam_type');
        }}
      />
    );
  }

  if (step === 'select_exam_type' && company) {
    return (
      <ExamTypeSelect
        company={company}
        onBack={() => setStep('select_company')}
        onSessionReady={(id, round) => {
          setSessionId(id);
          setExamType(round);
          setStep('face_gate');
        }}
      />
    );
  }

  if (step === 'face_gate' && sessionId) {
    return (
      <ExamFaceGate
        sessionId={sessionId}
        onUnlocked={() => setStep('assignment_briefing')}
        onManualReview={() => setStep('manual_review')}
        onCancel={() => setStep('select_company')}
      />
    );
  }

  if (step === 'assignment_briefing' && company && examType) {
    return (
      <AssignmentBriefing
        company={company}
        round={examType}
        onReady={({ screenStream, micStream }) => {
          setScreenStream(screenStream);
          setMicStream(micStream);
          setStep('exam');
        }}
        onCancel={() => setStep('select_company')}
      />
    );
  }

  if (step === 'manual_review') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-700">
          <CardHeader className="text-center space-y-2">
            <UserCheck className="w-12 h-12 text-amber-400 mx-auto" />
            <CardTitle className="text-white">Manual Review Required</CardTitle>
            <CardDescription className="text-slate-300">
              We couldn't verify you automatically after several attempts. An admin will review
              your enrollment and unlock your exam shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setStep('select_company')} variant="outline" className="w-full bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800">
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'exam' && sessionId && screenStream && micStream) {
    return <ExamRunner sessionId={sessionId} screenStream={screenStream} micStream={micStream} onExamComplete={onBack} />;
  }

  return null;
};

export default CandidateFlow;
