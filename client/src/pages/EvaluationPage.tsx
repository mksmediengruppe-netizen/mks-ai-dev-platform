/* ============================================================
   EvaluationPage — M7 Agent Evaluation Framework
   Live metrics: success rate, retry rate, time-to-complete
   ============================================================ */

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BarChart2, RefreshCw, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { API_BASE } from "../lib/api";

interface AgentMetric {
  agent: string;
  metrics: Record<string, { avg: number; samples: number; latest_window: string }>;
}

const AGENT_COLORS: Record<string, string> = {
  planner:        "bg-blue-100 text-blue-700",
  coder:          "bg-emerald-100 text-emerald-700",
  browser_worker: "bg-amber-100 text-amber-700",
  qa_worker:      "bg-purple-100 text-purple-700",
};

const METRIC_LABELS: Record<string, string> = {
  success_rate:     "Success Rate",
  retry_rate:       "Retry Rate",
  time_to_complete: "Avg Time (s)",
};

function MetricCard({ label, value, key_ }: { label: string; value: number; key_: string }) {
  const isRate = key_.includes("rate");
  const isGood = key_ === "success_rate" ? value >= 0.8 : key_ === "retry_rate" ? value <= 0.15 : true;
  const pct = isRate ? `${(value * 100).toFixed(1)}%` : `${value.toFixed(1)}s`;
  const color = isRate ? (isGood ? "text-emerald-600" : "text-red-500") : "text-slate-700";
  const Icon = isRate ? (isGood ? TrendingUp : TrendingDown) : Clock;
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <p className={`text-xl font-bold ${color}`}>{pct}</p>
      {isRate && (
        <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isGood ? "bg-emerald-500" : "bg-red-400"}`}
            style={{ width: `${Math.min(value * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function EvaluationPage() {
  const { user } = useAuth();
  const [agents, setAgents]   = useState<AgentMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchMetrics = async () => {
    if (!user?.token) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/evaluation/summary`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAgents(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, [user?.token]);

  // Overall platform health
  const allSuccessRates = agents
    .map(a => a.metrics["success_rate"]?.avg)
    .filter(Boolean) as number[];
  const avgSuccess = allSuccessRates.length
    ? allSuccessRates.reduce((a, b) => a + b, 0) / allSuccessRates.length
    : null;

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <div>
              <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                Agent Evaluation
              </h1>
              <p className="text-slate-500 text-xs">
                {loading ? "Loading…" : `${agents.length} agents tracked`}
              </p>
            </div>
          </div>
          <Button variant="outline" className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600"
            onClick={fetchMetrics} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Error: {error}</span>
              </div>
            )}

            {/* Platform health summary */}
            {!loading && avgSuccess !== null && (
              <div className={`rounded-xl border p-4 flex items-center gap-4 ${avgSuccess >= 0.8 ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}>
                <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${avgSuccess >= 0.8 ? "text-emerald-600" : "text-amber-600"}`} />
                <div>
                  <p className={`text-sm font-semibold ${avgSuccess >= 0.8 ? "text-emerald-800" : "text-amber-800"}`}>
                    Platform Health: {avgSuccess >= 0.8 ? "Good" : "Needs Attention"}
                  </p>
                  <p className={`text-xs ${avgSuccess >= 0.8 ? "text-emerald-600" : "text-amber-600"}`}>
                    Average agent success rate: {(avgSuccess * 100).toFixed(1)}% across {agents.length} agents
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
                Loading evaluation data…
              </div>
            )}

            {!loading && agents.map(agent => {
              const colorClass = AGENT_COLORS[agent.agent] || "bg-slate-100 text-slate-700";
              return (
                <div key={agent.agent} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${colorClass}`}>
                      {agent.agent}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {Object.values(agent.metrics)[0]?.samples ?? 0} data points
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(METRIC_LABELS).map(([key, label]) => {
                      const m = agent.metrics[key];
                      if (!m) return null;
                      return <MetricCard key={key} label={label} value={m.avg} key_={key} />;
                    })}
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
