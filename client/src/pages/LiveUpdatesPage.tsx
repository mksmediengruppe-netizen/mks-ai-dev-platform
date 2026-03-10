/**
 * LiveUpdatesPage — M10 Real-Time Collaboration
 * Design: Activity feed style, auto-polling, live portfolio status
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { API_BASE as API } from "../lib/api";

interface LiveEvent {
  id: number;
  event_type: string;
  entity_type: string | null;
  entity_id: number | null;
  project_id: number | null;
  project_name: string | null;
  payload: string | null;
  actor_email: string | null;
  created_at: string;
}

interface PortfolioProject {
  id: number;
  name: string;
  status: string;
  score: number | null;
  trend: string | null;
  risk_level: string | null;
  active_tasks: number;
  open_escalations: number;
  running_automations: number;
}

const eventTypeColors: Record<string, string> = {
  message_sent: "bg-blue-100 text-blue-700",
  task_created: "bg-emerald-100 text-emerald-700",
  task_completed: "bg-green-100 text-green-700",
  escalation_created: "bg-red-100 text-red-700",
  approval_requested: "bg-amber-100 text-amber-700",
  automation_triggered: "bg-purple-100 text-purple-700",
  project_archived: "bg-slate-100 text-slate-600",
  user_action: "bg-slate-100 text-slate-600",
};

const eventIcon: Record<string, string> = {
  message_sent: "💬",
  task_created: "✅",
  task_completed: "🎉",
  escalation_created: "🚨",
  approval_requested: "⏳",
  automation_triggered: "⚡",
  project_archived: "📦",
  user_action: "👤",
};

function timeAgo(dt: string) {
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function LiveUpdatesPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestId, setLatestId] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const headers = { Authorization: `Bearer ${(user as any)?.access_token || (user as any)?.token || ""}` };

  const loadInitial = useCallback(async () => {
    try {
      const [eventsRes, portfolioRes, latestRes] = await Promise.all([
        fetch(`${API}/live/events?limit=30`, { headers }),
        fetch(`${API}/live/portfolio-status`, { headers }),
        fetch(`${API}/live/events/latest-id`, { headers }),
      ]);
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (portfolioRes.ok) {
        const data = await portfolioRes.json();
        setPortfolio(data.projects || []);
      }
      if (latestRes.ok) {
        const data = await latestRes.json();
        setLatestId(data.latest_id || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const pollNewEvents = useCallback(async () => {
    if (!isLive) return;
    try {
      const res = await fetch(`${API}/live/events?since_id=${latestId}&limit=20`, { headers });
      if (res.ok) {
        const newEvents: LiveEvent[] = await res.json();
        if (newEvents.length > 0) {
          setEvents(prev => [...newEvents, ...prev].slice(0, 100));
          setLatestId(newEvents[0].id);
          setNewCount(prev => prev + newEvents.length);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [latestId, isLive]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(pollNewEvents, 8000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isLive, pollNewEvents]);

  const riskColor = (level: string | null) => {
    if (level === "critical") return "text-red-600";
    if (level === "high") return "text-orange-600";
    if (level === "medium") return "text-amber-600";
    return "text-emerald-600";
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Updates</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time platform activity and portfolio status</p>
        </div>
        <div className="flex items-center gap-3">
          {newCount > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              +{newCount} new
            </span>
          )}
          <button
            onClick={() => { setIsLive(!isLive); setNewCount(0); }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isLive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            {isLive ? "Live" : "Paused"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Status Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h2 className="font-semibold text-slate-800 mb-3 text-sm">Portfolio Status</h2>
            {portfolio.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">No projects</div>
            ) : (
              <div className="space-y-3">
                {portfolio.map(p => (
                  <div key={p.id} className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 text-sm truncate">{p.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{p.active_tasks} tasks</span>
                        {p.open_escalations > 0 && (
                          <span className="text-xs text-red-500">{p.open_escalations} esc.</span>
                        )}
                        {p.running_automations > 0 && (
                          <span className="text-xs text-blue-500">{p.running_automations} running</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      {p.score !== null && (
                        <div className={`text-sm font-bold ${riskColor(p.risk_level)}`}>{Math.round(p.score)}</div>
                      )}
                      {p.trend && (
                        <div className="text-xs text-slate-400">
                          {p.trend === "improving" ? "↑" : p.trend === "declining" ? "↓" : "→"}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 text-sm">Activity Feed</h2>
              <button
                onClick={() => { loadInitial(); setNewCount(0); }}
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                Refresh
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-48 text-slate-400">Loading...</div>
            ) : events.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No events yet</div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                {events.map(event => (
                  <div key={event.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-lg leading-none mt-0.5">
                        {eventIcon[event.event_type] || "📌"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${eventTypeColors[event.event_type] || "bg-slate-100 text-slate-600"}`}>
                            {event.event_type.replace(/_/g, " ")}
                          </span>
                          {event.project_name && (
                            <span className="text-xs text-slate-500">{event.project_name}</span>
                          )}
                        </div>
                        {event.actor_email && (
                          <div className="text-xs text-slate-400 mt-0.5">{event.actor_email}</div>
                        )}
                        {event.payload && (() => {
                          try {
                            const p = JSON.parse(event.payload);
                            const msg = p.title || p.message || p.name || "";
                            return msg ? <div className="text-xs text-slate-600 mt-0.5 truncate">{msg}</div> : null;
                          } catch { return null; }
                        })()}
                      </div>
                      <div className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(event.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
