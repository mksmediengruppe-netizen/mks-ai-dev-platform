/* ============================================================
   ChatPage — Professional Light theme
   Mobile-first: single column on mobile, 3-pane on desktop
   ============================================================ */

import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send, Bot, User, Plus, Trash2, Loader2,
  Sparkles, FileText, Code2, Zap, Globe, ChevronRight,
  History, X, PanelLeftOpen
} from "lucide-react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.mksitdev.ru";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: Zap, label: "Build n8n workflow", prompt: "Create an n8n workflow for CRM lead notification" },
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

function nanoid() {
  return Math.random().toString(36).slice(2, 11);
}

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: "1", title: "n8n CRM workflow", lastMessage: "Workflow generated successfully", timestamp: new Date(Date.now() - 3600000) },
    { id: "2", title: "Bitrix24 integration", lastMessage: "Entity mapper completed", timestamp: new Date(Date.now() - 7200000) },
    { id: "3", title: "blacksart.ru audit", lastMessage: "CMS: WordPress 6.4 detected", timestamp: new Date(Date.now() - 86400000) },
  ]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = { id: nanoid(), role: "user", content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    let convId = activeConvId;
    if (!convId) {
      const newConv: Conversation = {
        id: nanoid(),
        title: content.slice(0, 40) + (content.length > 40 ? "…" : ""),
        lastMessage: content.slice(0, 60),
        timestamp: new Date(),
      };
      setConversations(prev => [newConv, ...prev]);
      convId = newConv.id;
      setActiveConvId(convId);
    }

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token || ""}`,
        },
        body: JSON.stringify({ message: content, conversation_id: convId }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const reply = data.response || data.message || data.content || JSON.stringify(data, null, 2);

      const assistantMsg: Message = { id: nanoid(), role: "assistant", content: reply, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, lastMessage: reply.slice(0, 60), timestamp: new Date() } : c
      ));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to send: ${errMsg}`);
      const errorMsg: Message = {
        id: nanoid(),
        role: "assistant",
        content: `⚠️ Error connecting to API: ${errMsg}\n\nMake sure the chat-api is running at \`${API_BASE}\``,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const newConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    setShowHistory(false);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
  };

  const selectConversation = (id: string) => {
    setActiveConvId(id);
    setShowHistory(false);
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <AppLayout>
      <div className="flex flex-1 overflow-hidden relative">

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
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-3 border-b border-slate-100">
            <span className="text-slate-700 text-sm font-semibold">Chats</span>
            <button
              onClick={() => setShowHistory(false)}
              className="md:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 flex-shrink-0 border-b border-slate-100">
            <button
              onClick={newConversation}
              className="w-full h-9 text-sm flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> New Chat
            </button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className="group flex items-start gap-2 p-2.5 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: activeConvId === conv.id ? "#eff6ff" : "transparent",
                    border: activeConvId === conv.id ? "1px solid #bfdbfe" : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (activeConvId !== conv.id) (e.currentTarget as HTMLElement).style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (activeConvId !== conv.id) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-xs font-medium truncate">{conv.title}</p>
                    <p className="text-slate-400 text-xs truncate mt-0.5">{conv.lastMessage}</p>
                    <p className="text-slate-300 text-xs mt-0.5">{formatTime(conv.timestamp)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all mt-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* ── Center: Chat Area ──────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 md:px-6 h-14 flex-shrink-0 bg-white border-b border-slate-100">
            {/* Mobile: history toggle button */}
            <button
              onClick={() => setShowHistory(true)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>

            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-slate-800 text-sm font-semibold truncate" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                AI Dev Team
              </p>
              <p className="text-slate-400 text-xs">M7 · 48 capabilities active</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 text-xs font-medium hidden sm:inline">Online</span>
            </div>

            {/* Mobile: New Chat button in header */}
            <button
              onClick={newConversation}
              className="md:hidden flex items-center gap-1 h-8 px-2.5 text-xs rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium flex-shrink-0"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-3 md:px-6 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-64 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-blue-500" />
                </div>
                <h3 className="text-slate-800 text-base font-semibold mb-2"
                  style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  What can I build for you?
                </h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm">
                  Ask me to build apps, automate workflows, analyze sites, write docs, or anything else.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                    <button
                      key={label}
                      onClick={() => sendMessage(prompt)}
                      className="flex items-center gap-2.5 p-3 rounded-xl text-left bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-all"
                    >
                      <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-slate-700">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5 max-w-3xl mx-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 md:gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className="max-w-[85%] md:max-w-[75%] rounded-2xl px-3 md:px-4 py-3 text-sm"
                      style={msg.role === "user" ? {
                        background: "#2563eb",
                        color: "white",
                        borderBottomRightRadius: "4px",
                      } : {
                        background: "white",
                        color: "#1e293b",
                        border: "1px solid #e2e8f0",
                        borderBottomLeftRadius: "4px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs mt-1.5 opacity-50">{formatTime(msg.timestamp)}</p>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
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
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

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
              Connected to {API_BASE} · M7 Production
            </p>
          </div>
        </div>

        {/* ── Right: Capabilities Panel (hidden on mobile) ───────── */}
        <div className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-white border-l border-slate-100">
          <div className="p-4 flex-shrink-0 border-b border-slate-100">
            <p className="text-slate-800 text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              Capabilities
            </p>
            <p className="text-slate-400 text-xs mt-0.5">Available M7 modules</p>
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
