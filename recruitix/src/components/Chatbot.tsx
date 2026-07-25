
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your Recruitix assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');

  const responses: Record<string, string> = {
    'hello': "Hello! Welcome to Recruitix. I can help you navigate through the platform.",
    'help': "I can assist you with: 1) Understanding the assessment process 2) Technical requirements 3) How to prepare for interviews 4) Platform navigation",
    'assessment': "Our assessment has 3 rounds: Technical (25 questions), Live Interview (10 coding problems), and HR Simulation (10 behavioral questions). You can access any round at any time!",
    'technical': "The technical round includes DSA, aptitude, and quantitative questions. No minimum score required to proceed!",
    'interview': "The live interview focuses on coding problems and system design. Take your time and think through the solutions.",
    'hr': "The HR round evaluates communication skills, cultural fit, and behavioral responses. Be authentic and confident!",
    'roles': "We support assessments for Software Engineer, AI/ML Engineer, Data Scientist, and Product Manager roles.",
    'login': "You can create an account using your email. We'll send you an OTP for verification.",
    'forgot': "Click 'Forgot Password' on the login page and we'll send you a reset link via email.",
    'dashboard': "Recruiters can track candidate progress in real-time through our comprehensive dashboard.",
    'theme': "You can toggle between light and dark themes using the theme button in the top navigation.",
    'default': "I'm here to help! You can ask me about assessments, login issues, platform features, or anything else about Recruitix."
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage = { id: Date.now(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);

    // Simple keyword-based response
    const lowerInput = inputText.toLowerCase();
    let response = responses.default;
    
    for (const [keyword, res] of Object.entries(responses)) {
      if (lowerInput.includes(keyword)) {
        response = res;
        break;
      }
    }

    setTimeout(() => {
      const botMessage = { id: Date.now() + 1, text: response, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    }, 500);

    setInputText('');
  };

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg z-50 ${isOpen ? 'hidden' : 'flex'} items-center justify-center`}
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 h-96 bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between p-4 bg-blue-500 text-white rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <CardTitle className="text-sm">Recruitix Assistant</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-600 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${message.sender === 'user' ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      {message.sender === 'user' ? (
                        <User className="w-3 h-3 text-white" />
                      ) : (
                        <Bot className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                      )}
                    </div>
                    <div className={`px-3 py-2 rounded-lg text-sm ${
                      message.sender === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}>
                      {message.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t dark:border-slate-700">
              <div className="flex space-x-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 dark:bg-slate-700 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} size="icon" className="bg-blue-500 hover:bg-blue-600">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default Chatbot;
