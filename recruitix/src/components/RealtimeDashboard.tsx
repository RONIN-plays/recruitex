import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, Users, Clock, TrendingUp, Camera, Mic } from 'lucide-react';
import LiveInterview from './LiveInterview';

interface CandidateSession {
  id: string;
  name: string;
  currentRound: string;
  timeElapsed: number;
  confidence: number;
  clarity: number;
  relevance: number;
  status: 'active' | 'completed' | 'paused';
  faceExpression: string;
}

const RealtimeDashboard = () => {
  const [candidates, setCandidates] = useState<CandidateSession[]>([
    {
      id: '1',
      name: 'John Doe',
      currentRound: 'HR Simulation',
      timeElapsed: 15,
      confidence: 85,
      clarity: 78,
      relevance: 92,
      status: 'active',
      faceExpression: 'confident'
    },
    {
      id: '2',
      name: 'Jane Smith',
      currentRound: 'Live Interview',
      timeElapsed: 22,
      confidence: 72,
      clarity: 88,
      relevance: 76,
      status: 'active',
      faceExpression: 'focused'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      currentRound: 'Technical Assessment',
      timeElapsed: 45,
      confidence: 90,
      clarity: 85,
      relevance: 88,
      status: 'completed',
      faceExpression: 'satisfied'
    }
  ]);
  const [showLiveInterview, setShowLiveInterview] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCandidates(prev => 
        prev.map(candidate => ({
          ...candidate,
          timeElapsed: candidate.status === 'active' ? candidate.timeElapsed + 1 : candidate.timeElapsed,
          confidence: candidate.status === 'active' ? 
            Math.max(50, Math.min(100, candidate.confidence + (Math.random() - 0.5) * 10)) : 
            candidate.confidence,
          clarity: candidate.status === 'active' ? 
            Math.max(50, Math.min(100, candidate.clarity + (Math.random() - 0.5) * 8)) : 
            candidate.clarity,
          relevance: candidate.status === 'active' ? 
            Math.max(50, Math.min(100, candidate.relevance + (Math.random() - 0.5) * 6)) : 
            candidate.relevance
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-600';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const rounds = [
    'Technical Assessment',
    'Live Interview',
    'HR Simulation'
  ];

  const getRoundStats = (round: string) => {
    const filtered = candidates.filter(c => c.currentRound === round);
    const active = filtered.filter(c => c.status === 'active').length;
    const completed = filtered.filter(c => c.status === 'completed').length;
    const avgScore = filtered.length > 0
      ? Math.round(filtered.reduce((acc, c) => acc + ((c.confidence + c.clarity + c.relevance) / 3), 0) / filtered.length)
      : 0;
    const avgDuration = filtered.length > 0
      ? Math.round(filtered.reduce((acc, c) => acc + c.timeElapsed, 0) / filtered.length)
      : 0;
    return { active, completed, avgScore, avgDuration };
  };

  return (
    <div className="space-y-6">
      {!showLiveInterview ? (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Live Monitoring Dashboard</h2>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live
              </Badge>
              <span className="text-sm text-slate-600">
                {candidates.filter(c => c.status === 'active').length} Active Sessions
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <Card key={candidate.id} className="relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-3 h-3 ${getStatusColor(candidate.status)} rounded-bl-lg`}></div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{candidate.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {candidate.currentRound}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Duration: {formatTime(candidate.timeElapsed)}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Status Indicators */}
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Camera className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Camera ON</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Mic className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">Audio ON</span>
                    </div>
                  </div>

                  {/* Face Expression */}
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Face Expression</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {candidate.faceExpression}
                      </Badge>
                    </div>
                  </div>

                  {/* Real-time Metrics */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Confidence</span>
                        <span className="font-medium">{candidate.confidence.toFixed(0)}%</span>
                      </div>
                      <Progress value={candidate.confidence} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Clarity</span>
                        <span className="font-medium">{candidate.clarity.toFixed(0)}%</span>
                      </div>
                      <Progress value={candidate.clarity} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Relevance</span>
                        <span className="font-medium">{candidate.relevance.toFixed(0)}%</span>
                      </div>
                      <Progress value={candidate.relevance} className="h-2" />
                    </div>
                  </div>

                  {/* Overall Score */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Overall Score</span>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {((candidate.confidence + candidate.clarity + candidate.relevance) / 3).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Per-Round Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rounds.map(round => {
              const stats = getRoundStats(round);
              return (
                <Card key={round}>
                  <CardHeader>
                    <CardTitle className="text-lg">{round}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2 text-center">
                    <div>
                      <span className="text-green-600 font-bold">{stats.active}</span>
                      <span className="text-sm text-slate-600 ml-1">Active</span>
                    </div>
                    <div>
                      <span className="text-gray-800 dark:text-gray-200 font-bold">{stats.completed}</span>
                      <span className="text-sm text-slate-600 ml-1">Completed</span>
                    </div>
                    <div>
                      <span className="text-gray-800 dark:text-gray-200 font-bold">{stats.avgScore}%</span>
                      <span className="text-sm text-slate-600 ml-1">Avg Score</span>
                    </div>
                    <div>
                      <span className="text-orange-600 font-bold">{stats.avgDuration}m</span>
                      <span className="text-sm text-slate-600 ml-1">Avg Duration</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Overall Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {candidates.filter(c => c.status === 'active').length}
                </div>
                <div className="text-sm text-slate-600">Active Sessions</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {candidates.filter(c => c.status === 'completed').length}
                </div>
                <div className="text-sm text-slate-600">Completed</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {candidates.length > 0 ? 
                    Math.round(candidates.reduce((acc, c) => acc + ((c.confidence + c.clarity + c.relevance) / 3), 0) / candidates.length) :
                    0
                  }%
                </div>
                <div className="text-sm text-slate-600">Avg Score</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {candidates.length > 0 ? 
                    Math.round(candidates.reduce((acc, c) => acc + c.timeElapsed, 0) / candidates.length) :
                    0
                  }m
                </div>
                <div className="text-sm text-slate-600">Avg Duration</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <button
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100"
              onClick={() => setShowLiveInterview(true)}
            >
              Start Live Interview
            </button>
          </div>
        </div>
      ) : (
        <LiveInterview
          onComplete={() => setShowLiveInterview(false)}
          onBack={() => setShowLiveInterview(false)}
        />
      )}
    </div>
  );
};

export default RealtimeDashboard;
