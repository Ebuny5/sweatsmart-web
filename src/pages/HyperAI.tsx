import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Send, Sparkles, Loader2, Copy, Check, Download, Mic, MicOff,
  Plus, MessageSquare, Trash2, Volume2, VolumeX, FileText, ChevronRight,
  Zap, Wind, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useEpisodes } from '@/hooks/useEpisodes';
import { useProfile } from '@/hooks/useProfile';
import { useClimateData } from '@/hooks/useClimateData';
import { edaManager } from '@/utils/edaManager';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isReport?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// ── Neural Glow pulse animation (CSS injected once) ───────────────────────────
const NEURAL_GLOW_STYLE = `
@keyframes neuralPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0,188,212,0.4), 0 0 0 0 rgba(0,188,212,0.2); transform: scale(1); }
  50%       { box-shadow: 0 0 0 16px rgba(0,188,212,0.0), 0 0 32px 8px rgba(0,188,212,0.15); transform: scale(1.04); }
}
@keyframes neuralIdle {
  0%, 100% { box-shadow: 0 0 8px 2px rgba(0,188,212,0.15); }
  50%       { box-shadow: 0 0 16px 4px rgba(0,188,212,0.3); }
}
@keyframes liquidShimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes typingDot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%            { transform: scale(1); opacity: 1; }
}
.neural-thinking { animation: neuralPulse 1.4s ease-in-out infinite; }
.neural-idle     { animation: neuralIdle 3s ease-in-out infinite; }
.typing-dot-1    { animation: typingDot 1.2s ease-in-out infinite 0.0s; }
.typing-dot-2    { animation: typingDot 1.2s ease-in-out infinite 0.2s; }
.typing-dot-3    { animation: typingDot 1.2s ease-in-out infinite 0.4s; }
`;

// ── Suggestion prompts ────────────────────────────────────────────────────────
const SUGGESTION_PROMPTS = [
  { icon: "📊", text: "Analyse my episode patterns & charts" },
  { icon: "💧", text: "Why do my palms sweat when I'm nervous?" },
  { icon: "💊", text: "What treatments work best for foot sweating?" },
  { icon: "🧘", text: "Help me break the anxiety-sweat cycle" },
  { icon: "📋", text: "Generate my warrior report for my dermatologist" },
  { icon: "🌡️", text: "How does today's climate affect my sweating?" },
];

// ── EDA status pill ───────────────────────────────────────────────────────────
const EdaPill = ({ value, phase }: { value: number; phase: string }) => {
  const cfg = phase === 'TRIGGER'
    ? { bg: 'bg-red-900/40', border: 'border-red-500/50', text: 'text-red-300', dot: 'bg-red-400' }
    : phase === 'ACTIVE'
    ? { bg: 'bg-amber-900/40', border: 'border-amber-500/50', text: 'text-amber-300', dot: 'bg-amber-400' }
    : { bg: 'bg-teal-900/40', border: 'border-teal-500/50', text: 'text-teal-300', dot: 'bg-teal-400' };

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      <Zap className={`h-3 w-3 ${cfg.text}`} />
      <span className={`text-[10px] font-bold ${cfg.text}`}>{value.toFixed(1)} µS</span>
    </div>
  );
};

