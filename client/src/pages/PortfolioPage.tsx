/* ============================================================
   PortfolioPage — M9 Portfolio Dashboard
   Shows all projects, health, active tasks, risks, approvals
   ============================================================ */

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Briefcase, Activity, AlertTriangle, CheckCircle2, Clock,
  TrendingUp, RefreshCw, Filter, ExternalLink, Archive,
  ChevronRight, Circle, XCircle, Zap
} from "lucide-react";

import { API_BASE as API } from "../lib/api";

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  risk_level: string;
  app_type: string;
  last_activity_at: string | null;
  active_tasks: number;
  blocked_tasks: number;
  pending_approvals: number;
  open_issues: number;
  last_release_at: string | null;
  last_backup_at: string | null;
}

interface PortfolioSummary {
  projects: Project[];
  summary: {
    total_projects: number;
    active: number;
    blocked: number;
    high_risk: number;
    total_active_tasks: number;
    total_pending_approvals: number;
    automation_health: string;
  };
}

const RISK_COLORS: Record<string, string> = {
  low: "text-emerald-600 bg-emerald-50 border-emerald-200",
  medium: "text-amber-600 bg-amber-50 border-amber-200",
  high: "text-red-600 bg-red-50 border-red-200",
  critical: "text-red-800 bg-red-100 border-red-300",
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-600 bg-emerald-50",
  blocked: "text-red-600 bg-red-50",
  paused: "text-amber-600 bg-amber-50",
  archived: "text-slate-500 bg-slate-100",
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  active: CheckCircle2,
  blocked: XCircle,
  paused: Clock,
  archived: Archive,
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function HealthBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "blocked" | "high_risk">("all");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/portfolio/summary`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!r.ok) throw new Error("Failed to load portfolio");
      setData(await r.json());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = data?.projects.filter(p => {
    if (filter === "active") return p.status === "active";
    if (filter === "blocked") return p.status === "blocked";
    if (filter === "high_risk") return p.risk_level === "high" || p.risk_level === "critical";
    return true;
  }) ?? [];

  const s = data?.summary;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              Portfolio Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Overview of all active projects and their health</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        {s && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Projects</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.total_projects}</p>
              <p className="text-xs text-slate-400 mt-1">{s.active} active · {s.blocked} blocked</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Active Tasks</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.total_active_tasks}</p>
              <p className="text-xs text-slate-400 mt-1">Across all projects</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">High Risk</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.high_risk}</p>
              <p className="text-xs text-slate-400 mt-1">Projects needing attention</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Automations</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.automation_health}</p>
              <p className="text-xs text-slate-400 mt-1">Healthy / Total</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          {(["all", "active", "blocked", "high_risk"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f === "all" ? "All" : f === "high_risk" ? "High Risk" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400">{filtered.length} projects</span>
        </div>

        {/* Project Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No projects found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(p => {
              const StatusIcon = STATUS_ICONS[p.status] || Circle;
              return (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className={`w-4 h-4 flex-shrink-0 ${STATUS_COLORS[p.status]?.split(" ")[0]}`} />
                        <h3 className="text-sm font-semibold text-slate-800 truncate">{p.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{p.description || "No description"}</p>
                    </div>
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full border font-medium flex-shrink-0 ${RISK_COLORS[p.risk_level] || RISK_COLORS.low}`}>
                      {p.risk_level}
                    </span>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { label: "Tasks", value: p.active_tasks, color: "text-blue-600" },
                      { label: "Blocked", value: p.blocked_tasks, color: "text-red-500" },
                      { label: "Approvals", value: p.pending_approvals, color: "text-amber-500" },
                      { label: "Issues", value: p.open_issues, color: "text-orange-500" },
                    ].map(m => (
                      <div key={m.label} className="text-center">
                        <p className={`text-lg font-bold ${m.value > 0 ? m.color : "text-slate-300"}`}>{m.value}</p>
                        <p className="text-xs text-slate-400">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Health bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Task health</span>
                      <span>{p.blocked_tasks > 0 ? `${p.blocked_tasks} blocked` : "All clear"}</span>
                    </div>
                    <HealthBar
                      value={p.active_tasks - p.blocked_tasks}
                      max={p.active_tasks || 1}
                      color={p.blocked_tasks > 0 ? "bg-amber-400" : "bg-emerald-400"}
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <span>
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      {timeAgo(p.last_activity_at)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || ""}`}>
                        {p.status}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="uppercase text-slate-400">{p.app_type}</span>
                    </div>
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
