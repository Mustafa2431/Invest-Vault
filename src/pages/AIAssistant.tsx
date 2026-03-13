import { useState, useRef, useEffect } from "react";
import {
  Send,
  Brain,
  Sparkles,
  TrendingUp,
  Shield,
  DollarSign,
  PieChart,
} from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are an expert AI investment assistant for Invest Vault, a fintech platform that connects startups with investors. 

Your role is to:
- Help investors understand startup metrics, valuations, equity, and investment strategies
- Guide startup founders on fundraising, pitch preparation, and investor relations
- Explain financial concepts in beginner-friendly language
- Provide insights on portfolio diversification, risk management, and due diligence
- Answer questions about the bidding process, KYC verification, and platform features

Always be professional, concise, and helpful. When discussing numbers, use clear examples. Never provide specific financial advice that could be considered personalized investment recommendations — always remind users to consult a financial advisor for personalized guidance.`;

const QUICK_PROMPTS = [
  { icon: <DollarSign size={14} />, text: "What is startup valuation?" },
  { icon: <TrendingUp size={14} />, text: "How do I evaluate a startup?" },
  { icon: <PieChart size={14} />, text: "How does equity work?" },
  { icon: <Shield size={14} />, text: "What are the investment risks?" },
];

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-3 max-w-[80%]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
          <Brain size={14} className="text-white" />
        </div>
        <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="flex gap-1 items-center h-4">
            <div
              className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isUser,
}: {
  message: Message;
  isUser: boolean;
}) {
  const formattedContent = message.content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /`(.*?)`/g,
      '<code class="bg-slate-700/60 px-1 rounded text-blue-300 text-sm font-mono">$1</code>',
    )
    .replace(/\n/g, "<br/>");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-start gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
            <Brain size={14} className="text-white" />
          </div>
        )}
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 mt-1 text-slate-300 text-xs font-bold">
            You
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-slate-800/70 border border-slate-700/50 text-slate-200 rounded-tl-sm"
          }`}
        >
          <p
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
          <p
            className={`text-xs mt-1.5 ${isUser ? "text-blue-200" : "text-slate-500"}`}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI investment assistant powered by Gemini. I can help you understand investment terms, analyze startup metrics, guide you through the bidding process, and much more.\n\nWhat would you like to know today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendToGemini = async (userMessage: string, history: Message[]) => {
    const conversationHistory = history.slice(1).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const requestBody = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    };

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.error?.message || "Gemini API error");
    }

    const data = await response.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not generate a response."
    );
  };

  const handleSend = async (question?: string) => {
    const userMessage = question || input.trim();
    if (!userMessage || loading) return;

    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const responseText = await sendToGemini(userMessage, updatedMessages);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: responseText,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Gemini API error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I encountered an error connecting to the AI service. Please check your API key configuration or try again later.\n\n*Error: ${error instanceof Error ? error.message : "Unknown error"}*`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showQuickPrompts = messages.length === 1;

  return (
    <DashboardLayout>
      <div className="p-6 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">
                AI Investment Assistant
              </h1>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-600/20 border border-blue-500/30 rounded-full text-xs text-blue-400">
                <Sparkles size={10} />
                Gemini Powered
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">
              Expert guidance on startup investing
            </p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-slate-800/30 border border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                isUser={message.role === "user"}
              />
            ))}

            {loading && <TypingIndicator />}

            {/* Quick prompts shown only at start */}
            {showQuickPrompts && !loading && (
              <div className="pt-4">
                <p className="text-xs text-slate-500 mb-3 text-center">
                  Try asking about:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt.text}
                      onClick={() => handleSend(prompt.text)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/60 border border-slate-700 hover:border-blue-500/50 rounded-full text-xs text-slate-300 hover:text-white transition-all duration-200"
                    >
                      <span className="text-blue-400">{prompt.icon}</span>
                      {prompt.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about startup investing... (Enter to send, Shift+Enter for new line)"
                  rows={1}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all text-sm leading-relaxed"
                  disabled={loading}
                  style={{ minHeight: "48px", maxHeight: "120px" }}
                />
              </div>
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:shadow-none"
              >
                <Send
                  size={18}
                  className={loading ? "text-slate-500" : "text-white"}
                />
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2 text-center">
              AI responses are for informational purposes only. Consult a
              financial advisor for personalized advice.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
