/**
 * SchedulerPage — M10 Autonomous Execution
 * Design: Dark sidebar layout, monospace timestamps, status badges
 * Shows scheduler runs history, live status, pause/resume controls
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { API_BASE as API } from "../lib/api";

interface SchedulerRun {
  id: number;
  automation_id: number;
  automation_name: string;
  automation_type: string;
  project_id: number | null;
  project_name: string | null;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  duration_seconds: number | null;
  result_summary: string | null;
  error_message: string | null;
  retry_count: number;
  triggered_by: string;
  created_at: string;
}

interface ScheduledAutomation {
  id: number;
  name: string;
  task_type: string;
  cadence: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  last_status: string | null;
  run_count: number;
  fail_count: number;
}

const statusColors: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  running: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  paused: "bg-gray-100 text-gray-700",
  skipped: "bg-slate-100 text-slate-600",
};

function fmt(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
}

export default function SchedulerPage() {
  const { user } = useAuth();
  const [runs, setRuns] = useState<SchedulerRun[]>([]);
  const [automations, setAutomations] = useState<ScheduledAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"runs" | "automations">("automations");
  const [triggerLoading, setTriggerLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${(user as any)?.access_token || (user as any)?.token || ""}` };

  const load = useCallback(async () => {
    try {
      const [runsRes, autoRes] = await Promise.all([
        fetch(`${API}/scheduler/runs?limit=50`, { headers }),
        fetch(`${API}/automation/schedules`, { headers }),
      ]);
      if (runsRes.ok) setRuns(await runsRes.json());
      if (autoRes.ok) setAutomations(await autoRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const triggerRun = async (automationId: number) => {
    setTriggerLoading(automationId);
    try {
      const res = await fetch(`${API}/scheduler/trigger/${automationId}`, {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" }
      });
      if (res.ok) {
        setToast("Automation triggered successfully");
        setTimeout(() => { setToast(null); load(); }, 2000);
      } else {
        setToast("Failed to trigger automation");
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast("Network error");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setTriggerLoading(null);
    }
  };

  const toggleAutomation = async (id: number, currentlyActive: boolean) => {
    const action = currentlyActive ? "pause" : "resume";
    try {
      const res = await fetch(`${API}/scheduler/automations/${id}/${action}`, {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" }
      });
      if (res.ok) {
        setToast(`Automation ${action}d`);
        setTimeout(() => { setToast(null); load(); }, 1500);
      }
    } catch {
      setToast("Network error");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const runningCount = runs.filter(r => r.status === "running").length;
  const failedToday = runs.filter(r => r.status === "failed" && r.created_at > new Date(Date.now() - 86400000).toISOString()).length;
  const successRate = runs.length > 0
    ? Math.round((runs.filter(r => r.status === "success").length / runs.length) * 100)
    : 0;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Scheduler</h1>
        <p className="text-slate-500 text-sm mt-1">Autonomous execution engine — recurring automations and run history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Active Automations", value: automations.filter(a => a.is_active).length, color: "text-emerald-600" },
          { label: "Currently Running", value: runningCount, color: "text-blue-600" },
          { label: "Failed Today", value: failedToday, color: "text-red-600" },
          { label: "Success Rate", value: `${successRate}%`, color: "text-slate-700" },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
        {(["automations", "runs"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "automations" ? "Automations" : "Run History"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">Loading...</div>
      ) : tab === "automations" ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Cadence</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Last Run</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Next Run</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {automations.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">No automations configured</td></tr>
              ) : automations.map(auto => (
                <tr key={auto.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{auto.name}</div>
                    <div className="text-xs text-slate-400">{auto.run_count} runs · {auto.fail_count} fails</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{auto.task_type}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-slate-500">{auto.cadence}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      auto.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {auto.is_active ? "active" : "paused"}
                    </span>
                    {auto.last_status && (
                      <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[auto.last_status] || "bg-slate-100 text-slate-600"}`}>
                        {auto.last_status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs text-slate-500">{fmt(auto.last_run_at)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs text-slate-500">{fmt(auto.next_run_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => triggerRun(auto.id)}
                        disabled={triggerLoading === auto.id}
                        className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        {triggerLoading === auto.id ? "..." : "Run Now"}
                      </button>
                      <button
                        onClick={() => toggleAutomation(auto.id, auto.is_active)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          auto.is_active
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {auto.is_active ? "Pause" : "Resume"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Automation</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Started</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Duration</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">No runs yet</td></tr>
              ) : runs.map(run => (
                <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{run.automation_name || `Automation #${run.automation_id}`}</div>
                    <div className="text-xs text-slate-400">{run.project_name || "No project"} · {run.triggered_by}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[run.status] || "bg-slate-100 text-slate-600"}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-slate-500">{fmt(run.started_at || run.created_at)}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">
                    {run.duration_seconds ? `${run.duration_seconds}s` : "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500 max-w-xs truncate">
                    {run.error_message ? (
                      <span className="text-red-500">{run.error_message}</span>
                    ) : run.result_summary || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
