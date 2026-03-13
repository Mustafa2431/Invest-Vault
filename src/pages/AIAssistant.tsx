import { useState } from 'react';
import { Send, Brain, Loader } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI investment assistant. I can help you understand investment terms, analyze startup metrics, and guide you through the investment process. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const predefinedQuestions = [
    'What is startup valuation?',
    'How do I evaluate a startup?',
    'What is equity and how does it work?',
    'What are the risks of startup investing?',
    'How do I diversify my portfolio?',
  ];

  const handleSend = async (question?: string) => {
    const userMessage = question || input;
    if (!userMessage.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: getLocalResponse(userMessage),
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: getLocalResponse(userMessage),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getLocalResponse = (question: string) => {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('valuation')) {
      return 'Startup valuation is the process of determining the current worth of a startup company. It considers factors like revenue, growth rate, market size, team experience, and comparable company valuations. Common methods include the venture capital method, discounted cash flow, and market multiples approach.';
    }

    if (lowerQuestion.includes('evaluate') || lowerQuestion.includes('analyze')) {
      return 'When evaluating a startup, consider: 1) Team quality and experience, 2) Market size and growth potential, 3) Product-market fit and traction, 4) Business model and unit economics, 5) Competitive advantage, 6) Financial metrics (revenue, growth rate, burn rate), 7) Exit potential. Always conduct thorough due diligence before investing.';
    }

    if (lowerQuestion.includes('equity')) {
      return 'Equity represents ownership in a company. When you invest in a startup, you receive equity (shares) in exchange for your capital. The percentage of equity determines your ownership stake and potential returns if the company succeeds. For example, if you own 5% equity and the company is acquired for $10M, your shares would be worth $500K (minus any preferences or dilution).';
    }

    if (lowerQuestion.includes('risk')) {
      return 'Startup investing carries significant risks: 1) High failure rate (most startups fail), 2) Illiquidity (cannot easily sell your shares), 3) Dilution (your ownership may decrease in future rounds), 4) Long time horizon (5-10 years to exit), 5) Total loss potential. Only invest money you can afford to lose and diversify your portfolio.';
    }

    if (lowerQuestion.includes('diversif')) {
      return 'Portfolio diversification reduces risk by spreading investments across multiple startups. Best practices: 1) Invest in different industries, 2) Mix different stages (early, growth, late), 3) Limit any single investment to 5-10% of portfolio, 4) Consider geographical diversity, 5) Balance high-risk/high-reward with safer bets. Aim for at least 10-15 startups in your portfolio.';
    }

    return 'That\'s a great question! I can help you with information about startup investing, valuation, equity, risk management, and portfolio strategy. Feel free to ask specific questions about these topics or any startup-related financial concepts.';
  };

  return (
    <DashboardLayout>
      <div className="p-8 h-[calc(100vh-4rem)]">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">AI Investment Assistant</h1>
            <p className="text-slate-400">Get expert guidance on startup investing</p>
          </div>

          <Card className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800/50 text-slate-200'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain size={16} className="text-blue-400" />
                        <span className="text-sm font-medium text-blue-400">AI Assistant</span>
                      </div>
                    )}
                    <p className="leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <Loader className="animate-spin text-blue-400" size={20} />
                  </div>
                </div>
              )}
            </div>

            {messages.length === 1 && (
              <div className="p-6 border-t border-slate-700">
                <p className="text-sm text-slate-400 mb-3">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {predefinedQuestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => handleSend(question)}
                      className="px-3 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 transition-all"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-6 border-t border-slate-700">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything about startup investing..."
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <Button onClick={() => handleSend()} disabled={loading || !input.trim()}>
                  <Send size={20} />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
