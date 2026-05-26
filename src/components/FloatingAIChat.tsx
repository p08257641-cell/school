import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Minus, Maximize2, MessageSquare, Sparkles, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { safeAiFetch } from '../lib/aiUtils';
import { generateAIResponse } from '../lib/api';
import { API_BASE_URL } from '../constants';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface RoleConfig {
  themeColor: 'indigo' | 'amber' | 'emerald';
  headerBg: string;
  botIconBg: string;
  msgAiBg: string;
  sendBtnBg: string;
  title: string;
  welcomeMessage: string;
  systemPrompt: string;
  suggestions: { label: string; text: string }[];
}

const DEFAULT_CONFIG: RoleConfig = {
  themeColor: 'indigo',
  headerBg: 'bg-indigo-600',
  botIconBg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
  msgAiBg: 'bg-white dark:bg-zinc-800 rounded-2xl rounded-tl-none border border-zinc-100 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200',
  sendBtnBg: 'bg-indigo-600 hover:bg-indigo-700',
  title: 'OmniAI Assistant',
  welcomeMessage: 'Hello! I\'m OmniAI assistant. How can I help you today?',
  systemPrompt: 'You are OmniAI, a helpful assistant for SchoolHub school management system.',
  suggestions: []
};

const ROLE_CONFIGS: Record<string, Partial<RoleConfig>> = {
  SUPER_ADMIN: {
    themeColor: 'amber',
    headerBg: 'bg-amber-950 border-b border-amber-500/20 text-amber-500',
    botIconBg: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    msgAiBg: 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl rounded-tl-none',
    sendBtnBg: 'bg-amber-600 hover:bg-amber-700 text-zinc-950 font-bold',
    title: 'OmniAI Executive Console',
    welcomeMessage: 'Welcome, Administrator. I am configured with the OmniAI Executive Prompt to assist you with school operations, platform statistics, and administrative workflows. How may I assist you today?',
    systemPrompt: `You are OmniAI, a senior executive advisor for SchoolHub. 
    You assist the school administrator with high-level decisions, school analytics, student academic trends, and staff management.
    When asked to draft circulars, announcements, or notifications, generate professional, well-structured emails/memos with placeholders where relevant.
    When asked about whistleblower reports, staff leave, daily collections, or admissions, guide them on how to access these modules or analyze the metadata provided.`,
    suggestions: [
      { label: '📊 School Stats', text: 'Show school statistics' },
      { label: '📈 Performance Insights', text: 'Generate performance insights' },
      { label: '📋 Whistleblower Reports', text: 'View recent whistleblower reports' },
      { label: '🪵 Audit Logs', text: 'Show recent audit logs' },
      { label: '💰 Daily Collections', text: 'Show daily collections report' },
      { label: '🚪 Staff Leave Requests', text: 'Show pending staff leave requests' },
      { label: '📢 Draft Circular Notice', text: 'Draft a circular notice about upcoming school activities' },
      { label: '🎓 Student Admissions', text: 'Show pending student applications' },
      { label: '💼 Recruitment Candidates', text: 'List recruitment candidates' }
    ]
  },
  SCHOOL_ADMIN: {
    themeColor: 'amber',
    headerBg: 'bg-amber-950 border-b border-amber-500/20 text-amber-500',
    botIconBg: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    msgAiBg: 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl rounded-tl-none',
    sendBtnBg: 'bg-amber-600 hover:bg-amber-700 text-zinc-950 font-bold',
    title: 'OmniAI Executive Console',
    welcomeMessage: 'Welcome, Administrator. I am configured with the OmniAI Executive Prompt to assist you with school operations, platform statistics, and administrative workflows. How may I assist you today?',
    systemPrompt: `You are OmniAI, a senior executive advisor for SchoolHub. 
    You assist the school administrator with high-level decisions, school analytics, student academic trends, and staff management.
    When asked to draft circulars, announcements, or notifications, generate professional, well-structured emails/memos with placeholders where relevant.
    When asked about whistleblower reports, staff leave, daily collections, or admissions, guide them on how to access these modules or analyze the metadata provided.`,
    suggestions: [
      { label: '📊 School Stats', text: 'Show school statistics' },
      { label: '📈 Performance Insights', text: 'Generate performance insights' },
      { label: '📋 Whistleblower Reports', text: 'View recent whistleblower reports' },
      { label: '🪵 Audit Logs', text: 'Show recent audit logs' },
      { label: '💰 Daily Collections', text: 'Show daily collections report' },
      { label: '🚪 Staff Leave Requests', text: 'Show pending staff leave requests' },
      { label: '📢 Draft Circular Notice', text: 'Draft a circular notice about upcoming school activities' },
      { label: '🎓 Student Admissions', text: 'Show pending student applications' },
      { label: '💼 Recruitment Candidates', text: 'List recruitment candidates' }
    ]
  },
  STAFF: {
    themeColor: 'emerald',
    headerBg: 'bg-emerald-600 text-white',
    botIconBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
    msgAiBg: 'bg-white dark:bg-zinc-800 rounded-2xl rounded-tl-none border border-zinc-100 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200',
    sendBtnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    title: 'OmniAI Educator Assistant',
    welcomeMessage: 'Hello Teacher! I\'m your OmniAI teaching assistant. Let\'s work together to create lesson notes, build assignments, or check your classes/subjects. What are we planning today?',
    systemPrompt: `You are OmniAI, a direct classroom teaching assistant for SchoolHub. 
    Focus on curriculum design, grading, class timetables, lesson planning, and student assignments.`,
    suggestions: [
      { label: '📝 Create Assignment', text: 'Create an assignment' },
      { label: '📖 Generate Lesson Note', text: 'Generate a lesson note' },
      { label: '🗓️ Show Timetable', text: 'Show my teaching timetable' },
      { label: '🎒 List Subjects', text: 'List my subjects' }
    ]
  },
  HOD: {
    themeColor: 'emerald',
    headerBg: 'bg-emerald-600 text-white',
    botIconBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
    msgAiBg: 'bg-white dark:bg-zinc-800 rounded-2xl rounded-tl-none border border-zinc-100 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200',
    sendBtnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    title: 'OmniAI Educator Assistant',
    welcomeMessage: 'Hello Head of Department! I\'m your OmniAI teaching assistant. Let\'s work together to create lesson notes, build assignments, or check department classes/subjects. What are we planning today?',
    systemPrompt: `You are OmniAI, a direct classroom teaching assistant and HOD for SchoolHub. 
    Focus on curriculum design, grading, class timetables, lesson planning, and student assignments.`,
    suggestions: [
      { label: '📝 Create Assignment', text: 'Create an assignment' },
      { label: '📖 Generate Lesson Note', text: 'Generate a lesson note' },
      { label: '🗓️ Show Timetable', text: 'Show my teaching timetable' },
      { label: '🎒 List Subjects', text: 'List my subjects' }
    ]
  }
};

