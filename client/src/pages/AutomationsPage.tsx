/* ============================================================
   AutomationsPage — M9 Recurring / Scheduled Automations
   Create, view, toggle recurring tasks and schedules
   ============================================================ */

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Zap, Plus, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  Clock, Play, Pause, Calendar, Activity, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { API_BASE as API } from "../lib/api";

interface Automation {
  id: number;
  project_id: number | null;
  project_name: string | null;
  name: string;
  description: string;
  task_type: string;
  cadence: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  last_status: string;
  run_count: number;
  fail_count: number;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  success: "text-emerald-600 bg-emerald-50",
  warning: "text-amber-600 bg-amber-50",
  failed: "text-red-600 bg-red-50",
  pending: "text-slate-500 bg-slate-100",
  running: "text-blue-600 bg-blue-50",
};

const CADENCE_LABELS: Record<string, string> = {
  hourly: "Every hour",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  manual: "Manual only",
};

const TASK_TYPE_LABELS: Record<string, string> = {
  health_check: "Health Check",
  seo_audit: "SEO Audit",
  integration_check: "Integration Check",
  report: "Report",
  memory_snapshot: "Memory Snapshot",
  build_check: "Build Check",
  backup: "Backup",
  check: "Check",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function SuccessRate({ run_count, fail_count }: { run_count: number; fail_count: number }) {
  if (run_count === 0) return <span className="text-slate-400 text-xs">No runs yet</span>;
  const rate = Math.round(((run_count - fail_count) / run_count) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 bg-slate-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${rate >= 80 ? "bg-emerald-400" : rate >= 50 ? "bg-amber-400" : "bg-red-400"}`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-xs text-slate-500">{rate}%</span>
    </div>
  );
}

export default function AutomationsPage() {
  const { user } = useAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("health_check");
  const [newCadence, setNewCadence] = useState("daily");
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/automation/schedules`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!r.ok) throw new Error("Failed to load automations");
      setAutomations(await r.json());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id: number, current: boolean) => {
    try {
      const r = await fetch(`${API}/automation/schedules/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user?.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !current }),
      });
      if (!r.ok) throw new Error("Failed to update automation");
      toast.success(current ? "Automation paused" : "Automation activated");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const create = async () => {
    if (!newName.trim()) { toast.error("Name is required"); return; }
    setCreating(true);
    try {
      const r = await fetch(`${API}/automation/schedule`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc, task_type: newType, cadence: newCadence }),
      });
      if (!r.ok) throw new Error("Failed to create automation");
      toast.success("Automation created");
      setShowCreate(false);
      setNewName(""); setNewDesc("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const active = automations.filter(a => a.is_active);
  const inactive = automations.filter(a => !a.is_active);
  const healthy = active.filter(a => a.last_status === "success").length;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              Recurring Automations
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Scheduled tasks, checks, and recurring workflows</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Automation
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Active</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{active.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Healthy</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{healthy}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Paused</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{inactive.length}</p>
          </div>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-white border border-blue-200 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">New Scheduled Automation</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">Name *</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Daily Health Check"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">Description</label>
                <input
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="What does this automation do?"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">Task Type</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">Cadence</label>
                <select
                  value={newCadence}
                  onChange={e => setNewCadence(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(CADENCE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <Button onClick={create} disabled={creating} className="text-sm">
                {creating ? "Creating..." : "Create Automation"}
              </Button>
            </div>
          </div>
        )}

        {/* Automations List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : automations.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No automations yet</p>
            <p className="text-sm mt-1">Create your first scheduled automation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {automations.map(a => (
              <div key={a.id} className={`bg-white rounded-xl border transition-shadow ${a.is_active ? "border-slate-200 hover:shadow-sm" : "border-slate-100 opacity-70"}`}>
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                >
                  {/* Status indicator */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    !a.is_active ? "bg-slate-300" :
                    a.last_status === "success" ? "bg-emerald-400" :
                    a.last_status === "failed" ? "bg-red-400" :
                    a.last_status === "warning" ? "bg-amber-400" : "bg-slate-300"
                  }`} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{a.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_STYLE[a.last_status] || STATUS_STYLE.pending}`}>
                        {a.last_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400">{TASK_TYPE_LABELS[a.task_type] || a.task_type}</span>
                      <span className="text-slate-200">·</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {CADENCE_LABELS[a.cadence] || a.cadence}
                      </span>
                      {a.project_name && (
                        <>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-blue-500">{a.project_name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Success rate */}
                  <div className="hidden md:block w-24">
                    <SuccessRate run_count={a.run_count} fail_count={a.fail_count} />
                    <p className="text-xs text-slate-400 mt-0.5">{a.run_count} runs</p>
                  </div>

                  {/* Next run */}
                  <div className="hidden md:block text-right">
                    <p className="text-xs text-slate-400">Next run</p>
                    <p className="text-xs font-medium text-slate-600">{formatDate(a.next_run_at)}</p>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={e => { e.stopPropagation(); toggle(a.id, a.is_active); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                      a.is_active
                        ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                        : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                    }`}
                  >
                    {a.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {a.is_active ? "Pause" : "Activate"}
                  </button>

                  {expandedId === a.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>

                {/* Expanded detail */}
                {expandedId === a.id && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Description</p>
                        <p className="text-slate-600">{a.description || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Last Run</p>
                        <p className="text-slate-600">{formatDate(a.last_run_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Total Runs</p>
                        <p className="text-slate-600">{a.run_count} ({a.fail_count} failed)</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Created</p>
                        <p className="text-slate-600">{formatDate(a.created_at)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
