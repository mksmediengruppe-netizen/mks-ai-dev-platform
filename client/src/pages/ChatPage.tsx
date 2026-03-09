/* ============================================================
   ChatPage — Professional Light theme
   Uses real /conversations API:
     POST /conversations          → create new chat
     GET  /conversations          → list chats
     GET  /conversations/{id}/messages → load messages
     POST /conversations/{id}/messages → send message
   Mobile-first: single column on mobile, 3-pane on desktop
   URL-based routing: /chat and /chat/:id both work
   Timestamps: Moscow time (UTC+3)
   Auto-scroll: native div with overflow-y-auto
   ============================================================ */

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send, Bot, User, Plus, Loader2,
  Sparkles, FileText, Code2, Zap, Globe, ChevronRight,
  X, PanelLeftOpen, RefreshCw, MessageSquare
} from "lucide-react";
import { toast } from "sonner";

const API_BASE = "https://api.mksitdev.ru";
const MOSCOW_TZ = "Europe/Moscow";

interface Message {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: number;
  title: string;
  status: string;
  mode: string;
  project_name?: string;
  created_at: string;
  updated_at: string;
}

const QUICK_PROMPTS = [
  { icon: Zap, label: "Build n8n workflow", prompt: "Create an n8n workflow for CRM lead notification via Bitrix24" },
  { icon: Code2, label: "Generate app scaffold", prompt: "Build a SaaS dashboard scaffold with auth and RBAC" },
  { icon: Globe, label: "Analyze site", prompt: "Analyze the site https://blacksart.ru and detect CMS" },
  { icon: FileText, label: "Write PRD", prompt: "Write a Product Requirements Document for an e-commerce platform" },
];

const CAPABILITIES = [
  { name: "n8n Builder", desc: "Workflow automation", dotColor: "bg-amber-400" },
  { name: "Bitrix24 Builder", desc: "CRM integration", dotColor: "bg-blue-400" },
  { name: "Business Site Ops", desc: "Site analysis & ops", dotColor: "bg-emerald-400" },
  { name: "CMS Mastery", desc: "WordPress, Bitrix, Joomla", dotColor: "bg-purple-400" },
  { name: "Visual QA", desc: "Screenshot comparison", dotColor: "bg-cyan-400" },
  { name: "Design Profile", desc: "Style-aware generation", dotColor: "bg-pink-400" },
  { name: "App Builder", desc: "Full-stack scaffolding", dotColor: "bg-orange-400" },
  { name: "DB Designer", desc: "Schema & migrations", dotColor: "bg-lime-400" },
  { name: "RBAC Builder", desc: "Auth & permissions", dotColor: "bg-red-400" },
  { name: "Doc Builder v2", desc: "PRD, Spec, ADR", dotColor: "bg-violet-400" },
];

