import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Sparkles, Loader2, Copy, Check, Download, Mic, MicOff, Plus, MessageSquare, Trash2, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useEpisodes } from '@/hooks/useEpisodes';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi! I'm Hyper AI, your personal hyperhidrosis companion. I'm here to answer questions, provide support, and help you manage your journey. What's on your mind today?"
};

const HyperAI = () => {
  const { user } = useAuth();
  const { episodes: rawEpisodes } = useEpisodes();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [historySidebarOpen, setHistorySidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Load conversations list
  useEffect(() => {
    if (!user) return;
    const loadConversations = async () => {
      const { data } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (data) setConversations(data);
    };
    loadConversations();
  }, [user]);

  const saveMessages = useCallback(async (convId: string, msgs: Message[]) => {
    if (!user) return;
    // Save only the last two messages (user + assistant)
    const newMsgs = msgs.slice(-2);
    for (const msg of newMsgs) {
      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        user_id: user.id,
        role: msg.role,
        content: msg.content,
      });
    }
    // Update conversation title from first user message
    if (msgs.filter(m => m.role === 'user').length === 1) {
      const firstUserMsg = msgs.find(m => m.role === 'user');
      if (firstUserMsg) {
        const title = firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? '...' : '');
        await supabase.from('chat_conversations').update({ title, updated_at: new Date().toISOString() }).eq('id', convId);
      }
    } else {
      await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
    }
    // Refresh list
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (data) setConversations(data);
  }, [user]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownload = () => {
    const text = messages
      .map(m => `${m.role === 'user' ? 'You' : 'Hyper AI'}: ${m.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hyper-ai-chat-${format(new Date(), 'yyyy-MM-dd-HHmm')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Chat downloaded');
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => { setIsListening(false); };
    recognition.onend = () => { setIsListening(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const speakText = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.onend = () => setIsSpeaking(false);
    synthRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleNewChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setCurrentConversationId(null);
    setHistorySidebarOpen(false);
  };

  const loadConversation = async (convId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    if (data && data.length > 0) {
      setMessages(data.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));
      setCurrentConversationId(convId);
    }
    setHistorySidebarOpen(false);
  };

  const deleteConversation = async (convId: string) => {
    await supabase.from('chat_conversations').delete().eq('id', convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (currentConversationId === convId) handleNewChat();
    toast.success('Conversation deleted');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        toast.error('Please log in to use Hyper AI');
        setIsLoading(false);
        return;
      }

      // Create conversation if needed
      let convId = currentConversationId;
      if (!convId) {
        const { data: newConv } = await supabase.from('chat_conversations').insert({
          user_id: user!.id,
          title: 'New Conversation',
        }).select().single();
        if (newConv) {
          convId = newConv.id;
          setCurrentConversationId(convId);
        }
      }

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hyper-ai-chat`;
      const allMessages = [...messages, userMessage];

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ messages: allMessages, dashboardAnalytics }),
      });

      if (!response.ok || !response.body) throw new Error('Failed to get response');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Save to DB
      if (convId) {
        const finalMessages = [...allMessages, { role: 'assistant' as const, content: assistantContent }];
        await saveMessages(convId, finalMessages);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
      setMessages(prev => prev.slice(0, -1));
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Build visual analytics summary to send to AI
  const dashboardAnalytics = useMemo(() => {
    if (!rawEpisodes || rawEpisodes.length === 0) return null;

    const episodes = rawEpisodes.map(ep => ({
      ...ep,
      datetime: new Date(ep.datetime),
      severityLevel: Number(ep.severityLevel),
      triggers: Array.isArray(ep.triggers) ? ep.triggers : [],
      bodyAreas: Array.isArray(ep.bodyAreas) ? ep.bodyAreas : [],
    }));

    // Trigger frequencies
    const triggerCounts = new Map<string, { count: number; severities: number[] }>();
    episodes.forEach(ep => {
      ep.triggers.forEach((t: any) => {
        const label = t.label || t.value || 'Unknown';
        const existing = triggerCounts.get(label) || { count: 0, severities: [] };
        existing.count += 1;
        existing.severities.push(ep.severityLevel);
        triggerCounts.set(label, existing);
      });
    });
    const topTriggers = Array.from(triggerCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgSeverity: (data.severities.reduce((a, b) => a + b, 0) / data.severities.length).toFixed(1),
        percentage: Math.round((data.count / episodes.length) * 100),
      }));

    // Body area frequencies
    const areaCounts = new Map<string, { count: number; severities: number[] }>();
    episodes.forEach(ep => {
      ep.bodyAreas.forEach((area: string) => {
        const existing = areaCounts.get(area) || { count: 0, severities: [] };
        existing.count += 1;
        existing.severities.push(ep.severityLevel);
        areaCounts.set(area, existing);
      });
    });
    const topAreas = Array.from(areaCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([area, data]) => ({
        area,
        count: data.count,
        avgSeverity: (data.severities.reduce((a, b) => a + b, 0) / data.severities.length).toFixed(1),
        percentage: Math.round((data.count / episodes.length) * 100),
      }));

    // Trend overview: episodes per week (last 8 weeks)
    const now = new Date();
    const weeklyTrends: { week: string; count: number; avgSeverity: string }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 86400000);
      const weekEnd = new Date(now.getTime() - i * 7 * 86400000);
      const weekEpisodes = episodes.filter(ep => ep.datetime >= weekStart && ep.datetime < weekEnd);
      if (weekEpisodes.length > 0 || i < 4) {
        weeklyTrends.push({
          week: format(weekStart, 'MMM d'),
          count: weekEpisodes.length,
          avgSeverity: weekEpisodes.length > 0
            ? (weekEpisodes.reduce((s, e) => s + e.severityLevel, 0) / weekEpisodes.length).toFixed(1)
            : '0',
        });
      }
    }

    const avgSeverity = (episodes.reduce((s, e) => s + e.severityLevel, 0) / episodes.length).toFixed(1);

    return {
      totalEpisodes: episodes.length,
      avgSeverity,
      topTriggers,
      topAreas,
      weeklyTrends,
    };
  }, [rawEpisodes]);

  const suggestionPrompts = [
    "Explain my visual analytics, charts & trends",
    "Why do my palms sweat when I'm nervous?",
    "What treatments work best for foot sweating?",
    "Tell me about my recent episode patterns"
  ];

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 sm:p-3 rounded-full">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Hyper AI</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Your 24/7 hyperhidrosis companion</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleNewChat} title="New chat">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} title="Download chat">
                <Download className="h-4 w-4" />
              </Button>
              <Sheet open={historySidebarOpen} onOpenChange={setHistorySidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" title="Chat history">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Chat History</h3>
                  </div>
                  <ScrollArea className="h-[calc(100vh-5rem)]">
                    <div className="p-2 space-y-1">
                      {conversations.length === 0 && (
                        <p className="text-sm text-muted-foreground p-4 text-center">No conversations yet</p>
                      )}
                      {conversations.map(conv => (
                        <div
                          key={conv.id}
                          className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-accent group ${currentConversationId === conv.id ? 'bg-accent' : ''}`}
                        >
                          <div className="flex-1 min-w-0" onClick={() => loadConversation(conv.id)}>
                            <p className="text-sm font-medium truncate text-foreground">{conv.title}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(conv.updated_at), 'MMM d, yyyy')}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[80%]">
                <Card
                  className={`p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </Card>
                {message.role === 'assistant' && message.content && (
                  <div className="flex items-center gap-1 mt-1 ml-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopy(message.content, index)}
                      title="Copy"
                    >
                      {copiedIndex === index ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => speakText(message.content)}
                      title="Read aloud"
                    >
                      {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-primary" /> : <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <Card className="max-w-[80%] p-4 bg-card">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {suggestionPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInput(prompt)}
                className="text-xs"
              >
                {prompt}
              </Button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-background">
          <div className="flex gap-2">
            <Button
              variant={isListening ? 'default' : 'outline'}
              size="icon"
              className="h-[60px] w-[48px] shrink-0"
              onClick={toggleVoiceInput}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about hyperhidrosis..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px] shrink-0"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          {isListening && (
            <p className="text-xs text-primary mt-2 animate-pulse">Listening... Speak now</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default HyperAI;
