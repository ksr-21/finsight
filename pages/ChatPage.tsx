import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { aiService } from '../services/aiService';
import { api } from '../services/api';
import { Transaction, Currency, User, ChatMessage } from '../types';
import { SparklesIcon, PaperAirplaneIcon, ArrowLeftIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';

interface ChatPageProps {
  user: User;
  transactions: Transaction[];
  currency: Currency;
  balance: number;
}

const ChatPage: React.FC<ChatPageProps> = ({ user, transactions, currency, balance }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const history = await api.getChatMessages(user.uid);
        if (history.length === 0) {
          const welcomeMsg: Omit<ChatMessage, 'id'> = {
            role: 'model',
            text: 'Hello! I am FinSight AI. How can I help you with your finances today?',
            timestamp: new Date().toISOString()
          };
          const saved = await api.addChatMessage(user.uid, welcomeMsg);
          setMessages([saved]);
        } else {
          setMessages(history);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMessages();
  }, [user.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsgText = input;
    setInput('');

    const userMsg: Omit<ChatMessage, 'id'> = {
      role: 'user',
      text: userMsgText,
      timestamp: new Date().toISOString()
    };

    try {
      const savedUserMsg = await api.addChatMessage(user.uid, userMsg);
      setMessages(prev => [...prev, savedUserMsg]);
      setIsTyping(true);

      const response = await aiService.getChatResponse(userMsgText, { transactions, balance });

      const botMsg: Omit<ChatMessage, 'id'> = {
        role: 'model',
        text: response,
        timestamp: new Date().toISOString()
      };

      const savedBotMsg = await api.addChatMessage(user.uid, botMsg);
      setMessages(prev => [...prev, savedBotMsg]);
    } catch (error: any) {
      console.error("Chatbot Error:", error);
      const errorMessage = "I'm sorry, I'm having trouble connecting right now.";
      const errorBotMsg: Omit<ChatMessage, 'id'> = {
        role: 'model',
        text: errorMessage,
        timestamp: new Date().toISOString()
      };
      const savedErrorMsg = await api.addChatMessage(user.uid, errorBotMsg);
      setMessages(prev => [...prev, savedErrorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};
    msgs.forEach(m => {
      const date = new Date(m.timestamp).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-text-secondary">
        <SparklesIcon className="w-12 h-12 animate-pulse text-indigo-500 mb-4" />
        <p className="font-mono text-sm uppercase tracking-widest">Waking up AI...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#efe7de] dark:bg-gray-950 md:relative md:inset-auto md:h-[calc(100vh-5rem)] md:flex-1">
      {/* Header */}
      <div className="sticky top-0 bg-indigo-600 px-4 py-3 text-white flex items-center gap-3 shadow-md z-20">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded-full">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <SparklesIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold leading-tight">FinSight AI</h3>
          <p className="text-[10px] opacity-80 uppercase tracking-tighter">Online assistant</p>
        </div>
      </div>

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar"
      >
        {Object.entries(messageGroups).map(([date, msgs]) => (
          <div key={date} className="space-y-4">
            <div className="flex justify-center">
              <span className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider shadow-sm">
                {date === new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) ? 'Today' : date}
              </span>
            </div>
            {msgs.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`relative max-w-[85%] px-4 py-2 rounded-2xl shadow-sm ${
                  m.role === 'user'
                    ? 'bg-[#dcf8c6] dark:bg-indigo-900 text-gray-900 dark:text-white rounded-tr-none'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none'
                }`}>
                  <p className="text-sm whitespace-pre-wrap pb-3 pr-8">{m.text}</p>
                  <span className="absolute bottom-1 right-2 text-[9px] opacity-50 font-mono">
                    {formatTime(m.timestamp)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#f0f0f0] dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Type a message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="w-full bg-white dark:bg-gray-800 border-none rounded-full px-5 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white shadow-sm"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          aria-label="Send message"
          className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50 flex-shrink-0"
        >
          <PaperAirplaneIcon className="w-6 h-6 rotate-0" />
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
