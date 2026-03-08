/* ============================================================
   ChatPage — Chat Workspace (3-pane: history | chat | context)
   Connects to chat-api at VITE_API_URL
   ============================================================ */

import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send, Bot, User, Plus, Trash2, Loader2,
  Sparkles, FileText, Code2, Zap, Globe, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const API_BASE = import.meta.env.VITE_API_URL || "http://2.56.240.170:8000";

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

function nanoid() {
  return Math.random().toString(36).slice(2, 11);
}

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: "1", title: "n8n CRM workflow", lastMessage: "Workflow generated successfully", timestamp: new Date(Date.now() - 3600000) },
    { id: "2", title: "Bitrix24 integration", lastMessage: "Entity mapper completed", timestamp: new Date(Date.now() - 7200000) },
  ]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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

    // Create conversation if none active
    if (!activeConvId) {
      const newConv: Conversation = {
        id: nanoid(),
        title: content.slice(0, 40) + (content.length > 40 ? "…" : ""),
        lastMessage: content.slice(0, 60),
        timestamp: new Date(),
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConvId(newConv.id);
    }

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token || ""}`,
        },
        body: JSON.stringify({ message: content, conversation_id: activeConvId }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const reply = data.response || data.message || data.content || JSON.stringify(data, null, 2);

      const assistantMsg: Message = { id: nanoid(), role: "assistant", content: reply, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);

      // Update conversation last message
      setConversations(prev => prev.map(c =>
        c.id === activeConvId ? { ...c, lastMessage: reply.slice(0, 60), timestamp: new Date() } : c
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
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(null);
      setMessages([]);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <AppLayout>
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Conversation History */}
        <div className="w-64 flex-shrink-0 flex flex-col"
          style={{ background: "rgba(10,13,20,0.8)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="p-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Button
              onClick={newConversation}
              className="w-full h-9 text-sm gap-2"
              style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd" }}
            >
              <Plus className="w-3.5 h-3.5" /> New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => { setActiveConvId(conv.id); }}
                  className="group flex items-start gap-2 p-2.5 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: activeConvId === conv.id ? "rgba(59,130,246,0.12)" : "transparent",
                    border: activeConvId === conv.id ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (activeConvId !== conv.id) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeConvId !== conv.id) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-xs font-medium truncate">{conv.title}</p>
                    <p className="text-slate-600 text-xs truncate mt-0.5">{conv.lastMessage}</p>
                    <p className="text-slate-700 text-xs mt-0.5">{formatTime(conv.timestamp)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all mt-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center: Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#0a0d14" }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-6 h-14 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                AI Dev Team
              </p>
              <p className="text-slate-500 text-xs">M6 · 48 capabilities active</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 text-xs">Online</span>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-6 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-64 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 flex items-center justify-center mb-4"
                  style={{ border: "1px solid rgba(99,102,241,0.2)" }}>
                  <Sparkles className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-white text-base font-semibold mb-2"
                  style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  What can I build for you?
                </h3>
                <p className="text-slate-500 text-sm mb-8 max-w-sm">
                  Ask me to build apps, automate workflows, analyze sites, write docs, or anything else.
                </p>
                <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                  {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                    <button
                      key={label}
                      onClick={() => sendMessage(prompt)}
                      className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "#94a3b8",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.08)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                      }}
                    >
                      <Icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-slate-300">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5 max-w-3xl mx-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className="max-w-[75%] rounded-2xl px-4 py-3 text-sm"
                      style={msg.role === "user" ? {
                        background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                        color: "white",
                        borderBottomRightRadius: "4px",
                      } : {
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#cbd5e1",
                        borderBottomLeftRadius: "4px",
                      }}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="leading-relaxed">{msg.content}</p>
                      )}
                      <p className="text-xs mt-1.5 opacity-50">{formatTime(msg.timestamp)}</p>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="rounded-2xl px-4 py-3 flex items-center gap-2"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      <span className="text-slate-400 text-sm">Thinking…</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="max-w-3xl mx-auto flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask the AI Dev Team anything…"
                className="flex-1 h-11 text-sm"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e2e8f0",
                }}
                disabled={loading}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="h-11 px-4"
                style={{
                  background: loading || !input.trim() ? "rgba(59,130,246,0.3)" : "linear-gradient(135deg, #3b82f6, #6366f1)",
                  border: "none",
                  color: "white",
                }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-center text-slate-700 text-xs mt-2">
              Connected to {API_BASE} · M6 Production
            </p>
          </div>
        </div>

        {/* Right: Context Panel */}
        <div className="w-72 flex-shrink-0 flex flex-col"
          style={{ background: "rgba(10,13,20,0.8)", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="p-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-white text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              Capabilities
            </p>
            <p className="text-slate-500 text-xs mt-0.5">Available M6 modules</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {[
                { name: "n8n Builder", desc: "Workflow automation", color: "#f59e0b" },
                { name: "Bitrix24 Builder", desc: "CRM integration", color: "#3b82f6" },
                { name: "Business Site Ops", desc: "Site analysis & ops", color: "#10b981" },
                { name: "CMS Mastery", desc: "WordPress, Bitrix, Joomla", color: "#8b5cf6" },
                { name: "Visual QA", desc: "Screenshot comparison", color: "#06b6d4" },
                { name: "Design Profile", desc: "Style-aware generation", color: "#ec4899" },
                { name: "App Builder", desc: "Full-stack scaffolding", color: "#f97316" },
                { name: "DB Designer", desc: "Schema & migrations", color: "#84cc16" },
                { name: "RBAC Builder", desc: "Auth & permissions", color: "#ef4444" },
                { name: "Doc Builder v2", desc: "PRD, Spec, ADR", color: "#a78bfa" },
              ].map((cap) => (
                <div key={cap.name} className="flex items-center gap-3 p-2.5 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cap.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-xs font-medium">{cap.name}</p>
                    <p className="text-slate-600 text-xs">{cap.desc}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-700 flex-shrink-0" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </AppLayout>
  );
}
