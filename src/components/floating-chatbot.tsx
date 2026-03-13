import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X } from "lucide-react";

const knowledgeBase = {
  // Basic Startup & Investment Knowledge
  "What is a startup?":
    "A startup is a new company founded to solve a problem or fulfill a need. It's usually small initially, grows quickly, and often focuses on innovation.",
  "What is equity?":
    "Equity is ownership in a company. When you invest equity, you own a percentage of the business.",
  "How does Invest Vault work?":
    "Invest Vault connects founders needing capital with investors wanting growth opportunities through profiles, bidding, and AI matching.",
  "What is a VC?":
    "A VC is someone who invests money in promising early-stage companies in exchange for ownership stake and provides mentorship.",
  "How do I raise funds?":
    "Create a detailed founder profile with business story, metrics, and funding goal. Review investor bids and choose the best fit.",
  "Is it safe?":
    "Yes! Enterprise-grade encryption, verified profiles, background checks, and secure payments.",
  default:
    "Great question! Here's some info on startups: Startups need funding to hire, build, and grow before profitable. Invest Vault helps connect them with investors.",
};

const suggestedQuestions = [
  "What is a startup?",
  "How does Invest Vault work?",
  "What is equity?",
  "How do I raise funds?",
  "Is it safe?",
];

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  type Message = {
    id: string;
    text: string;
    sender: "bot" | "user";
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm Invest Vault AI Mentor. Ask about startups, funding, or platform!",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    setInput("");
    const userMsg: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const key =
        (Object.keys(knowledgeBase).find((k) =>
          messageText
            .toLowerCase()
            .includes(k.toLowerCase().replace(/[?]/g, "")),
        ) as keyof typeof knowledgeBase) || "default";
      const response = knowledgeBase[key];
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: response,
          sender: "bot",
        },
      ]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-2xl hover:bg-primary/90 transition-all z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100%-2rem)] h-[500px] backdrop-blur-lg bg-black/30 border border-white/10 rounded-2xl flex flex-col shadow-2xl z-50"
          >
            <div className="border-b border-white/10 p-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <h3 className="font-semibold text-white">Invest Vault AI</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg max-w-xs text-sm ${
                      msg.sender === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="px-4 py-2 rounded-lg bg-gray-700">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/10 flex gap-2 bg-black/20">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask about funding..."
                className="flex-1 bg-black/50 text-white placeholder-gray-400 rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:border-blue-500 transition text-sm"
              />
              <button
                onClick={() => handleSendMessage()}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {messages.length === 1 && (
              <div className="px-4 py-2 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-1">Try:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedQuestions.slice(0, 3).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      className="text-xs px-2 py-1 rounded-full border border-blue-500/50 text-gray-300 hover:bg-blue-500/20 transition"
                    >
                      {q.slice(0, 20)}...
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
