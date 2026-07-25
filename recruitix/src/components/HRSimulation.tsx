import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MessageSquare, Mic, MicOff, Clock, Send, Bot, Camera, Eye, Smile, Frown, Meh, AlertTriangle } from 'lucide-react';
import { createRepeatableSimulationEngine, simulationProfiles } from '@/utils/hrSimulationEngine';

interface HRSimulationProps {
  onComplete: () => void;
  onBack: () => void;
  candidateInfo?: any;
  role?: string;
}

const HRSimulation = ({ onComplete, onBack, candidateInfo, role }: HRSimulationProps) => {
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [confidence, setConfidence] = useState(75);
  const [clarity, setClarty] = useState(80);
  const [relevance, setRelevance] = useState(70);
  const [faceExpression, setFaceExpression] = useState<'happy' | 'neutral' | 'concerned'>('neutral');
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const typingStartTime = useRef<number>(0);
  const responseStartLength = useRef<number>(0);

  // Multilingual HR questions for cross-lingual comprehension testing
  const hrQuestions = {
    en: [
      "Tell me about yourself and why you're interested in this position.",
      "Describe a challenging situation you faced and how you overcame it.",
      "Where do you see yourself in five years?",
      "What are your greatest strengths and weaknesses?",
      "Why should we hire you over other candidates?",
      "Describe a time when you had to work in a team to achieve a goal.",
      "How do you handle stress and pressure?",
      "What motivates you in your work?",
      "Tell me about a time you failed and what you learned from it.",
      "How do you stay updated with industry trends and technologies?"
    ],
    hi: [
      "अपने बारे में बताएं और इस पद में आपकी रुचि क्यों है।",
      "किसी चुनौतीपूर्ण स्थिति के बारे में बताएं जिसका आपने सामना किया और उसे कैसे पार किया।",
      "आप खुद को पांच साल बाद कहां देखते हैं?",
      "आपकी सबसे बड़ी ताकत और कमजोरियां क्या हैं?",
      "हमें आपको अन्य उम्मीदवारों के बजाय क्यों चुनना चाहिए?",
      "किसी समय के बारे में बताएं जब आपको लक्ष्य हासिल करने के लिए टीम में काम करना पड़ा।",
      "आप तनाव और दबाव को कैसे संभालते हैं?",
      "आपके काम में आपको क्या प्रेरणा देता है?",
      "किसी असफलता के बारे में बताएं और आपने उससे क्या सीखा।",
      "आप उद्योग के रुझानों और तकनीकों के साथ कैसे अपडेट रहते हैं?"
    ],
    es: [
      "Háblame de ti y por qué te interesa este puesto.",
      "Describe una situación desafiante que enfrentaste y cómo la superaste.",
      "¿Dónde te ves en cinco años?",
      "¿Cuáles son tus mayores fortalezas y debilidades?",
      "¿Por qué deberíamos contratarte en lugar de otros candidatos?",
      "Describe una ocasión en la que tuviste que trabajar en equipo para lograr un objetivo.",
      "¿Cómo manejas el estrés y la presión?",
      "¿Qué te motiva en tu trabajo?",
      "Háblame de una vez que fallaste y qué aprendiste de ello.",
      "¿Cómo te mantienes actualizado con las tendencias y tecnologías de la industria?"
    ]
  };

  const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof hrQuestions>('en');
  const questions = hrQuestions[selectedLanguage];

  useEffect(() => {
    if (!isStarted) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted]);

  useEffect(() => {
    if (isStarted && currentQuestion < questions.length) {
      // Simulate AI typing
      setAiTyping(true);
      const typingTimer = setTimeout(() => {
        setAiTyping(false);
      }, 2000);
      
      return () => clearTimeout(typingTimer);
    }
  }, [currentQuestion, isStarted]);

  // Initialize camera when started
  useEffect(() => {
    if (isStarted && !cameraEnabled) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraEnabled(true);
          }
        })
        .catch((err) => {
          console.error('Camera access denied:', err);
        });
    }
  }, [isStarted]);

  // Create repeatable simulation engine
  const simulationEngine = createRepeatableSimulationEngine(simulationProfiles.balanced_candidate);
  const [simulationStartTime] = useState(Date.now());
      const shuffleArray = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
      };

      useEffect(() => {
        shuffleArray(hrQuestions[selectedLanguage]);
      }, [selectedLanguage]);

  // Deterministic simulation engine
  useEffect(() => {
    if (!cameraEnabled) return;
    
    const simulationTimer = setInterval(() => {
      const elapsed = Date.now() - simulationStartTime;
      const currentEvent = simulationEngine(elapsed);
      
      setFaceExpression(currentEvent.expression);
      setConfidence(currentEvent.confidence);
      setClarty(currentEvent.clarity);
    }, 1000);

    return () => clearInterval(simulationTimer);
  }, [cameraEnabled, simulationEngine, simulationStartTime]);

  // Track typing speed
  useEffect(() => {
    if (currentResponse.length > responseStartLength.current) {
      if (typingStartTime.current === 0) {
        typingStartTime.current = Date.now();
        responseStartLength.current = currentResponse.length;
      } else {
        const timeDiff = (Date.now() - typingStartTime.current) / 1000;
        const charsDiff = currentResponse.length - responseStartLength.current;
        const wpm = Math.round((charsDiff / 5) / (timeDiff / 60));
        setTypingSpeed(wpm);
        
        // Update clarity based on typing speed
        setClarty(Math.min(100, Math.max(50, wpm * 2)));
      }
    } else if (currentResponse.length === 0) {
      typingStartTime.current = 0;
      responseStartLength.current = 0;
      setTypingSpeed(0);
    }
  }, [currentResponse]);

  // Update relevance based on response length and keywords
  useEffect(() => {
    if (currentResponse.length > 0) {
      const keywords = ['experience', 'skills', 'team', 'project', 'challenge', 'learn', 'achieve', 'goal'];
      const keywordCount = keywords.filter(keyword => 
        currentResponse.toLowerCase().includes(keyword)
      ).length;
      
      const lengthScore = Math.min(100, (currentResponse.length / 200) * 100);
      const keywordScore = (keywordCount / keywords.length) * 100;
      setRelevance((lengthScore + keywordScore) / 2);
    }
  }, [currentResponse]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitResponse = () => {
    if (!currentResponse.trim()) return;
    
    const newResponses = [...responses];
    newResponses[currentQuestion] = currentResponse;
    setResponses(newResponses);
    setCurrentResponse('');
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    console.log('HR Simulation completed with responses:', responses);
    onComplete();
  };

  const handleBackClick = () => {
    if (isStarted && responses.length > 0) {
      setShowExitConfirmation(true);
    } else {
      onBack();
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirmation(false);
    onBack();
  };

  const handleCancelExit = () => {
    setShowExitConfirmation(false);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  const getExpressionIcon = () => {
    switch (faceExpression) {
      case 'happy': return <Smile className="w-4 h-4 text-green-600" />;
      case 'concerned': return <Frown className="w-4 h-4 text-red-600" />;
      default: return <Meh className="w-4 h-4 text-yellow-600" />;
    }
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-purple-900 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl dark:text-white">HR Simulation Interview</CardTitle>
            {candidateInfo && (
              <p className="text-slate-600 dark:text-slate-300">Welcome, {candidateInfo.name}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">What to Expect:</h3>
              <ul className="text-purple-700 dark:text-purple-400 text-sm space-y-1">
                <li>• AI-powered virtual HR interview</li>
                <li>• 10 behavioral and personality questions</li>
                <li>• Face recognition for confidence analysis</li>
                <li>• Real-time sentiment and typing analysis</li>
                <li>• Duration: 30 minutes</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Camera & Microphone Access:</h3>
              <ul className="text-blue-700 dark:text-blue-400 text-sm space-y-1">
                <li>• Camera will be used for face expression analysis</li>
                <li>• Maintain good lighting and stable position</li>
                <li>• Look directly at the camera when responding</li>
                <li>• Microphone access for voice input (optional)</li>
              </ul>
            </div>
            
            <div className="flex space-x-4">
              <Button variant="outline" onClick={handleBackClick} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button onClick={() => setIsStarted(true)} className="flex-1 bg-purple-500 hover:bg-purple-600">
                Start Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-purple-900">
      {/* Header */}
      <header className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">HR Interview</Badge>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              
              {/* Language Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Language:</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as keyof typeof hrQuestions)}
                  className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-700 dark:text-white"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                <Clock className="w-4 h-4" />
                <span className={`font-mono text-lg ${timeLeft < 300 ? 'text-red-500 font-bold' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
          
          <Progress value={progress} className="mt-3" />
        </div>
      </header>

      {/* Interview Interface */}
      <div className="container mx-auto px-6 py-8">
        {/* Back to Dashboard Button */}
        <div className="mb-4 flex">
          <Button variant="outline" onClick={handleBackClick} className="border-gray-600 dark:border-slate-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feed */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm flex items-center dark:text-white">
                  <Camera className="w-4 h-4 mr-2" />
                  Live Camera Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-48 bg-slate-200 dark:bg-slate-700 rounded-lg object-cover"
                  />
                  {!cameraEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-lg">
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Camera not available</p>
                    </div>
                  )}
                </div>
                
                {/* Real-time metrics */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center dark:text-white">
                      {getExpressionIcon()}
                      <span className="ml-1">Expression</span>
                    </span>
                    <span className="text-sm font-medium capitalize dark:text-white">{faceExpression}</span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1 dark:text-white">
                      <span>Confidence</span>
                      <span>{confidence.toFixed(0)}%</span>
                    </div>
                    <Progress value={confidence} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1 dark:text-white">
                      <span>Clarity (WPM: {typingSpeed})</span>
                      <span>{clarity.toFixed(0)}%</span>
                    </div>
                    <Progress value={clarity} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1 dark:text-white">
                      <span>Relevance</span>
                      <span>{relevance.toFixed(0)}%</span>
                    </div>
                    <Progress value={relevance} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interview Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Interviewer */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500">
                    <AvatarFallback className="text-white font-bold">AI</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <h3 className="font-semibold text-slate-800 dark:text-white">HR Assistant</h3>
                      <Badge variant="outline" className="text-xs">
                        <Bot className="w-3 h-3 mr-1" />
                        AI Powered
                      </Badge>
                    </div>
                    
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
                      {aiTyping ? (
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-slate-500 text-sm">AI is typing...</span>
                        </div>
                      ) : (
                        <p className="text-slate-800 dark:text-white leading-relaxed">
                          {questions[currentQuestion]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Area */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between dark:text-white">
                  Your Response
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleListening}
                      className={isListening ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700' : ''}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-4 h-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Voice Input
                        </>
                      )}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Type your response here... Be specific and provide examples where possible."
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  className="min-h-[200px] resize-none dark:bg-slate-700 dark:text-white"
                />
                
                {isListening && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-700 dark:text-red-400 text-sm font-medium">Recording... Speak clearly</span>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Character count: {currentResponse.length} | Typing: {typingSpeed} WPM
                  </p>
                  <Button
                    onClick={handleSubmitResponse}
                    disabled={!currentResponse.trim() || aiTyping}
                    className="bg-purple-500 hover:bg-purple-600 flex items-center"
                  >
                    Submit Response {currentQuestion === questions.length - 1 ? 'Complete Interview' : 'Next Question'}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 bg-white">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Leave Interview?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600 text-center">
                You have answered {responses.filter(r => r && r.trim()).length} questions. 
                Are you sure you want to leave? Your progress will be lost.
              </p>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleCancelExit} 
                  className="flex-1"
                >
                  Continue Interview
                </Button>
                <Button 
                  onClick={handleConfirmExit} 
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  Leave Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HRSimulation;
