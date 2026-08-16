import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, Bot, User, TrendingUp, TrendingDown, Loader } from 'lucide-react';
import { useCandidateDetail, type CandidateQuestionRound, type CandidatePersonalRound } from '@/hooks/useCandidateDetail';

interface CandidateDetailDialogProps {
  candidateId: string | null;
  onClose: () => void;
}

const statusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-600 text-white border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    case 'in-progress':
      return <Badge className="bg-blue-600 text-white border-0"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
    case 'abandoned':
      return <Badge className="bg-orange-600 text-white border-0"><AlertTriangle className="w-3 h-3 mr-1" />Abandoned</Badge>;
    default:
      return <Badge variant="outline" className="border-gray-600 text-gray-300">Not Attempted</Badge>;
  }
};

const QuestionRoundSection = ({ title, round }: { title: string; round: CandidateQuestionRound | null }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <div className="flex items-center gap-2">
        {round && round.pct !== null && <span className="text-sm font-semibold text-white">{round.pct}%</span>}
        {round ? statusBadge(round.status) : statusBadge('not-attempted')}
      </div>
    </div>

    {!round ? (
      <p className="text-sm text-gray-500">Not attempted yet.</p>
    ) : round.questions.length === 0 ? (
      <p className="text-sm text-gray-500">No question responses recorded for this attempt.</p>
    ) : (
      <div className="space-y-3">
        {round.questions.map((q, i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-400">Q{i + 1}</span>
                {q.category && <Badge variant="outline" className="border-gray-600 text-gray-300 text-[10px]">{q.category}</Badge>}
              </div>
              <Badge className="bg-gray-700 text-white border-0 shrink-0">{q.score} / {q.points} pts</Badge>
            </div>
            <p className="text-sm text-white">{q.prompt}</p>

            {q.qtype === 'mcq' && q.options ? (
              <div className="grid gap-1.5">
                {q.options.map((option) => {
                  const isCandidateChoice = option === q.answer;
                  const isCorrect = option === q.correctAnswer;
                  return (
                    <div
                      key={option}
                      className={`text-xs px-3 py-1.5 rounded-md border ${
                        isCorrect
                          ? 'border-green-500/50 bg-green-500/10 text-green-300'
                          : isCandidateChoice
                            ? 'border-red-500/50 bg-red-500/10 text-red-300'
                            : 'border-gray-700 text-gray-400'
                      }`}
                    >
                      {option}
                      {isCorrect && <span className="ml-2 font-semibold">(correct)</span>}
                      {isCandidateChoice && !isCorrect && <span className="ml-2 font-semibold">(candidate's answer)</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Candidate's Answer</p>
                  <p className="text-xs text-gray-200 bg-gray-900 rounded-md p-2.5 whitespace-pre-wrap">
                    {q.answer.trim() || <span className="text-gray-500 italic">No answer given</span>}
                  </p>
                </div>
                {q.correctAnswer && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Expected Approach / Rubric</p>
                    <p className="text-xs text-gray-400 bg-gray-900/50 rounded-md p-2.5 whitespace-pre-wrap">{q.correctAnswer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

const PersonalRoundSection = ({ round }: { round: CandidatePersonalRound | null }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-bold text-white">Live Interview</h3>
      <div className="flex items-center gap-2">
        {round && round.pct !== null && <span className="text-sm font-semibold text-white">{round.pct}%</span>}
        {round ? statusBadge(round.status) : statusBadge('not-attempted')}
      </div>
    </div>

    {!round ? (
      <p className="text-sm text-gray-500">Not attempted yet.</p>
    ) : (
      <div className="space-y-4">
        {round.feedback && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
            <p className="text-sm text-gray-200">{round.feedback.summary}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-green-400 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Strengths</p>
                <ul className="text-xs text-gray-300 list-disc list-inside space-y-0.5">
                  {round.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-amber-400 flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Areas to Improve</p>
                <ul className="text-xs text-gray-300 list-disc list-inside space-y-0.5">
                  {round.feedback.areasToImprove.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {round.transcript.length === 0 ? (
          <p className="text-sm text-gray-500">No transcript recorded for this attempt.</p>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2.5 max-h-80 overflow-y-auto">
            {round.transcript.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    m.role === 'user' ? 'bg-gray-700 text-gray-300' : 'bg-indigo-500/20 text-indigo-300'
                  }`}
                >
                  {m.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                </div>
                <div
                  className={`text-xs rounded-xl px-3 py-1.5 max-w-[75%] whitespace-pre-wrap ${
                    m.role === 'user' ? 'bg-gray-700 text-gray-100' : 'bg-indigo-500/10 text-indigo-100'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
);

/** Shows a candidate's full record across all three rounds: every question asked, the answer they
 *  gave, and exactly how it was marked (Technical/HR); the full conversation transcript and AI
 *  evaluation for the Live Interview. */
const CandidateDetailDialog = ({ candidateId, onClose }: CandidateDetailDialogProps) => {
  const { data, loading, error } = useCandidateDetail(candidateId);

  return (
    <Dialog open={candidateId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{data?.candidate.name ?? 'Candidate Details'}</DialogTitle>
          <DialogDescription className="text-gray-400">{data?.candidate.email}</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-blue-500 mr-2" />
            <span className="text-white font-medium">Loading candidate record...</span>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {data && (
          <div className="space-y-6">
            <QuestionRoundSection title="Technical Assessment" round={data.rounds.technical} />
            <div className="border-t border-gray-800" />
            <PersonalRoundSection round={data.rounds.personal} />
            <div className="border-t border-gray-800" />
            <QuestionRoundSection title="HR Simulation" round={data.rounds.hr} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CandidateDetailDialog;
