import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { RecruiterStatsPin } from '@/components/ui/recruiter-stats-pin';
import { ArrowLeft, Users, Settings, BarChart3, Eye, CheckCircle, Clock, AlertTriangle, TrendingUp, Activity, Loader, ShieldAlert, Radio } from 'lucide-react';
import { useRecruiterOverview, type RoundResult } from '@/hooks/useRecruiterOverview';

interface RecruiterPortalProps {
  onBack: () => void;
}

const getStatusBadge = (round: RoundResult | null) => {
  const status = round?.status ?? 'pending';
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    case 'in-progress':
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
    case 'abandoned':
      return <Badge variant="outline" className="border-orange-500/50 text-orange-400"><AlertTriangle className="w-3 h-3 mr-1" />Abandoned</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};

const formatRelativeTime = (iso: string | null) => {
  if (!iso) return 'N/A';
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

const RecruiterPortal = ({ onBack }: RecruiterPortalProps) => {
  const { data, loading, error } = useRecruiterOverview();

  const candidates = data?.candidates ?? [];
  const liveSessions = data?.liveSessions ?? [];
  const recentViolations = data?.recentViolations ?? [];
  const stats = data?.stats ?? { totalCandidates: 0, completed: 0, inProgress: 0, passRate: 0, distribution: { excellent: 0, good: 0, average: 0, belowAverage: 0 } };
  const scoredCandidates = stats.distribution.excellent + stats.distribution.good + stats.distribution.average + stats.distribution.belowAverage;
  const distributionPct = (count: number) => (scoredCandidates > 0 ? Math.round((count / scoredCandidates) * 100) : 0);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2 text-white hover:text-gray-300">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center space-x-2 bg-gray-800 text-white border-gray-700">
                <Activity className="w-3 h-3" />
                <span>Recruiter Dashboard</span>
              </Badge>
              <div className="text-right text-sm text-gray-300">
                <p className="flex items-center space-x-1">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Registered Candidates: {stats.totalCandidates}</span>
                </p>
                <p>Live Now: {liveSessions.length}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Recruiter Dashboard</h1>
            <p className="text-gray-400">Monitor candidate assessments and manage interview settings</p>
            {error && (
              <p className="text-sm text-red-400 mt-2">Couldn't refresh live data: {error}</p>
            )}
          </div>

          <Tabs defaultValue="live-monitoring" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="live-monitoring" className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Live Monitoring</span>
              </TabsTrigger>
              <TabsTrigger value="candidates" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Candidates</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Live Monitoring Tab */}
            <TabsContent value="live-monitoring" className="space-y-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Radio className="w-5 h-5 text-green-500" />
                    <span>Live Exam Sessions</span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">Candidates currently mid-round, refreshed every few seconds from MongoDB</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading && !data ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                      <span className="text-white font-medium">Loading live sessions...</span>
                    </div>
                  ) : liveSessions.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 font-medium">No candidates are currently in an active round</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-blue-600 border-0">
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-4xl font-bold text-white">{liveSessions.length}</div>
                              <p className="text-sm text-blue-200 mt-2 font-medium">Live Sessions</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-600 border-0">
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-4xl font-bold text-white">{stats.totalCandidates}</div>
                              <p className="text-sm text-green-200 mt-2 font-medium">Registered Candidates</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-purple-600 border-0">
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{new Date().toLocaleTimeString()}</div>
                              <p className="text-sm text-purple-200 mt-2 font-medium">Current Time</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="overflow-x-auto bg-gray-900 rounded-lg border border-gray-700">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-gray-700 bg-gray-800">
                              <th className="text-left py-3 px-4 font-bold text-white">Candidate</th>
                              <th className="text-left py-3 px-4 font-bold text-white">Round</th>
                              <th className="text-left py-3 px-4 font-bold text-white">Company</th>
                              <th className="text-left py-3 px-4 font-bold text-white">Integrity Score</th>
                              <th className="text-left py-3 px-4 font-bold text-white">Started</th>
                            </tr>
                          </thead>
                          <tbody>
                            {liveSessions.map((session) => (
                              <tr key={session.sessionId} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                                <td className="py-4 px-4">
                                  <div className="font-semibold text-white">{session.candidateName}</div>
                                </td>
                                <td className="py-4 px-4 text-gray-300 font-medium capitalize">{session.round}</td>
                                <td className="py-4 px-4 text-gray-300 font-medium">{session.company ?? 'N/A'}</td>
                                <td className="py-4 px-4">
                                  <Badge className={session.integrityScore >= 80 ? 'bg-green-600 text-white border-0' : 'bg-yellow-600 text-white border-0'}>
                                    {session.integrityScore}
                                  </Badge>
                                </td>
                                <td className="py-4 px-4 text-gray-300 font-medium">{formatRelativeTime(session.startedAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {recentViolations.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                            Recent Integrity Violations
                          </h3>
                          <div className="space-y-3">
                            {recentViolations.slice(0, 5).map((violation) => (
                              <div key={violation.id} className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-start gap-4">
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="flex items-center gap-3 mb-1">
                                    <span className="font-semibold text-red-400">{violation.type}</span>
                                    <span className="text-xs text-red-400/70">{formatRelativeTime(violation.createdAt)}</span>
                                  </div>
                                  <p className="text-sm text-red-300">{violation.message}</p>
                                  <p className="text-xs text-red-400/50 mt-1">Candidate: {violation.userName}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Candidates Tab */}
            <TabsContent value="candidates" className="space-y-6">
              {loading && !data ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                  <span className="text-white font-medium">Loading candidates...</span>
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 font-medium">No candidates have registered yet</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {candidates.map((candidate) => (
                    <Card key={candidate.id} className="bg-gray-900 border-gray-700 hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl text-white">{candidate.name}</CardTitle>
                            <CardDescription className="text-gray-400">
                              {candidate.email} {candidate.appliedFor ? `· ${candidate.appliedFor}` : ''}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">
                              {candidate.overallPct !== null ? `${candidate.overallPct}%` : '—'}
                            </div>
                            <p className="text-sm text-gray-400">Overall Score</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {([
                            { key: 'technical', title: 'Technical Round', round: candidate.technical },
                            { key: 'personal', title: 'Live Interview', round: candidate.personal },
                            { key: 'hr', title: 'HR Simulation', round: candidate.hr },
                          ] as const).map(({ key, title, round }) => (
                            <div key={key} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-white">{title}</h4>
                                {getStatusBadge(round)}
                              </div>
                              {round?.status === 'completed' && (
                                <div>
                                  <div className="text-xl font-bold text-white">{round.pct !== null ? `${round.pct}%` : 'Pending review'}</div>
                                  {round.durationMin !== null && <p className="text-sm text-gray-400">Time: {round.durationMin} min</p>}
                                </div>
                              )}
                              {round?.status === 'in-progress' && (
                                <p className="text-sm text-gray-400 mt-1">Currently in progress</p>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{candidate.violationsCount} integrity flag{candidate.violationsCount === 1 ? '' : 's'}</span>
                          </div>
                          <Button variant="outline" size="sm" className="flex items-center space-x-2 border-gray-600 text-white hover:bg-gray-800">
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab - 3D Pin Stats */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <RecruiterStatsPin
                  title="Total Candidates"
                  value={stats.totalCandidates}
                  description="All registered candidates"
                  icon={Users}
                  color="bg-gray-600"
                />

                <RecruiterStatsPin
                  title="Completed"
                  value={stats.completed}
                  description="Finished all rounds"
                  icon={CheckCircle}
                  color="bg-green-600"
                />

                <RecruiterStatsPin
                  title="In Progress"
                  value={stats.inProgress}
                  description="Currently taking tests"
                  icon={Clock}
                  color="bg-yellow-600"
                />

                <RecruiterStatsPin
                  title="Pass Rate"
                  value={`${stats.passRate}%`}
                  description="Overall success rate"
                  icon={TrendingUp}
                  color="bg-gray-700"
                />
              </div>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Performance Distribution</CardTitle>
                  <CardDescription className="text-gray-400">Based on {scoredCandidates} candidate{scoredCandidates === 1 ? '' : 's'} with at least one scored round</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1 text-gray-300">
                        <span>Excellent (90-100%)</span>
                        <span>{stats.distribution.excellent} candidates</span>
                      </div>
                      <Progress value={distributionPct(stats.distribution.excellent)} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1 text-gray-300">
                        <span>Good (80-89%)</span>
                        <span>{stats.distribution.good} candidates</span>
                      </div>
                      <Progress value={distributionPct(stats.distribution.good)} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1 text-gray-300">
                        <span>Average (70-79%)</span>
                        <span>{stats.distribution.average} candidates</span>
                      </div>
                      <Progress value={distributionPct(stats.distribution.average)} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1 text-gray-300">
                        <span>Below Average (&lt;70%)</span>
                        <span>{stats.distribution.belowAverage} candidates</span>
                      </div>
                      <Progress value={distributionPct(stats.distribution.belowAverage)} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid gap-6">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Assessment Configuration</CardTitle>
                    <CardDescription className="text-gray-400">Customize the interview rounds and difficulty levels</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">Technical Round Duration</label>
                        <select className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white">
                          <option>60 minutes</option>
                          <option>45 minutes</option>
                          <option>90 minutes</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">Difficulty Level</label>
                        <select className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white">
                          <option>Medium</option>
                          <option>Easy</option>
                          <option>Hard</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">Focus Areas</label>
                        <select className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white">
                          <option>DSA + Aptitude</option>
                          <option>DSA Only</option>
                          <option>Full Stack</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Proctoring Settings</CardTitle>
                    <CardDescription className="text-gray-400">Configure monitoring and security options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-700 pb-4">
                      <div>
                        <h4 className="font-medium text-white">Eye Tracking</h4>
                        <p className="text-sm text-gray-400">Monitor candidate attention during assessment</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-gray-600 text-white hover:bg-gray-800">Enabled</Button>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-700 pb-4">
                      <div>
                        <h4 className="font-medium text-white">Screen Recording</h4>
                        <p className="text-sm text-gray-400">Record candidate screen activity</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-gray-600 text-white hover:bg-gray-800">Optional</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white">Browser Lock</h4>
                        <p className="text-sm text-gray-400">Prevent tab switching during test</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-gray-600 text-white hover:bg-gray-800">Enabled</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default RecruiterPortal;
