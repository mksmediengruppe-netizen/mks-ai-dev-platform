/* ============================================================
   OperationalMetricsPage — M9 Operational Metrics
   Platform-wide metrics: task success, load, errors, usage
   ============================================================ */

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  BarChart2, RefreshCw, TrendingUp, TrendingDown, Activity,
  CheckCircle2, XCircle, Clock, Zap, Users, FileText, AlertTriangle
} from "lucide-react";

import { API_BASE as API } from "../lib/api";

interface MetricCard {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface Metrics {
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  blocked_tasks: number;
  task_success_rate: number;
  total_automations: number;
  active_automations: number;
  automation_success_rate: number;
  total_batch_runs: number;
  completed_batch_runs: number;
  total_projects: number;
  active_projects: number;
  total_users: number;
  total_conversations: number;
  total_memory_snapshots: number;
  total_known_issues: number;
  open_issues: number;
  total_approvals: number;
  pending_approvals: number;
  total_audit_events: number;
  recent_audit_events: number;
}

function StatCard({ label, value, sub, trend, icon: Icon, color }: MetricCard) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-slate-400"
          }`}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function RateBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className={`font-bold ${value >= 80 ? "text-emerald-600" : value >= 50 ? "text-amber-600" : "text-red-600"}`}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default function OperationalMetricsPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [mR, dR] = await Promise.all([
        fetch(`${API}/metrics/operational`, { headers: { Authorization: `Bearer ${user?.token}` } }),
        fetch(`${API}/summaries/daily`, { headers: { Authorization: `Bearer ${user?.token}` } }),
      ]);
      if (mR.ok) setMetrics(await mR.json());
      if (dR.ok) setDailySummary(await dR.json());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const m = metrics;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              Operational Metrics
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Platform-wide performance and usage statistics</p>
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !m ? (
          <div className="text-center py-16 text-slate-400">
            <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No metrics available</p>
          </div>
        ) : (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Total Tasks"
                value={m.total_tasks}
                sub={`${m.completed_tasks} completed`}
                icon={FileText}
                color="bg-blue-50 text-blue-500"
                trend="up"
              />
              <StatCard
                label="Active Projects"
                value={m.active_projects}
                sub={`${m.total_projects} total`}
                icon={Activity}
                color="bg-emerald-50 text-emerald-500"
                trend="neutral"
              />
              <StatCard
                label="Open Issues"
                value={m.open_issues}
                sub={`${m.total_known_issues} total`}
                icon={AlertTriangle}
                color={m.open_issues > 5 ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"}
                trend={m.open_issues > 5 ? "down" : "neutral"}
              />
              <StatCard
                label="Pending Approvals"
                value={m.pending_approvals}
                sub={`${m.total_approvals} total`}
                icon={CheckCircle2}
                color="bg-purple-50 text-purple-500"
                trend="neutral"
              />
            </div>

            {/* Second row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Active Automations"
                value={m.active_automations}
                sub={`${m.total_automations} total`}
                icon={Zap}
                color="bg-violet-50 text-violet-500"
                trend="up"
              />
              <StatCard
                label="Batch Runs"
                value={m.completed_batch_runs}
                sub={`${m.total_batch_runs} total`}
                icon={BarChart2}
                color="bg-indigo-50 text-indigo-500"
                trend="neutral"
              />
              <StatCard
                label="Total Users"
                value={m.total_users}
                sub="Platform members"
                icon={Users}
                color="bg-slate-100 text-slate-500"
                trend="neutral"
              />
              <StatCard
                label="Conversations"
                value={m.total_conversations}
                sub={`${m.total_memory_snapshots} memory snapshots`}
                icon={Clock}
                color="bg-cyan-50 text-cyan-500"
                trend="up"
              />
            </div>

            {/* Success Rates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Success Rates</h3>
                <RateBar
                  label="Task Completion Rate"
                  value={m.task_success_rate}
                  color={m.task_success_rate >= 80 ? "bg-emerald-400" : m.task_success_rate >= 50 ? "bg-amber-400" : "bg-red-400"}
                />
                <RateBar
                  label="Automation Health"
                  value={m.automation_success_rate}
                  color={m.automation_success_rate >= 80 ? "bg-emerald-400" : m.automation_success_rate >= 50 ? "bg-amber-400" : "bg-red-400"}
                />
                <RateBar
                  label="Batch Run Success"
                  value={m.total_batch_runs > 0 ? (m.completed_batch_runs / m.total_batch_runs) * 100 : 0}
                  color="bg-blue-400"
                />
                <RateBar
                  label="Issue Resolution"
                  value={m.total_known_issues > 0 ? ((m.total_known_issues - m.open_issues) / m.total_known_issues) * 100 : 100}
                  color="bg-purple-400"
                />
              </div>

              {/* Task Breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Task Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: "Completed", value: m.completed_tasks, total: m.total_tasks, color: "bg-emerald-400", icon: CheckCircle2, iconColor: "text-emerald-500" },
                    { label: "Failed", value: m.failed_tasks, total: m.total_tasks, color: "bg-red-400", icon: XCircle, iconColor: "text-red-500" },
                    { label: "Blocked", value: m.blocked_tasks, total: m.total_tasks, color: "bg-amber-400", icon: AlertTriangle, iconColor: "text-amber-500" },
                    { label: "In Progress", value: m.total_tasks - m.completed_tasks - m.failed_tasks - m.blocked_tasks, total: m.total_tasks, color: "bg-blue-400", icon: Activity, iconColor: "text-blue-500" },
                  ].map(item => {
                    const pct = m.total_tasks > 0 ? Math.round((Math.max(0, item.value) / m.total_tasks) * 100) : 0;
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${item.iconColor}`} />
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600">{item.label}</span>
                            <span className="font-medium text-slate-700">{Math.max(0, item.value)}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Daily Summary */}
            {dailySummary && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Today's Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Tasks Completed", value: dailySummary.tasks_completed_today ?? 0 },
                    { label: "Issues Opened", value: dailySummary.issues_opened_today ?? 0 },
                    { label: "Automations Run", value: dailySummary.automations_run_today ?? 0 },
                    { label: "Audit Events", value: dailySummary.audit_events_today ?? 0 },
                  ].map(item => (
                    <div key={item.label} className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xl font-bold text-slate-800">{item.value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
