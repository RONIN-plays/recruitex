import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Clock, ChevronLeft, ChevronRight, Code } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { calculateSemanticSimilarity } from '@/utils/semanticSimilarity';

interface TechnicalRoundProps {
  onComplete: (round: string, score: number, percentage: number) => void;
  onBack: () => void;
}

const TechnicalRound = ({ onComplete, onBack }: TechnicalRoundProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());
  const [isStarted, setIsStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Shuffle helper to randomize question order each attempt
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const questionBank = [
    { type: 'mcq', category: 'DSA', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct: 'O(log n)', points: 2 },
    { type: 'mcq', category: 'DSA', question: 'Which data structure uses LIFO principle?', options: ['Queue', 'Stack', 'Array', 'Tree'], correct: 'Stack', points: 2 },
    { type: 'mcq', category: 'DSA', question: 'What is the worst-case time complexity of quicksort?', options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], correct: 'O(n²)', points: 2 },
    { type: 'mcq', category: 'DSA', question: 'Which traversal technique is used in DFS?', options: ['Queue', 'Stack', 'Array', 'Linked List'], correct: 'Stack', points: 2 },
    { type: 'mcq', category: 'DSA', question: 'What is the space complexity of merge sort?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correct: 'O(n)', points: 2 },
    
    { type: 'mcq', category: 'Aptitude', question: 'If a train travels 120 km in 2 hours, what is its speed?', options: ['50 km/h', '60 km/h', '70 km/h', '80 km/h'], correct: '60 km/h', points: 1 },
    { type: 'mcq', category: 'Aptitude', question: 'A man can complete a work in 12 days. How much work can he complete in 3 days?', options: ['1/4', '1/3', '1/2', '2/3'], correct: '1/4', points: 1 },
    { type: 'mcq', category: 'Aptitude', question: 'The ratio of 3:4 is equal to?', options: ['12:16', '6:9', '9:12', '15:18'], correct: '12:16', points: 1 },
    { type: 'mcq', category: 'Aptitude', question: 'If 5 books cost $25, what is the cost of 8 books?', options: ['$35', '$40', '$45', '$50'], correct: '$40', points: 1 },
    { type: 'mcq', category: 'Aptitude', question: 'What comes next in the series: 2, 6, 12, 20, ?', options: ['28', '30', '32', '34'], correct: '30', points: 1 },
    
    { type: 'mcq', category: 'Quant', question: 'What is 15% of 240?', options: ['36', '32', '38', '34'], correct: '36', points: 1 },
    { type: 'mcq', category: 'Quant', question: 'If x + y = 10 and x - y = 4, what is the value of x?', options: ['6', '7', '8', '9'], correct: '7', points: 1 },
    { type: 'mcq', category: 'Quant', question: 'What is the area of a circle with radius 7?', options: ['154', '144', '164', '174'], correct: '154', points: 1 },
    { type: 'mcq', category: 'Quant', question: 'If log₂(8) = x, what is x?', options: ['2', '3', '4', '5'], correct: '3', points: 1 },
    { type: 'mcq', category: 'Quant', question: 'What is the compound interest on $1000 at 10% for 2 years?', options: ['$200', '$210', '$220', '$230'], correct: '$210', points: 1 },
    
    { type: 'coding', category: 'DSA', question: 'Write a function to reverse a linked list.', placeholder: 'def reverse_linked_list(head):\n    # Your code here\n    pass', correct: 'iterative or recursive approach', points: 5 },
    { type: 'coding', category: 'DSA', question: 'Implement binary search algorithm.', placeholder: 'def binary_search(arr, target):\n    # Your code here\n    pass', correct: 'divide and conquer approach', points: 5 },
    { type: 'coding', category: 'DSA', question: 'Find the maximum element in an array.', placeholder: 'def find_max(arr):\n    # Your code here\n    pass', correct: 'iterate through array', points: 3 },
    { type: 'coding', category: 'DSA', question: 'Check if a string is palindrome.', placeholder: 'def is_palindrome(s):\n    # Your code here\n    pass', correct: 'two pointer approach', points: 3 },
    { type: 'coding', category: 'DSA', question: 'Implement stack using arrays.', placeholder: 'class Stack:\n    # Your code here\n    pass', correct: 'push, pop, top operations', points: 4 },
    
    { type: 'mcq', category: 'DSA', question: 'What is the height of a complete binary tree with n nodes?', options: ['log₂(n)', '⌊log₂(n)⌋', '⌈log₂(n+1)⌉', 'n'], correct: '⌊log₂(n)⌋', points: 2 },
    { type: 'mcq', category: 'Aptitude', question: 'A pipe can fill a tank in 6 hours. Another pipe can empty it in 8 hours. How long to fill the tank if both are open?', options: ['24 hours', '20 hours', '18 hours', '16 hours'], correct: '24 hours', points: 1 },
    { type: 'mcq', category: 'Quant', question: 'What is the probability of getting a head when flipping a fair coin?', options: ['0.25', '0.5', '0.75', '1'], correct: '0.5', points: 1 },
    { type: 'mcq', category: 'DSA', question: 'Which sorting algorithm is stable?', options: ['Quick Sort', 'Heap Sort', 'Merge Sort', 'Selection Sort'], correct: 'Merge Sort', points: 2 },
    { type: 'mcq', category: 'Aptitude', question: 'If today is Monday, what day will it be after 100 days?', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], correct: 'Tuesday', points: 1 }
  ];

  const [questions] = useState(() => shuffleArray(questionBank));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
  }, [isStarted, timeLeft]);



  const calculateScore = () => {
    let correctAnswers = 0;
    const totalQuestions = questions.length;
    
    questions.forEach((q, index) => {
      const userAnswer = answers[index];
      
      if (q.type === 'mcq' && userAnswer === q.correct) {
        correctAnswers += 1;
      } else if (q.type === 'coding' && userAnswer) {
        // Use semantic similarity for coding questions
        const similarity = calculateSemanticSimilarity(userAnswer, q.correct);
        if (similarity >= 0.3) { // 30% similarity threshold
          correctAnswers += similarity; // Partial credit based on similarity
        }
      }
    });
    
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    return { correctAnswers, totalQuestions, percentage };
  };

  const handleSkip = () => {
    setSkippedQuestions(prev => new Set([...prev, currentQuestion]));
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleSubmit = () => {
    const { correctAnswers, percentage } = calculateScore();
    console.log('Submitting answers:', answers);
    console.log('Skipped questions:', Array.from(skippedQuestions));
    setShowResults(true);
    setTimeout(() => {
      onComplete('technical', correctAnswers, percentage);
    }, 3000);
  };

  if (showResults) {
    const { correctAnswers, totalQuestions, percentage } = calculateScore();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Technical Round Results</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className={`text-6xl font-bold ${percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
              {correctAnswers}/{totalQuestions}
            </div>
            <p className="text-xl">Correct Answers: {correctAnswers} out of {totalQuestions}</p>
            <p className="text-lg">Percentage: {percentage}%</p>
            <p className={`text-lg font-medium ${percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
              {percentage >= 60 ? 'Qualified for Next Round!' : 'Did not meet minimum requirement (60%)'}
            </p>
            <p className="text-slate-600">
              Questions Attempted: {Object.keys(answers).length}/{totalQuestions}
            </p>
            <p className="text-slate-600">
              Questions Skipped: {skippedQuestions.size}
            </p>
            <p className="text-slate-600">
              {percentage >= 70 ? 'Excellent performance!' : 
               percentage >= 50 ? 'Good effort!' : 'Keep practicing!'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Code className="w-8 h-8 text-white dark:text-black" />
            </div>
            <CardTitle className="text-2xl">Technical Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Instructions:</h3>
              <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1">
                <li>• Total time: 60 minutes</li>
                <li>• {questions.length} questions covering DSA, Aptitude, and Quantitative topics</li>
                <li>• Minimum 60% required to advance to next round</li>
                <li>• Once started, the timer cannot be paused</li>
                <li>• You can navigate between questions freely</li>
                <li>• You can skip questions if needed</li>
                <li>• Auto-submit when time expires</li>
              </ul>
            </div>
            
            <div className="flex space-x-4">
              <Button variant="outline" onClick={onBack}>Back to Dashboard</Button>
              <Button onClick={() => setIsStarted(true)}>Start Assessment</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black/90 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-gray-800 text-white border-gray-600">Technical Round</Badge>
              <span className="text-sm text-gray-300">
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-gray-300">
                <Clock className="w-4 h-4" />
                <span className={`font-mono text-lg ${timeLeft < 300 ? 'text-red-400 font-bold' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Badge variant={answeredCount === questions.length ? "default" : "secondary"} className="bg-gray-800 text-white border-gray-600">
                {answeredCount}/{questions.length} Answered
              </Badge>
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                {skippedQuestions.size} Skipped
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="mt-3 bg-gray-800" />
        </div>
      </header>

      {/* Question Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back to Dashboard Button */}
          <div className="mb-4 flex">
            <Button
              variant="outline"
              onClick={onBack}
              className="bg-white text-black border-gray-300 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <Card className="mb-6 bg-gray-900 text-white border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="border-gray-600 text-white">{currentQ.category}</Badge>
                  <Badge variant="secondary" className="bg-gray-800 text-white border-gray-600">{currentQ.points} points</Badge>
                  {skippedQuestions.has(currentQuestion) && (
                    <Badge variant="outline" className="text-orange-400 border-orange-400">
                      Skipped
                    </Badge>
                  )}
                </div>
                <Badge variant={currentQ.type === 'coding' ? 'default' : 'secondary'} className="bg-gray-800 text-white border-gray-600">
                  {currentQ.type === 'coding' ? 'Coding' : 'Multiple Choice'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <h2 className="text-xl font-semibold mb-6 text-white">
                {currentQ.question}
              </h2>

              {currentQ.type === 'mcq' ? (
                <RadioGroup
                  value={answers[currentQuestion] || ''}
                  onValueChange={(value) => setAnswers(prev => ({ ...prev, [currentQuestion]: value }))}
                  className="space-y-3"
                >
                  {currentQ.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border border-gray-700 hover:bg-gray-800">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="cursor-pointer flex-1 text-white">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-4">
                  <div className="bg-black rounded-lg p-4">
                    <Textarea
                      placeholder={currentQ.placeholder}
                      value={answers[currentQuestion] || ''}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion]: e.target.value }))}
                      className="min-h-[300px] bg-gray-800 text-green-400 font-mono border-gray-700 resize-none"
                    />
                  </div>
                  <p className="text-sm text-gray-400">
                    Write your solution in Python, Java, or C++
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="bg-black text-white border-gray-600 hover:bg-gray-800"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleSkip}
                className="text-orange-400 border-orange-400 hover:bg-gray-800"
              >
                Skip Question
              </Button>
            </div>

            {/* Question Navigation Numbers */}
            <div className="flex flex-wrap gap-2 justify-center">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border border-gray-700
                    ${index === currentQuestion
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : skippedQuestions.has(index)
                      ? 'bg-orange-500 text-white'
                      : answers[index]
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
                  `}
                >
                  Question {index + 1}
                </button>
              ))}
            </div>

            {/* Submit/Next Button */}
            <div className="flex justify-center md:justify-end">
              {currentQuestion === questions.length - 1 ? (
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white px-8">
                  Submit Test
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                  className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black px-8"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Parent component (e.g., CandidatePortal)
const Parent = () => {
  const navigate = useNavigate();
  const [currentRound, setCurrentRound] = useState('dashboard');

  const handleRoundComplete = (round, score, percentage) => {
    // handle completion logic
    setCurrentRound('dashboard');
  };

  return (
    <TechnicalRound
      onComplete={handleRoundComplete}
      onBack={() => setCurrentRound('dashboard')}
    />
  );
};

export default TechnicalRound;