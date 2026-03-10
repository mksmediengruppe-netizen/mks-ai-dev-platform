/* ============================================================
   OperatorQueuePage — M9 Operator Queue
   Unified queue: pending approvals, blocked tasks, failed automations, open issues
   ============================================================ */

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Inbox, RefreshCw, CheckCircle2, AlertTriangle, XCircle,
  Zap, Clock, ChevronRight, Filter
} from "lucide-react";

import { API_BASE as API } from "../lib/api";

interface QueueItem {
  type: string;
  id: number;
  title: string;
  priority: string;
  created_at: string | null;
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string; bg: string }> = {
  approval: { icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-50", label: "Approval" },
  blocked_task: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", label: "Blocked Task" },
  failed_automation: { icon: Zap, color: "text-amber-600", bg: "bg-amber-50", label: "Failed Automation" },
  open_issue: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", label: "Open Issue" },
};

const PRIORITY_STYLE: Record<string, string> = {
  critical: "text-red-700 bg-red-100 border-red-200",
  high: "text-red-600 bg-red-50 border-red-100",
  medium: "text-amber-600 bg-amber-50 border-amber-100",
  low: "text-slate-500 bg-slate-100 border-slate-200",
};

function timeAgo(d: string | null) {
  if (!d) return "Unknown";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function OperatorQueuePage() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/operator/queue`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!r.ok) throw new Error("Failed to load operator queue");
      const data = await r.json();
      setQueue(data.queue || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const types = ["all", ...Object.keys(TYPE_CONFIG)];
  const filtered = typeFilter === "all" ? queue : queue.filter(q => q.type === typeFilter);

  const counts = Object.keys(TYPE_CONFIG).reduce((acc, t) => {
    acc[t] = queue.filter(q => q.type === t).length;
    return acc;
  }, {} as Record<string, number>);

  const critical = queue.filter(q => q.priority === "critical" || q.priority === "high").length;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              Operator Queue
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Unified queue of items requiring operator attention</p>
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={type} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${cfg.bg}`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-800">{counts[type] || 0}</p>
                <p className="text-xs text-slate-500 mt-0.5">{cfg.label}s</p>
              </div>
            );
          })}
        </div>

        {/* Critical Alert */}
        {critical > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              {critical} item{critical > 1 ? "s" : ""} with high/critical priority require immediate attention
            </p>
          </div>
        )}

        {/* Type Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          {types.map(t => {
            const count = t === "all" ? queue.length : counts[t] || 0;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  typeFilter === t
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {t === "all" ? "All" : TYPE_CONFIG[t]?.label || t}
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${typeFilter === t ? "bg-blue-500" : "bg-slate-100 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Queue Items */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Queue is empty</p>
            <p className="text-sm mt-1">No items requiring operator attention</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item, i) => {
              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.open_issue;
              const Icon = cfg.icon;
              return (
                <div key={`${item.type}-${item.id}-${i}`} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                          {item.title}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full border font-medium flex-shrink-0 ${PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.low}`}>
                          {item.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-slate-200">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(item.created_at)}
                        </span>
                        <span className="text-slate-200">·</span>
                        <span>#{item.id}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