const getRoleConfig = (role?: string): RoleConfig => {
  const base = { ...DEFAULT_CONFIG };
  if (role && ROLE_CONFIGS[role]) {
    return { ...base, ...ROLE_CONFIGS[role] };
  }
  return base;
};

const getThemeBorderHover = (color: string) => {
  if (color === 'amber') return 'hover:border-amber-500 dark:hover:border-amber-400';
  if (color === 'emerald') return 'hover:border-emerald-500 dark:hover:border-emerald-400';
  return 'hover:border-indigo-500 dark:hover:border-indigo-400';
};

const getFocusRing = (color: string) => {
  if (color === 'amber') return 'focus:ring-amber-500';
  if (color === 'emerald') return 'focus:ring-emerald-500';
  return 'focus:ring-indigo-500';
};

export function FloatingAIChat({ organization, currentUser, currentRole }: { organization?: any, currentUser?: any, currentRole?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const config = getRoleConfig(currentRole);

  useEffect(() => {
    if (messages.length === 0) {
      const userName = currentUser?.name || currentUser?.full_name || 'User';
      let content = config.welcomeMessage;
      if (currentRole === 'SCHOOL_ADMIN' || currentRole === 'SUPER_ADMIN') {
        content = `Welcome, Administrator ${userName}. I am configured as your OmniAI Executive Assistant to help you manage school operations, track platform metrics, draft announcements, and analyze student or staff trends. How can I assist you in running the school today?`;
      } else if (currentRole === 'STAFF') {
        content = `Hello Teacher ${userName}! I'm your OmniAI teaching assistant. Let's work together to create lesson notes, build assignments, or check your classes/subjects. What are we planning today?`;
      } else if (currentRole === 'HOD') {
        content = `Hello ${userName}! As Head of Department, I am your OmniAI assistant. Let's work together to manage department resources, create lesson notes, or build assignments. What are we planning today?`;
      } else {
        content = `Hello ${userName}! I'm OmniAI, your assistant for ${organization?.name || 'SchoolHub'}. How can I help you today?`;
      }
      
      setMessages([
        {
          role: 'ai',
          content,
          timestamp: new Date()
        }
      ]);
    }
  }, [currentUser, currentRole, organization]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (customPrompt?: string) => {
    const prompt = (customPrompt || input).trim();
    if (!prompt || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customPrompt) {
      setInput('');
    }
    setIsLoading(true);

    try {
      const result = await generateAIResponse(prompt, {
        systemPrompt: `${config.systemPrompt}
        You are currently assisting ${currentUser?.name || 'a user'} who is logged in as a ${currentRole || 'user'}. 
        The school is ${organization?.name || 'SchoolHub'}.
        Keep responses concise, professional, and aware of the user's role.`
      });

      const aiMessage: Message = {
        role: 'ai',
        content: result?.text || "I'm sorry, I couldn't process that request.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `Sorry, I'm having trouble connecting right now (Error: ${error?.message || 'Unknown'}). Please try again later.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    handleSend(text);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[380px] h-[520px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className={cn("p-4 flex items-center justify-between", config.headerBg)}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{config.title}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] opacity-80 font-medium uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-50 dark:bg-zinc-950/50"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    msg.role === 'ai' ? config.botIconBg : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                  )}>
                    {msg.role === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className={cn(
                    "p-3 text-sm shadow-sm whitespace-pre-wrap",
                    msg.role === 'ai'
                      ? config.msgAiBg
                      : cn(
                          "text-white rounded-2xl rounded-tr-none",
                          config.themeColor === 'amber' ? "bg-amber-600" :
                          config.themeColor === 'emerald' ? "bg-emerald-600" : "bg-indigo-600"
                        )
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    config.botIconBg
                  )}>
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl rounded-tl-none border border-zinc-100 dark:border-zinc-700 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {config.suggestions.length > 0 && messages.length <= 2 && (
              <div className="px-4 py-2 bg-zinc-100/70 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2 justify-center max-h-[140px] overflow-y-auto">
                {config.suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(sug.text)}
                    className={cn(
                      "text-[10px] md:text-[11px] px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-zinc-700 dark:text-zinc-300 transition-colors shadow-sm cursor-pointer",
                      getThemeBorderHover(config.themeColor)
                    )}
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className={cn(
                    "w-full pl-4 pr-12 py-3 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl text-sm focus:ring-2 transition-all outline-none",
                    getFocusRing(config.themeColor)
                  )}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white",
                    config.sendBtnBg
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-center text-zinc-500 mt-2 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" /> Powered by OmniAI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (isMinimized) setIsMinimized(false);
          else setIsOpen(!isOpen);
        }}
        className={cn(
          "w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300",
          isOpen ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" :
          config.themeColor === 'amber' ? "bg-amber-600 text-zinc-950 font-bold" :
          config.themeColor === 'emerald' ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"
        )}
      >
        {isOpen && !isMinimized ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-zinc-50 dark:border-zinc-950 rounded-full" />
        )}
      </motion.button>

      {/* Minimized Bar */}
      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => setIsMinimized(false)}
            className="absolute bottom-0 right-16 h-14 px-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-xl flex items-center gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              config.themeColor === 'amber' ? "bg-amber-500" :
              config.themeColor === 'emerald' ? "bg-emerald-500" : "bg-indigo-500"
            )} />
            <span className="text-sm font-bold text-zinc-900 dark:text-white">OmniAI is active</span>
            <Maximize2 className="w-4 h-4 text-zinc-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
