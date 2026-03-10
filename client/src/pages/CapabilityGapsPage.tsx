/* ============================================================
   CapabilityGapsPage — M7 Capability Gap Registry
   Track what the system can't do yet and recommended actions
   ============================================================ */

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Puzzle, RefreshCw, AlertCircle, CheckCircle2, Clock, Plus, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

import { API_BASE } from "../lib/api";

interface CapabilityGap {
  id: number;
  project_id: number | null;
  task_id: number | null;
  gap_type: string;
  description: string;
  recommended_action: string | null;
  status: string;
  priority: string;
  created_at: string;
  resolved_at: string | null;
}

const PRIORITY_STYLES: Record<string, string> = {
  high:   "bg-red-50 text-red-700 border-red-100",
  medium: "bg-amber-50 text-amber-700 border-amber-100",
  low:    "bg-slate-50 text-slate-600 border-slate-200",
};

const STATUS_STYLES: Record<string, string> = {
  open:     "bg-blue-50 text-blue-700",
  resolved: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-purple-50 text-purple-700",
};

const TYPE_STYLES: Record<string, string> = {
  skill:       "bg-indigo-50 text-indigo-700",
  integration: "bg-cyan-50 text-cyan-700",
  template:    "bg-orange-50 text-orange-700",
  escalation:  "bg-red-50 text-red-700",
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CapabilityGapsPage() {
  const { user } = useAuth();
  const [gaps, setGaps]       = useState<CapabilityGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [filter, setFilter]   = useState<"all" | "open" | "resolved">("all");

  const fetchGaps = async (status = filter) => {
    if (!user?.token) return;
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (status !== "all") params.set("status", status);
      const res = await fetch(`${API_BASE}/capability-gaps?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setGaps(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGaps(); }, [user?.token]);

  const openCount     = gaps.filter(g => g.status === "open").length;
  const resolvedCount = gaps.filter(g => g.status === "resolved").length;
  const highPriority  = gaps.filter(g => g.priority === "high" && g.status === "open").length;

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Puzzle className="w-4 h-4 text-cyan-500" />
            <div>
              <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                Capability Gaps
              </h1>
              <p className="text-slate-500 text-xs">
                {loading ? "Loading…" : `${openCount} open · ${resolvedCount} resolved`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600"
              onClick={() => fetchGaps()} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button className="h-8 text-xs gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white border-0"
              onClick={() => toast.info("Feature coming soon")}>
              <Plus className="w-3.5 h-3.5" /> Report Gap
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && !error && (
          <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-sm">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-slate-600 font-medium">{highPriority}</span>
              <span className="text-slate-400 text-xs">high priority</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-slate-600 font-medium">{openCount}</span>
              <span className="text-slate-400 text-xs">open</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium">{resolvedCount}</span>
              <span className="text-slate-400 text-xs">resolved</span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              {(["all", "open", "resolved"] as const).map(s => (
                <button key={s} onClick={() => { setFilter(s); fetchGaps(s); }}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${filter === s ? "bg-cyan-50 text-cyan-700 border-cyan-200 font-medium" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Error: {error}</span>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                Loading capability gaps…
              </div>
            )}

            {!loading && gaps.length === 0 && !error && (
              <div className="bg-white rounded-xl border border-slate-100 p-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No capability gaps found. System is fully capable.</p>
              </div>
            )}

            {!loading && gaps.map(gap => {
              const priorityClass = PRIORITY_STYLES[gap.priority] || PRIORITY_STYLES.low;
              const statusClass   = STATUS_STYLES[gap.status] || "bg-slate-100 text-slate-600";
              const typeClass     = TYPE_STYLES[gap.gap_type] || "bg-slate-100 text-slate-600";
              return (
                <div key={gap.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${priorityClass}`}>
                        {gap.priority}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusClass}`}>
                        {gap.status}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeClass}`}>
                        {gap.gap_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {relativeTime(gap.created_at)}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-700 font-medium leading-snug">{gap.description}</p>
                  {gap.recommended_action && (
                    <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
                      <ArrowUpRight className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
                      <span>{gap.recommended_action}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
