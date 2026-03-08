/* ============================================================
   KnownIssuesPage — M7 Intelligence section
   Fetches known_issues from /known-issues API
   ============================================================ */

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertTriangle, CheckCircle2, Clock, RefreshCw, Bug } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "https://api.mksitdev.ru";

interface KnownIssue {
  id: number;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved" | "wont_fix";
  component: string;
  workaround: string | null;
  reported_at: string;
  resolved_at: string | null;
}

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: "Critical", color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-500" },
  high:     { label: "High",     color: "text-orange-700", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-500" },
  medium:   { label: "Medium",   color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-400" },
  low:      { label: "Low",      color: "text-slate-600", bg: "bg-slate-50 border-slate-200", dot: "bg-slate-400" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  open:        { label: "Open",        icon: AlertTriangle, color: "text-red-500" },
  in_progress: { label: "In Progress", icon: Clock,         color: "text-amber-500" },
  resolved:    { label: "Resolved",    icon: CheckCircle2,  color: "text-emerald-500" },
  wont_fix:    { label: "Won't Fix",   icon: Bug,           color: "text-slate-400" },
};

export default function KnownIssuesPage() {
  const { user } = useAuth();
  const token = user?.token || "";
  const [issues, setIssues] = useState<KnownIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");

  const loadIssues = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/known-issues`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || data || []);
      } else {
        toast.error("Failed to load known issues");
      }
    } catch {
      toast.error("Network error loading issues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadIssues(); }, [token]);

  const filtered = issues.filter(i => {
    if (filter === "open") return i.status === "open" || i.status === "in_progress";
    if (filter === "resolved") return i.status === "resolved" || i.status === "wont_fix";
    return true;
  });

  const counts = {
    all: issues.length,
    open: issues.filter(i => i.status === "open" || i.status === "in_progress").length,
    resolved: issues.filter(i => i.status === "resolved" || i.status === "wont_fix").length,
  };

  const formatDate = (ts: string) => {
    try { return new Date(ts).toLocaleDateString("ru-RU"); } catch { return ts; }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-slate-900 text-xl font-bold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                Known Issues
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">Tracked bugs and limitations across M7 components</p>
            </div>
            <button
              onClick={loadIssues}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4">
            {[
              { key: "all", label: "All Issues", count: counts.all, color: "text-slate-700" },
              { key: "open", label: "Open", count: counts.open, color: "text-red-600" },
              { key: "resolved", label: "Resolved", count: counts.resolved, color: "text-emerald-600" },
            ].map(({ key, label, count, color }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span className={filter === key ? "text-white" : color}>{count}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-3 max-w-4xl">
            {loading && (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Loading issues...</span>
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No issues found</p>
                <p className="text-sm mt-1">
                  {filter === "open" ? "All issues are resolved!" : "No issues in this category."}
                </p>
              </div>
            )}

            {!loading && filtered.map(issue => {
              const sev = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.low;
              const stat = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
              const StatIcon = stat.icon;

              return (
                <div
                  key={issue.id}
                  className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-sm ${sev.bg}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${sev.dot}`} />
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <h3 className="text-slate-800 font-semibold text-sm">{issue.title}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${sev.bg} ${sev.color}`}>
                            {sev.label}
                          </span>
                          <span className={`flex items-center gap-1 text-xs ${stat.color}`}>
                            <StatIcon className="w-3 h-3" />
                            {stat.label}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">{issue.description}</p>

                      {/* Workaround */}
                      {issue.workaround && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                          <p className="text-amber-700 text-xs font-semibold mb-0.5">Workaround</p>
                          <p className="text-amber-800 text-xs">{issue.workaround}</p>
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span>Component: <span className="text-slate-600 font-medium">{issue.component}</span></span>
                        <span>Reported: {formatDate(issue.reported_at)}</span>
                        {issue.resolved_at && (
                          <span>Resolved: {formatDate(issue.resolved_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
