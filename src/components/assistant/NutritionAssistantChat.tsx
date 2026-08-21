import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ChatMessage, 
  PersonalHealthProfile, 
  HealthCalculations, 
  DailyMealPlan 
} from '../../types';
import { getNutritionAssistantResponse } from '../../services/aiAssistantService';
import { AskNutriGuideLogo } from '../common/AskNutriGuideLogo';
import { 
  Send, 
  AlertCircle, 
  User, 
  ShieldCheck, 
  Lightbulb, 
  Info,
  RotateCcw
} from 'lucide-react';

interface NutritionAssistantChatProps {
  profile?: PersonalHealthProfile | null;
  calculations?: HealthCalculations | null;
  currentMealPlan?: DailyMealPlan | null;
  activeContext?: string;
  onNavigateToProfile?: () => void;
  className?: string;
}

const STARTER_QUESTIONS = [
  "What is my BMI?",
  "Suggest me some low calorie foods.",
  "What can I use instead of rice?",
  "How many calories are in masoor dal?",
  "Explain my daily meal plan."
];

const WELCOME_MESSAGE = `Hello! 👋 I'm Ask NutriGuide, your dedicated AI Nutrition Assistant for authentic Bangladeshi diets.

I can help explain your BMI and TDEE, break down your daily meal plan, suggest nutritious alternatives from the Bangladesh Food Database, and share healthy cooking tips based on your profile.

How can I help you today?`;

export const NutritionAssistantChat: React.FC<NutritionAssistantChatProps> = ({
  profile,
  calculations,
  currentMealPlan,
  activeContext = 'Dashboard View',
  onNavigateToProfile,
  className = ''
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      content: WELCOME_MESSAGE,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Clean up in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    // Cancel any ongoing in-flight request before starting fresh
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentRequestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    activeRequestIdRef.current = currentRequestId;

    setErrorNotice(null);
    setLastFailedQuery(null);
    setInputQuery('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Capture the existing history before appending user message
    const previousHistory = [...messages];
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await getNutritionAssistantResponse(query, {
        profile,
        calculations,
        currentMealPlan,
        activeContext,
        chatHistory: [...previousHistory, userMsg],
        signal: controller.signal,
      });

      // Ignore stale response if a newer request has been initiated
      if (activeRequestIdRef.current !== currentRequestId) {
        return;
      }

      setIsLoading(false);

      if (res.error && !res.answer) {
        setErrorNotice(res.error);
        setLastFailedQuery(query);
        return;
      }

      if (res.answer) {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          sender: 'assistant',
          content: res.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      if (activeRequestIdRef.current !== currentRequestId) {
        return;
      }
      setIsLoading(false);
      if (err.name !== 'AbortError') {
        setErrorNotice(err.message || 'Unable to complete request. Please try again.');
        setLastFailedQuery(query);
      }
    }
  };

  const handleRetry = () => {
    if (lastFailedQuery) {
      handleSendMessage(lastFailedQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`bg-[#fdfcf8] rounded-3xl border border-warm shadow-xl flex flex-col h-[580px] max-h-[85vh] overflow-hidden ${className}`}>
      
      {/* Header */}
      <div className="bg-clay p-4 sm:p-5 border-b border-warm flex items-center justify-between gap-3 shrink-0">
        <AskNutriGuideLogo size="md" variant="full" theme="light" />

        {/* Active Context Chip */}
        <div className="hidden sm:flex items-center gap-2 bg-[#fdfcf8] px-3 py-1.5 rounded-xl border border-warm text-[11px] text-slate-600">
          <Info className="w-3.5 h-3.5 text-olive" />
          <span>Context: <strong className="text-slate-800">{activeContext}</strong></span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
        
        {/* Context Attachment Info Banner */}
        <div className="bg-clay/60 border border-warm rounded-2xl p-3 text-[11px] text-slate-600 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-olive shrink-0" />
            <span>
              Connected to: {profile ? `Profile (${profile.name})` : 'Guest Profile'} • {currentMealPlan ? 'Meal Plan Active' : 'No Active Plan'}
            </span>
          </div>
          {!profile && onNavigateToProfile && (
            <button
              onClick={onNavigateToProfile}
              className="text-olive font-bold hover:underline cursor-pointer text-[11px]"
            >
              Add Health Profile →
            </button>
          )}
        </div>

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className="shrink-0">
                {isUser ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2c3333] text-white text-xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                ) : (
                  <AskNutriGuideLogo size="sm" variant="icon-only" theme="colored" />
                )}
              </div>

              <div className={`space-y-1 ${isUser ? 'text-right' : 'text-left'}`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-olive text-white rounded-tr-xs shadow-xs'
                      : 'bg-clay border border-warm text-[#2c3333] rounded-tl-xs shadow-xs'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap font-sans">
                      {typeof msg.content === 'string' ? msg.content : String(msg.content || '')}
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none text-[#2c3333] space-y-1.5 [&_p]:my-1 [&_ul]:my-1.5 [&_ul]:pl-4 [&_ul]:list-disc [&_ol]:my-1.5 [&_ol]:pl-4 [&_ol]:list-decimal [&_li]:my-0.5 [&_strong]:font-semibold [&_strong]:text-[#1a241e] [&_h3]:text-xs sm:[&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-olive">
                      <ReactMarkdown>{typeof msg.content === 'string' ? msg.content : String(msg.content || '')}</ReactMarkdown>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center">
            <div className="shrink-0">
              <AskNutriGuideLogo size="sm" variant="icon-only" theme="colored" />
            </div>
            <div className="bg-clay border border-warm p-4 rounded-2xl rounded-tl-xs flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Thinking...</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-olive rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-olive rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-olive rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {errorNotice && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <p>{errorNotice}</p>
            </div>
            {lastFailedQuery && (
              <button
                onClick={handleRetry}
                className="px-2.5 py-1 bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            )}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Starter Questions Row */}
      {messages.length <= 3 && (
        <div className="px-4 py-2 bg-clay/30 border-t border-warm shrink-0 overflow-x-auto scrollbar-none flex items-center gap-2 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-500" /> Suggestions:
          </span>
          {STARTER_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-[#fdfcf8] hover:bg-olive hover:text-white border border-warm rounded-full text-slate-700 whitespace-nowrap transition-all cursor-pointer font-medium shadow-2xs text-[11px]"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 sm:p-4 bg-clay border-t border-warm shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about calories, masoor dal, rui fish, meal swaps..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-[#fdfcf8] border border-warm rounded-2xl text-xs sm:text-sm text-[#2c3333] focus:outline-none focus:ring-2 focus:ring-olive/20 focus:border-olive transition-all"
          />

          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-5 py-3 bg-olive hover:bg-[#4a6854] text-white rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        <p className="text-[10px] text-slate-400 text-center pt-2">
          Nutri Guide AI provides general wellness guidance and does not replace medical advice.
        </p>
      </div>

    </div>
  );
};