export default function ChatPage() {
  const { user, logout } = useAuth();
  const token = user?.token || "";
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  // Native scrollable div ref for reliable auto-scroll
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const authHeaders = useCallback(() => ({
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token]);

  // Handle 401 — auto logout
  const handleUnauthorized = useCallback(() => {
    toast.error("Session expired. Please log in again.");
    logout?.();
  }, [logout]);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!token) return;
    setLoadingConvs(true);
    try {
      const res = await fetch(`${API_BASE}/conversations`, { headers: authHeaders() });
      if (res.status === 401) { handleUnauthorized(); return; }
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        return data as Conversation[];
      }
    } catch (e) {
      console.error("Failed to load conversations", e);
    } finally {
      setLoadingConvs(false);
    }
    return [];
  }, [token, authHeaders, handleUnauthorized]);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (convId: number) => {
    if (!token) return;
    setLoadingMsgs(true);
    setMessages([]); // clear stale messages
    try {
      const res = await fetch(`${API_BASE}/conversations/${convId}/messages`, { headers: authHeaders() });
      if (res.status === 401) { handleUnauthorized(); return; }
      if (res.ok) {
        const data = await res.json();
        const mapped: Message[] = data.map((m: any) => ({
          id: m.id,
          role: m.sender_type === "user" ? "user" : "assistant",
          content: m.content_text || "",
          timestamp: m.created_at,
        }));
        setMessages(mapped);
      }
    } catch (e) {
      console.error("Failed to load messages", e);
    } finally {
      setLoadingMsgs(false);
    }
  }, [token, authHeaders, handleUnauthorized]);

  // On mount: load conversations, then open conversation from URL if present
  useEffect(() => {
    if (!token) return;
    loadConversations().then((convs) => {
      const urlId = params?.id ? parseInt(params.id, 10) : null;
      if (urlId && convs && convs.length > 0) {
        const found = convs.find((c: Conversation) => c.id === urlId);
        if (found) {
          setActiveConv(found);
          loadMessages(found.id);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // When URL changes (e.g. user navigates to /chat/54), open that conversation
  useEffect(() => {
    const urlId = params?.id ? parseInt(params.id, 10) : null;
    if (!urlId) return;
    if (activeConv?.id === urlId) return;
    if (conversations.length === 0) return;
    const found = conversations.find((c) => c.id === urlId);
    if (found) {
      setActiveConv(found);
      loadMessages(found.id);
    }
  }, [params?.id, conversations, activeConv?.id, loadMessages]);

  // Auto-scroll when messages update
  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(scrollToBottom, 80);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Also scroll after loading finishes
  useEffect(() => {
    if (!loadingMsgs && messages.length > 0) {
      const timer = setTimeout(scrollToBottom, 120);
      return () => clearTimeout(timer);
    }
  }, [loadingMsgs, messages.length, scrollToBottom]);

  const newConversation = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ title: "New Chat", mode: "discuss" }),
      });
      if (res.status === 401) { handleUnauthorized(); return; }
      if (res.ok) {
        const conv = await res.json();
        setConversations(prev => [conv, ...prev]);
        setActiveConv(conv);
        setMessages([]);
        navigate(`/chat/${conv.id}`);
        await loadMessages(conv.id);
        setShowHistory(false);
      } else {
        toast.error("Failed to create conversation");
      }
    } catch (e) {
      toast.error("Network error creating conversation");
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setShowHistory(false);
    navigate(`/chat/${conv.id}`);
    await loadMessages(conv.id);
  };

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading || !token) return;
    setInput("");

    let convId = activeConv?.id;

    // Auto-create conversation if none selected
    if (!convId) {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/conversations`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ title: content.slice(0, 60), mode: "discuss" }),
        });
        if (res.status === 401) { handleUnauthorized(); return; }
        if (!res.ok) {
          toast.error("Failed to start conversation");
          setLoading(false);
          return;
        }
        const conv = await res.json();
        setConversations(prev => [conv, ...prev]);
        setActiveConv(conv);
        convId = conv.id;
        navigate(`/chat/${conv.id}`);
      } catch (e) {
        toast.error("Network error");
        setLoading(false);
        return;
      }
    }

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/conversations/${convId}/messages`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content }),
      });

      if (res.status === 401) { handleUnauthorized(); return; }

      if (res.ok) {
        const data = await res.json();
        // Add assistant response
        const assistantMsg: Message = {
          id: `resp-${Date.now()}`,
          role: "assistant",
          content: data.response || data.action_result?.text || "Task received and is being processed...",
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        // Refresh conversations list to update timestamps
        loadConversations();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Failed to send message");
        // Remove optimistic message
        setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      }
    } catch (e) {
      toast.error("Network error sending message");
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts: string) => {
    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) return "";
      const diff = Date.now() - date.getTime();
      if (diff < 60000) return "just now";
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return date.toLocaleDateString("ru-RU", {
        timeZone: MOSCOW_TZ,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-1 overflow-hidden relative" style={{ height: "100%" }}>

        {/* ── Mobile history overlay ─────────────────────────────── */}
        {showHistory && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setShowHistory(false)}
          />
        )}

        {/* ── Left: Conversation History ─────────────────────────── */}
        <div
          className={`
            flex-shrink-0 flex flex-col bg-white border-r border-slate-100
            fixed md:static inset-y-0 left-0 z-40 w-72 md:w-60
            transition-transform duration-300 ease-in-out
            ${showHistory ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
          style={{ top: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-100 flex-shrink-0">
            <span className="text-slate-700 text-sm font-semibold">Chats</span>
            <div className="flex items-center gap-1">
              <button
                onClick={loadConversations}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingConvs ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setShowHistory(false)}
                className="md:hidden text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* New Chat button */}
          <div className="p-2 border-b border-slate-100 flex-shrink-0">
            <button
              onClick={newConversation}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              New Chat
            </button>
          </div>

          {/* Conversations list */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {loadingConvs && conversations.length === 0 && (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-xs">Loading...</span>
                </div>
              )}
              {!loadingConvs && conversations.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No chats yet</p>
                </div>
              )}
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`
                    group flex items-start gap-2 p-2.5 rounded-lg cursor-pointer transition-colors
                    ${activeConv?.id === conv.id
                      ? "bg-blue-50 border border-blue-100"
                      : "hover:bg-slate-50 border border-transparent"
                    }
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${activeConv?.id === conv.id ? "text-blue-700" : "text-slate-700"}`}>
                      {conv.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${conv.mode === "discuss" ? "bg-blue-400" : "bg-emerald-400"}`} />
                      {conv.mode} · {formatTime(conv.updated_at || conv.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* ── Center: Chat Area ──────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ overflow: "hidden", height: "100%", background: "#f8fafc" }}>

          {/* Mobile top bar */}
          <div className="md:hidden flex items-center gap-2 px-3 py-2 bg-white border-b border-slate-100 flex-shrink-0">
            <button
              onClick={() => setShowHistory(true)}
              className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
            <span className="text-slate-700 text-sm font-medium flex-1 truncate">
              {activeConv?.title || "MKS IT Dev"}
            </span>
            <button
              onClick={newConversation}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Messages container — native div for reliable scroll */}
          <div
            ref={messagesContainerRef}
            style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
          >
            <div className="max-w-3xl mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4">

              {/* Welcome state */}
              {!activeConv && messages.length === 0 && !loadingMsgs && (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-slate-800 text-xl font-semibold mb-2" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                    What can I build for you?
                  </h2>
                  <p className="text-slate-500 text-sm mb-6 max-w-sm">
                    Ask me to build apps, automate workflows, analyze sites, write docs, or anything else.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                    {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                      <button
                        key={label}
                        onClick={() => sendMessage(prompt)}
                        disabled={loading}
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all text-left group disabled:opacity-50"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" />
                        </div>
                        <span className="text-slate-700 text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-slate-400 text-xs mt-4">
                    Connected to {API_BASE} · MKS IT Dev v10
                  </p>
                </div>
              )}

              {/* Loading messages */}
              {loadingMsgs && (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-xs">Loading messages...</span>
                </div>
              )}

              {/* Messages */}
              {!loadingMsgs && messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-sm"
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1.5 ${msg.role === "user" ? "text-blue-200" : "text-slate-400"}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {loading && messages.length > 0 && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 flex items-center gap-2 bg-white border border-slate-200 shadow-sm">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-slate-500 text-sm">Thinking…</span>
                  </div>
                </div>
              )}

              {/* Scroll sentinel */}
              <div ref={messagesEndRef} style={{ height: 1 }} />
            </div>
          </div>

          {/* Input */}
          <div className="px-3 md:px-6 py-3 md:py-4 flex-shrink-0 bg-white border-t border-slate-100">
            <div className="max-w-3xl mx-auto flex gap-2 md:gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask the AI Dev Team anything…"
                className="flex-1 h-11 text-sm bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-400"
                disabled={loading}
                autoComplete="off"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="h-11 px-3 md:px-4 bg-blue-600 hover:bg-blue-700 text-white border-0 disabled:opacity-40 flex-shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-center text-slate-400 text-xs mt-2 hidden sm:block">
              Connected to {API_BASE} · MKS IT Dev v10
            </p>
          </div>
        </div>

        {/* ── Right: Capabilities Panel (hidden on mobile) ───────── */}
        <div className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-white border-l border-slate-100">
          <div className="p-4 flex-shrink-0 border-b border-slate-100">
            <p className="text-slate-800 text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              Capabilities
            </p>
            <p className="text-slate-400 text-xs mt-0.5">Available modules</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              {CAPABILITIES.map((cap) => (
                <div key={cap.name} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cap.dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-xs font-medium">{cap.name}</p>
                    <p className="text-slate-400 text-xs">{cap.desc}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

      </div>
    </AppLayout>
  );
}
