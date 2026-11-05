import { useEffect, useMemo, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, ChevronDown, Clock, Flag, Bookmark, BookmarkCheck } from 'lucide-react';
import type { QuestionBankRow } from '@/lib/examRounds';
import { scoreAnswer } from '@/lib/examRounds';

interface RoundViewProps {
  title: string;
  durationMin: number;
  questions: QuestionBankRow[];
  onSubmit: (result: { score: number; pct: number; answers: Record<string, string> }) => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

type QuestionStatus = 'answered' | 'missed' | 'not-visited';

const STATUS_STYLES: Record<QuestionStatus, string> = {
  answered: 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600',
  missed: 'bg-violet-500 border-violet-500 text-white hover:bg-violet-600',
  'not-visited': 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
};

/** Shared question-navigation + timer UI for Technical/Personal/HR rounds — question shape differs, structure doesn't. */
const RoundView = ({ title, durationMin, questions, onSubmit }: RoundViewProps) => {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(durationMin * 60);
  const finishedRef = useRef(false);

  const maxPoints = useMemo(() => questions.reduce((sum, q) => sum + q.points, 0), [questions]);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    let score = 0;
    for (const q of questions) score += scoreAnswer(q, answers[q.id] ?? '');
    const pct = maxPoints > 0 ? Math.round((score / maxPoints) * 100) : 0;
    onSubmit({ score, pct, answers });
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-700">No questions configured for this round yet.</p>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setVisited((prev) => new Set(prev).add(index));
  };

  // The question currently open always reads as neutral/not-visited (just the blue current-ring
  // marks it) — green/purple are only decided once the candidate leaves it, via goTo(), so
  // selecting an option doesn't instantly flip its box green before Next is clicked.
  const statusFor = (index: number): QuestionStatus => {
    if (index === currentIndex) return 'not-visited';
    const q = questions[index];
    if (answers[q.id]) return 'answered';
    if (visited.has(index)) return 'missed';
    return 'not-visited';
  };

  const toggleBookmark = () => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
  };

  const handleReport = () => {
    toast({ title: 'Question reported', description: `Question ${currentIndex + 1} was flagged for review.` });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-[#0b1424] text-white px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-lg md:text-xl font-bold truncate">{title}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4" />
            Time Left: {formatTime(timeLeft)}
          </div>
          <button
            onClick={finish}
            className="border border-blue-400 text-blue-400 hover:bg-blue-400/10 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Mark as Completed
          </button>
          <button
            onClick={toggleBookmark}
            aria-label="Bookmark this question"
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {bookmarked.has(question.id) ? <BookmarkCheck className="w-5 h-5 text-amber-400" /> : <Bookmark className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Question panel */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-gray-100">
            <div className="relative">
              <select
                value={currentIndex}
                onChange={(e) => goTo(Number(e.target.value))}
                className="appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-9 py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {questions.map((_, i) => (
                  <option key={i} value={i}>
                    Question {i + 1}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleReport}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <Flag className="w-4 h-4" /> Report
              </button>
              <button
                onClick={toggleBookmark}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                {bookmarked.has(question.id) ? <BookmarkCheck className="w-4 h-4 text-amber-500" /> : <Bookmark className="w-4 h-4" />}
                Bookmark
              </button>
            </div>
          </div>

          <p className="text-lg text-gray-900 leading-relaxed">{question.prompt}</p>

          {question.qtype === 'mcq' && question.options ? (
            <div className="space-y-3">
              {question.options.map((option, i) => {
                const selected = answers[question.id] === option;
                return (
                  <button
                    key={option}
                    onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                    className={`w-full flex items-center gap-3 text-left px-5 py-4 rounded-xl border transition-colors ${
                      selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        selected ? 'border-blue-500' : 'border-gray-300'
                      }`}
                    >
                      {selected && <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                    </span>
                    <span className="font-semibold text-gray-900">{String.fromCharCode(65 + i)}.</span>
                    <span className="text-gray-800">{option}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <Textarea
              value={answers[question.id] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
              placeholder="Type your answer here..."
              className="min-h-[160px] bg-white border-gray-300 text-gray-900"
            />
          )}

          <div className="flex justify-between pt-2">
            <button
              disabled={isFirst}
              onClick={() => goTo(currentIndex - 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              disabled={isLast}
              onClick={() => goTo(currentIndex + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question navigator */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
          <h2 className="font-bold text-gray-900">Questions</h2>

          <div className="grid grid-cols-5 gap-2.5">
            {questions.map((_, i) => {
              const status = statusFor(i);
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`aspect-square rounded-lg border-2 text-sm font-semibold transition-colors ${STATUS_STYLES[status]} ${
                    isCurrent ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-500' : ''
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Question Status</h3>
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded bg-emerald-500 shrink-0" />
              <span className="text-sm text-gray-700">Answered</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded bg-violet-500 shrink-0" />
              <span className="text-sm text-gray-700">Missed / Not Answered</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded bg-white border border-gray-300 shrink-0" />
              <span className="text-sm text-gray-700">Not Visited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundView;