// ── Message bubble ────────────────────────────────────────────────────────────
const MessageBubble = ({
  message, index, copiedIndex, isSpeaking,
  onCopy, onSpeak,
}: {
  message: Message; index: number; copiedIndex: number | null; isSpeaking: boolean;
  onCopy: (text: string, idx: number) => void;
  onSpeak: (text: string) => void;
}) => {
  const isUser = message.role === 'user';
  const isReport = message.isReport;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[78%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2.5">
      {/* AI avatar dot */}
      <div
        className="w-7 h-7 rounded-full shrink-0 mt-0.5 flex items-center justify-center neural-idle"
        style={{
          background: 'linear-gradient(135deg, #00BCD4, #0097A7)',
          boxShadow: '0 0 12px rgba(0,188,212,0.4)',
        }}
      >
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>

      <div className="max-w-[80%] space-y-1">
        {/* Glass bubble */}
        <div
          className={`px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed ${
            isReport ? 'font-mono text-xs' : ''
          }`}
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            color: '#e2e8f0',
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.content}
        </div>

        {/* Action row */}
        {message.content && (
          <div className="flex items-center gap-1 pl-1">
            <button
              onClick={() => onCopy(message.content, index)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Copy"
            >
              {copiedIndex === index
                ? <Check className="h-3.5 w-3.5 text-teal-400" />
                : <Copy className="h-3.5 w-3.5 text-white/30 hover:text-white/60" />
              }
            </button>
            <button
              onClick={() => onSpeak(message.content)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Read aloud"
            >
              {isSpeaking
                ? <VolumeX className="h-3.5 w-3.5 text-teal-400" />
                : <Volume2 className="h-3.5 w-3.5 text-white/30 hover:text-white/60" />
              }
            </button>
            {isReport && (
              <button
                onClick={() => {
                  const blob = new Blob([message.content], { type: 'text/plain' });
                  const url  = URL.createObjectURL(blob);
                  const a    = document.createElement('a');
                  a.href     = url;
                  a.download = `sweatsmart-warrior-report-${format(new Date(), 'yyyy-MM-dd')}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Warrior Report downloaded');
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-teal-300 border border-teal-500/40 hover:bg-teal-500/20 transition-colors ml-1"
              >
                <FileText className="h-3 w-3" /> Download Report
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Typing indicator ──────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex justify-start gap-2.5">
    <div
      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center neural-thinking"
      style={{
        background: 'linear-gradient(135deg, #00BCD4, #0097A7)',
        boxShadow: '0 0 12px rgba(0,188,212,0.6)',
      }}
    >
      <Sparkles className="h-3.5 w-3.5 text-white" />
    </div>
    <div
      className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5"
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="w-2 h-2 rounded-full bg-teal-400 typing-dot-1" />
      <div className="w-2 h-2 rounded-full bg-teal-400 typing-dot-2" />
      <div className="w-2 h-2 rounded-full bg-teal-400 typing-dot-3" />
      <span className="text-[10px] text-white/40 ml-1">Hyper AI is thinking...</span>
    </div>
  </div>
);

// ── History sidebar ───────────────────────────────────────────────────────────
const HistorySidebar = ({
  open, conversations, currentId,
  onLoad, onDelete, onClose,
}: {
  open: boolean; conversations: Conversation[]; currentId: string | null;
  onLoad: (id: string) => void; onDelete: (id: string) => void; onClose: () => void;
}) => (
  <div
    className={`fixed inset-y-0 right-0 w-72 z-50 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
    style={{
      background: 'rgba(10, 10, 30, 0.95)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid rgba(255,255,255,0.08)',
    }}
  >
    <div className="flex items-center justify-between p-4 border-b border-white/10">
      <h3 className="font-bold text-white text-sm">Chat History</h3>
      <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">✕</button>
    </div>
    <div className="overflow-y-auto h-full pb-20 p-2 space-y-1">
      {conversations.length === 0 && (
        <p className="text-xs text-white/30 text-center py-8">No conversations yet</p>
      )}
      {conversations.map(conv => (
        <div
          key={conv.id}
          className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
            currentId === conv.id ? 'bg-teal-500/20 border border-teal-500/30' : 'hover:bg-white/5'
          }`}
        >
          <div className="flex-1 min-w-0" onClick={() => onLoad(conv.id)}>
            <p className="text-xs font-semibold text-white/80 truncate">{conv.title}</p>
            <p className="text-[10px] text-white/30 mt-0.5">{format(new Date(conv.updated_at), 'MMM d, yyyy')}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: "Hello, Warrior. I'm Hyper AI — your personal clinical companion for hyperhidrosis. I have access to your episode data, real-time biometric readings, and live climate data, so every insight I give you is personalised to your journey.\n\nWhat's on your mind today? You can ask me anything — clinical questions, treatment options, how to prepare for a job interview, or just talk about what it feels like to live with this condition. I'm here 24/7.",
};

const HyperAI = () => {
  const { user }     = useAuth();
  const { profile }  = useProfile();
  const { episodes: rawEpisodes } = useEpisodes();
  const { weather, sweatRisk } = useClimateData();

  const [messages, setMessages]           = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput]                 = useState('');
  const [isLoading, setIsLoading]         = useState(false);
  const [copiedIndex, setCopiedIndex]     = useState<number | null>(null);
  const [isListening, setIsListening]     = useState(false);
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen]     = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  // Inject CSS once
  useEffect(() => {
    if (document.getElementById('hyper-ai-styles')) return;
    const style = document.createElement('style');
    style.id = 'hyper-ai-styles';
    style.textContent = NEURAL_GLOW_STYLE;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    supabase.from('chat_conversations').select('*')
      .eq('user_id', user.id).order('updated_at', { ascending: false })
      .then(({ data }) => { if (data) setConversations(data); });
  }, [user]);

  // EDA data
  const edaReading = useMemo(() => {
    const stored = edaManager.getEDA();
    if (!stored) return null;
    const phase = stored.value >= 10 ? 'TRIGGER' : stored.value >= 5 ? 'ACTIVE' : 'RESTING';
    return { value: stored.value, phase, fresh: edaManager.isFresh() };
  }, []);

  // Climate snapshot for AI
  const climateSnapshot = useMemo(() => {
    if (!weather) return null;
    return {
      city: (weather as any).location || 'Unknown',
      temperature: weather.temperature,
      humidity: weather.humidity,
      uvIndex: weather.uvIndex,
      sweatRisk,
    };
  }, [weather, sweatRisk]);

  // Dashboard analytics
  const dashboardAnalytics = useMemo(() => {
    if (!rawEpisodes?.length) return null;
    const episodes = rawEpisodes.map(ep => ({
      ...ep,
      datetime: new Date(ep.datetime),
      severityLevel: Number(ep.severityLevel),
      triggers: Array.isArray(ep.triggers) ? ep.triggers : [],
      bodyAreas: Array.isArray(ep.bodyAreas) ? ep.bodyAreas : [],
    }));

    const triggerCounts = new Map<string, { count: number; severities: number[] }>();
    const areaCounts    = new Map<string, { count: number; severities: number[] }>();
    episodes.forEach(ep => {
      ep.triggers.forEach((t: any) => {
        const label = t.label || t.value || 'Unknown';
        const x = triggerCounts.get(label) || { count: 0, severities: [] };
        x.count++; x.severities.push(ep.severityLevel);
        triggerCounts.set(label, x);
      });
      ep.bodyAreas.forEach((a: string) => {
        const x = areaCounts.get(a) || { count: 0, severities: [] };
        x.count++; x.severities.push(ep.severityLevel);
        areaCounts.set(a, x);
      });
    });

    const topTriggers = [...triggerCounts.entries()]
      .sort((a, b) => b[1].count - a[1].count).slice(0, 5)
      .map(([name, d]) => ({
        name, count: d.count,
        avgSeverity: (d.severities.reduce((a, b) => a + b, 0) / d.severities.length).toFixed(1),
        percentage: Math.round((d.count / episodes.length) * 100),
      }));

    const topAreas = [...areaCounts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([area, d]) => ({
        area, count: d.count,
        avgSeverity: (d.severities.reduce((a, b) => a + b, 0) / d.severities.length).toFixed(1),
        percentage: Math.round((d.count / episodes.length) * 100),
      }));

    const now = new Date();
    const weeklyTrends = [];
    for (let i = 7; i >= 0; i--) {
      const wStart = new Date(now.getTime() - (i + 1) * 7 * 86400000);
      const wEnd   = new Date(now.getTime() - i * 7 * 86400000);
      const wEps   = episodes.filter(ep => ep.datetime >= wStart && ep.datetime < wEnd);
      if (wEps.length > 0 || i < 4) {
        weeklyTrends.push({
          week: format(wStart, 'MMM d'),
          count: wEps.length,
          avgSeverity: wEps.length > 0
            ? (wEps.reduce((s, e) => s + e.severityLevel, 0) / wEps.length).toFixed(1)
            : '0',
        });
      }
    }

    return {
      totalEpisodes: episodes.length,
      avgSeverity: (episodes.reduce((s, e) => s + e.severityLevel, 0) / episodes.length).toFixed(1),
      topTriggers, topAreas, weeklyTrends,
    };
  }, [rawEpisodes]);

  const userName = profile?.display_name || user?.email?.split('@')[0] || 'Warrior';

  // Save messages
  const saveMessages = useCallback(async (convId: string, msgs: Message[]) => {
    if (!user) return;
    const newMsgs = msgs.slice(-2);
    for (const msg of newMsgs) {
      await supabase.from('chat_messages').insert({
        conversation_id: convId, user_id: user.id, role: msg.role, content: msg.content,
      });
    }
    if (msgs.filter(m => m.role === 'user').length === 1) {
      const first = msgs.find(m => m.role === 'user');
      if (first) {
        const title = first.content.slice(0, 60) + (first.content.length > 60 ? '...' : '');
        await supabase.from('chat_conversations').update({ title, updated_at: new Date().toISOString() }).eq('id', convId);
      }
    } else {
      await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
    }
    const { data } = await supabase.from('chat_conversations').select('*')
      .eq('user_id', user.id).order('updated_at', { ascending: false });
    if (data) setConversations(data);
  }, [user]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadChat = () => {
    const text = messages.map(m => `${m.role === 'user' ? 'You' : 'Hyper AI'}: ${m.content}`).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `hyper-ai-session-${format(new Date(), 'yyyy-MM-dd-HHmm')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Session downloaded');
  };

  const speakText = (text: string) => {
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error('Speech recognition not supported'); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = 'en-US';
    r.onresult  = (e: any) => { setInput(p => p + e.results[0][0].transcript); setIsListening(false); };
    r.onerror   = () => setIsListening(false);
    r.onend     = () => setIsListening(false);
    recognitionRef.current = r;
    r.start();
    setIsListening(true);
  };

  const handleNewChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setCurrentConversationId(null);
    setHistoryOpen(false);
    setShowSuggestions(true);
  };

  const loadConversation = async (convId: string) => {
    const { data } = await supabase.from('chat_messages').select('*')
      .eq('conversation_id', convId).order('created_at', { ascending: true });
    if (data?.length) {
      setMessages(data.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));
      setCurrentConversationId(convId);
      setShowSuggestions(false);
    }
    setHistoryOpen(false);
  };

  const deleteConversation = async (convId: string) => {
    await supabase.from('chat_conversations').delete().eq('id', convId);
    setConversations(p => p.filter(c => c.id !== convId));
    if (currentConversationId === convId) handleNewChat();
    toast.success('Conversation deleted');
  };

  const handleSend = async (overrideInput?: string) => {
    const text = (overrideInput || input).trim();
    if (!text || isLoading) return;
    setInput('');
    setShowSuggestions(false);

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        toast.error('Please log in to use Hyper AI');
        setIsLoading(false);
        return;
      }

      let convId = currentConversationId;
      if (!convId) {
        const { data: newConv } = await supabase.from('chat_conversations').insert({
          user_id: user!.id, title: 'New Conversation',
        }).select().single();
        if (newConv) { convId = newConv.id; setCurrentConversationId(convId); }
      }

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hyper-ai-chat`;
      const allMessages = [...messages, userMessage];

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          dashboardAnalytics,
          edaReading,
          climateSnapshot,
          userName,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      // Check for warrior report (non-streaming JSON)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        if (json.report && json.content) {
          const reportMsg: Message = { role: 'assistant', content: json.content, isReport: true };
          setMessages(prev => [...prev, reportMsg]);
          if (convId) await saveMessages(convId, [...allMessages, reportMsg]);
          setIsLoading(false);
          return;
        }
      }

      // Streaming response
      if (!response.body) throw new Error('No response body');
      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let buffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer   = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed  = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch { buffer = line + '\n' + buffer; break; }
        }
      }

      if (convId) {
        await saveMessages(convId, [...allMessages, { role: 'assistant', content: assistantContent }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
      setMessages(prev => prev.filter((_, i) => i !== prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Climate alert pill
  const climateAlert = sweatRisk === 'extreme' || sweatRisk === 'high';

  return (
    <AppLayout>
      {/* Global dark background */}
      <div
        className="h-[calc(100vh-4rem)] flex flex-col relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0a0a1e 0%, #0d1030 40%, #0a1520 100%)',
        }}
      >
        {/* Ambient background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 20% 20%, rgba(0,188,212,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(124,58,237,0.06) 0%, transparent 60%)',
          }}
        />

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div
          className="relative z-10 px-4 py-3 flex items-center justify-between shrink-0"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Main avatar */}
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center neural-idle"
              style={{
                background: 'linear-gradient(135deg, #00BCD4, #0097A7)',
                boxShadow: '0 0 20px rgba(0,188,212,0.4)',
              }}
            >
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-base leading-tight">Hyper AI</h1>
              <p className="text-white/40 text-[10px]">World's first hyperhidrosis clinical companion</p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5">
            {/* EDA live pill */}
            {edaReading && (
              <EdaPill value={edaReading.value} phase={edaReading.phase} />
            )}
            {/* Climate alert */}
            {climateAlert && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-900/40 border border-amber-500/40">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-300">
                  {sweatRisk === 'extreme' ? 'Extreme' : 'High'} Risk
                </span>
              </div>
            )}
            {/* Icon buttons */}
            {[
              { icon: Plus, action: handleNewChat, title: 'New chat' },
              { icon: Download, action: handleDownloadChat, title: 'Download session' },
              { icon: MessageSquare, action: () => setHistoryOpen(true), title: 'Chat history' },
            ].map(({ icon: Icon, action, title }) => (
              <button
                key={title}
                onClick={action}
                title={title}
                className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white/80 transition-all"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        {/* ── MESSAGES ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative z-10">
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              index={i}
              copiedIndex={copiedIndex}
              isSpeaking={isSpeaking}
              onCopy={handleCopy}
              onSpeak={speakText}
            />
          ))}

          {/* Typing indicator */}
          {isLoading && messages[messages.length - 1]?.role === 'user' && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* ── SUGGESTION CHIPS ────────────────────────────────────────── */}
        {showSuggestions && messages.length <= 1 && (
          <div className="relative z-10 px-4 pb-2">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 px-1">
              Ask me anything
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTION_PROMPTS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s.text)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-left transition-all hover:scale-[1.02]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  <span className="text-base shrink-0">{s.icon}</span>
                  <span className="leading-tight">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── GENERATE REPORT BUTTON ──────────────────────────────────── */}
        {!showSuggestions && (
          <div className="relative z-10 px-4 pb-1">
            <button
              onClick={() => handleSend('Generate my warrior report for my dermatologist')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.01]"
              style={{
                background: 'rgba(0,188,212,0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0,188,212,0.3)',
                color: '#00BCD4',
              }}
            >
              <FileText className="h-3.5 w-3.5" />
              Generate Warrior Report
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── INPUT AREA ──────────────────────────────────────────────── */}
        <div
          className="relative z-10 px-4 py-3 shrink-0"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-end gap-2">
            {/* Voice button */}
            <button
              onClick={toggleVoice}
              className={`p-3 rounded-xl transition-all shrink-0 ${
                isListening
                  ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                  : 'hover:bg-white/10 text-white/30 hover:text-white/60'
              }`}
              style={{ border: isListening ? undefined : '1px solid rgba(255,255,255,0.08)' }}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about hyperhidrosis..."
                rows={1}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-2xl text-sm resize-none outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.9)',
                  caretColor: '#00BCD4',
                  minHeight: '48px',
                  maxHeight: '120px',
                }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                }}
              />
              {isListening && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[10px] text-red-400">Listening</span>
                </div>
              )}
            </div>

            {/* Send button */}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-3 rounded-xl shrink-0 transition-all disabled:opacity-30"
              style={{
                background: input.trim() && !isLoading
                  ? 'linear-gradient(135deg, #00BCD4, #0097A7)'
                  : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: input.trim() && !isLoading ? '0 4px 20px rgba(0,188,212,0.4)' : 'none',
              }}
            >
              {isLoading
                ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                : <Send className="h-4 w-4 text-white" />
              }
            </button>
          </div>
        </div>

        {/* History sidebar */}
        {historyOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setHistoryOpen(false)}
          />
        )}
        <HistorySidebar
          open={historyOpen}
          conversations={conversations}
          currentId={currentConversationId}
          onLoad={loadConversation}
          onDelete={deleteConversation}
          onClose={() => setHistoryOpen(false)}
        />
      </div>
    </AppLayout>
  );
};

export default HyperAI;
