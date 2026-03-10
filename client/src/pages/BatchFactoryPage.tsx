/* ============================================================
   BatchFactoryPage — M9 Batch / Task Factory
   View batch runs, trigger new batches, monitor execution
   ============================================================ */

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Factory, Plus, RefreshCw, CheckCircle2, XCircle, Clock,
  Play, ChevronDown, ChevronUp, BarChart2, Layers, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { API_BASE as API } from "../lib/api";

interface BatchRun {
  id: number;
  name: string;
  batch_type: string;
  status: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  triggered_by: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  summary: string | null;
}

const STATUS_STYLE: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  completed: { color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  failed: { color: "text-red-600 bg-red-50 border-red-200", icon: XCircle },
  running: { color: "text-blue-600 bg-blue-50 border-blue-200", icon: Play },
  pending: { color: "text-slate-500 bg-slate-50 border-slate-200", icon: Clock },
  partial: { color: "text-amber-600 bg-amber-50 border-amber-200", icon: AlertCircle },
};

const BATCH_TYPES = [
  { value: "seo_audit", label: "SEO Audit" },
  { value: "health_check", label: "Health Check" },
  { value: "integration_check", label: "Integration Check" },
  { value: "memory_snapshot", label: "Memory Snapshot" },
  { value: "report", label: "Report Generation" },
  { value: "build_check", label: "Build Check" },
  { value: "backup", label: "Backup" },
];

function ProgressBar({ completed, total, failed }: { completed: number; total: number; failed: number }) {
  if (total === 0) return <div className="w-full bg-slate-100 rounded-full h-2" />;
  const pctDone = Math.round((completed / total) * 100);
  const pctFailed = Math.round((failed / total) * 100);
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
      <div className="bg-emerald-400 h-2 transition-all" style={{ width: `${pctDone}%` }} />
      <div className="bg-red-400 h-2 transition-all" style={{ width: `${pctFailed}%` }} />
    </div>
  );
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return "—";
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const secs = Math.floor((e - s) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ${secs % 60}s`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function BatchFactoryPage() {
  const { user } = useAuth();
  const [runs, setRuns] = useState<BatchRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("health_check");
  const [newTasks, setNewTasks] = useState(5);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/factory/batch-runs`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!r.ok) throw new Error("Failed to load batch runs");
      setRuns(await r.json());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!newName.trim()) { toast.error("Name is required"); return; }
    setCreating(true);
    try {
      const r = await fetch(`${API}/factory/batch-run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, batch_type: newType, total_tasks: newTasks }),
      });
      if (!r.ok) throw new Error("Failed to create batch run");
      toast.success("Batch run created");
      setShowCreate(false);
      setNewName("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const completed = runs.filter(r => r.status === "completed").length;
  const running = runs.filter(r => r.status === "running").length;
  const failed = runs.filter(r => r.status === "failed").length;
  const totalTasks = runs.reduce((sum, r) => sum + r.total_tasks, 0);
  const completedTasks = runs.reduce((sum, r) => sum + r.completed_tasks, 0);

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              Batch Task Factory
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage and monitor batch execution runs</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              New Batch Run
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Runs</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{runs.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Play className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Running</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{running}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Completed</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{completed}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Tasks Done</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{completedTasks}<span className="text-slate-400 text-sm font-normal">/{totalTasks}</span></p>
          </div>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-white border border-blue-200 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">New Batch Run</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">Name *</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Weekly Health Batch"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">Batch Type</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {BATCH_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">Task Count</label>
                <input
                  type="number"
                  value={newTasks}
                  onChange={e => setNewTasks(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <Button onClick={create} disabled={creating} className="text-sm">
                {creating ? "Creating..." : "Launch Batch"}
              </Button>
            </div>
          </div>
        )}

        {/* Batch Runs List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Factory className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No batch runs yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map(run => {
              const s = STATUS_STYLE[run.status] || STATUS_STYLE.pending;
              const StatusIcon = s.icon;
              const pct = run.total_tasks > 0 ? Math.round((run.completed_tasks / run.total_tasks) * 100) : 0;
              return (
                <div key={run.id} className="bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow">
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === run.id ? null : run.id)}
                  >
                    <StatusIcon className={`w-5 h-5 flex-shrink-0 ${s.color.split(" ")[0]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-800">{run.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${s.color}`}>
                          {run.status}
                        </span>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {BATCH_TYPES.find(t => t.value === run.batch_type)?.label || run.batch_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <ProgressBar completed={run.completed_tasks} total={run.total_tasks} failed={run.failed_tasks} />
                        <span className="text-xs text-slate-500 flex-shrink-0">{pct}%</span>
                      </div>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-slate-400">Duration</p>
                      <p className="text-xs font-medium text-slate-600">{formatDuration(run.started_at, run.completed_at)}</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-slate-400">{run.completed_tasks}/{run.total_tasks} tasks</p>
                      {run.failed_tasks > 0 && <p className="text-xs text-red-500">{run.failed_tasks} failed</p>}
                    </div>
                    {expandedId === run.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                  {expandedId === run.id && (
                    <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">Triggered By</p>
                          <p className="text-slate-600">{run.triggered_by}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">Started</p>
                          <p className="text-slate-600">{formatDate(run.started_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">Completed</p>
                          <p className="text-slate-600">{formatDate(run.completed_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">Created</p>
                          <p className="text-slate-600">{formatDate(run.created_at)}</p>
                        </div>
                      </div>
                      {run.summary && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">Summary</p>
                          <p className="text-sm text-slate-600">{run.summary}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
