
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Code, Brain, BarChart3, Users, Play } from 'lucide-react';

interface RoleSelectorProps {
  onRoleSelect: (role: string, techStack: string[]) => void;
  onBack: () => void;
}

const RoleSelector = ({ onRoleSelect, onBack }: RoleSelectorProps) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [customTechStack, setCustomTechStack] = useState('');
  const [selectedTechStack, setSelectedTechStack] = useState<string[]>([]);

  const roles = [
    {
      id: 'software-engineer',
      title: 'Software Engineer',
      description: 'Full stack development, system design, and problem solving',
      icon: Code,
      defaultStack: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git'],
      color: 'from-gray-700 to-black'
    },
    {
      id: 'ai-ml-engineer',
      title: 'AI/ML Engineer',
      description: 'Machine learning models, data analysis, and AI implementation',
      icon: Brain,
      defaultStack: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy'],
      color: 'from-gray-600 to-gray-800'
    },
    {
      id: 'data-scientist',
      title: 'Data Scientist',
      description: 'Statistical analysis, data visualization, and predictive modeling',
      icon: BarChart3,
      defaultStack: ['Python', 'R', 'SQL', 'Tableau', 'Apache Spark', 'Statistics'],
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'product-manager',
      title: 'Product Manager',
      description: 'Product strategy, user experience, and business analysis',
      icon: Users,
      defaultStack: ['Analytics', 'Strategy', 'UX Design', 'Agile', 'Market Research'],
      color: 'from-orange-500 to-red-500'
    }
  ];

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    const role = roles.find(r => r.id === roleId);
    if (role) {
      setSelectedTechStack(role.defaultStack);
    }
  };

  const handleTechStackAdd = () => {
    if (customTechStack.trim()) {
      const newTechs = customTechStack.split(',').map(tech => tech.trim()).filter(tech => tech);
      setSelectedTechStack(prev => [...new Set([...prev, ...newTechs])]);
      setCustomTechStack('');
    }
  };

  const removeTech = (techToRemove: string) => {
    setSelectedTechStack(prev => prev.filter(tech => tech !== techToRemove));
  };

  const handleStartAssessment = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole, selectedTechStack);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Select Your Role</h1>
            <div></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {roles.map((role) => {
              const IconComponent = role.icon;
              return (
                <Card 
                  key={role.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    selectedRole === role.id 
                      ? 'ring-2 ring-black dark:ring-white bg-gray-50 dark:bg-gray-800' 
                      : 'bg-white/80 dark:bg-slate-800/80'
                  } backdrop-blur-sm`}
                  onClick={() => handleRoleChange(role.id)}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${role.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl dark:text-white">{role.title}</CardTitle>
                        <CardDescription className="dark:text-slate-300">{role.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {role.defaultStack.slice(0, 4).map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {role.defaultStack.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.defaultStack.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedRole && (
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="dark:text-white">Customize Tech Stack</CardTitle>
                <CardDescription className="dark:text-slate-300">
                  Add or remove technologies relevant to your assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 min-h-[2rem]">
                  {selectedTechStack.map((tech) => (
                    <Badge 
                      key={tech} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                      onClick={() => removeTech(tech)}
                    >
                      {tech} ×
                    </Badge>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="techStack" className="dark:text-white">Add Technologies</Label>
                    <Input
                      id="techStack"
                      value={customTechStack}
                      onChange={(e) => setCustomTechStack(e.target.value)}
                      placeholder="e.g., Docker, Kubernetes, AWS (comma-separated)"
                      className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      onKeyPress={(e) => e.key === 'Enter' && handleTechStackAdd()}
                    />
                  </div>
                  <Button onClick={handleTechStackAdd} className="mt-6">
                    Add
                  </Button>
                </div>

                <Button 
                  onClick={handleStartAssessment}
                  className="w-full bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Assessment
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
