import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { aiService } from '../services/aiService';
import { Transaction, Currency, CURRENCY_SYMBOLS } from '../types';
import { SparklesIcon, XMarkIcon, PaperAirplaneIcon, UserIcon, BotIcon } from './icons';
import { useNavigate } from 'react-router-dom';

interface AiChatbotProps {
  transactions: Transaction[];
  currency: Currency;
  balance: number;
}

const AiChatbot: React.FC<AiChatbotProps> = ({ transactions, currency, balance }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: 'Hello! I am FinSight AI. How can I help you with your finances today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await aiService.getChatResponse(userMsg, { transactions, balance });
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (error: any) {
      console.error("Chatbot Error:", error);
      let errorMessage = "I'm sorry, I'm having trouble connecting right now.";

      if (error.message?.includes("AI_CONFIG_ERROR")) {
        errorMessage = "AI Chat is currently unavailable: API configuration is missing.";
      } else if (error.message?.includes("401") || error.message?.includes("invalid_api_key")) {
        errorMessage = "I'm having trouble connecting: The API key seems to be invalid.";
      } else if (error.message?.includes("429")) {
        errorMessage = "I'm a bit overwhelmed right now. Please try again in a moment.";
      }

      setMessages(prev => [...prev, { role: 'bot', text: errorMessage }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-[60] md:bottom-8 md:right-8">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 flex h-[calc(100dvh-7rem-env(safe-area-inset-bottom))] max-h-[600px] w-[calc(100vw-1.5rem)] max-w-[400px] flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 md:absolute md:bottom-20 md:right-0 md:h-[min(600px,calc(100dvh-8rem))] md:w-[400px] md:rounded-[2.5rem]"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-indigo-600 p-4 text-white sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <SparklesIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">FinSight AI</h3>
                  <p className="text-[10px] font-mono uppercase tracking-widest opacity-70">Always Online</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-6 sm:p-6"
            >
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      {m.role === 'user' ? <UserIcon className="w-5 h-5" /> : <BotIcon className="w-5 h-5" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-50 dark:bg-gray-900/50 text-text-primary dark:text-white rounded-tl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 p-3 dark:border-gray-700 sm:p-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 pl-4 pr-14 outline-none transition-all focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white sm:py-4 sm:pl-6"
                />
                <button
                  onClick={handleSend}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (window.innerWidth < 768) {
            navigate('/chat');
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 md:h-16 md:w-16 md:rounded-[1.5rem]"
        aria-label={isOpen ? 'Close FinSight AI chat' : 'Open FinSight AI chat'}
      >
        {isOpen ? (
          <XMarkIcon className="h-7 w-7" />
        ) : (
          <SparklesIcon className="h-7 w-7 transition-transform group-hover:rotate-12 md:h-8 md:w-8" />
        )}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
      </motion.button>
    </div>
  );
};

export default AiChatbot;
