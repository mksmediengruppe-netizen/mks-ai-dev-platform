/* ============================================================
   RoadmapPage — M8 AI CTO Layer
   Epics roadmap with status tracking and task counts
   ============================================================ */

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Map, Plus, RefreshCw, ChevronDown, ChevronRight,
  CheckCircle2, Clock, Circle, AlertCircle, Zap
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "https://api.mksitdev.ru";

interface Epic {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  milestone: string;
  task_count: number;
  completed_count: number;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  backlog:     { label: "Backlog",     color: "#94a3b8", bg: "#f8fafc", icon: Circle },
  in_progress: { label: "In Progress", color: "#2563eb", bg: "#eff6ff", icon: Clock },
  review:      { label: "Review",      color: "#d97706", bg: "#fffbeb", icon: AlertCircle },
  completed:   { label: "Completed",   color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle2 },
  cancelled:   { label: "Cancelled",   color: "#dc2626", bg: "#fef2f2", icon: AlertCircle },
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  critical: { color: "#dc2626", bg: "#fef2f2" },
  high:     { color: "#ea580c", bg: "#fff7ed" },
  medium:   { color: "#2563eb", bg: "#eff6ff" },
  low:      { color: "#64748b", bg: "#f8fafc" },
};

export default function RoadmapPage() {
  const { user } = useAuth();
  const token = user?.token || "";
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedEpic, setExpandedEpic] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchEpics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/cto/epics`, { headers });
      if (!res.ok) throw new Error("Failed to fetch epics");
      const data = await res.json();
      setEpics(data);
    } catch (e) {
      toast.error("Failed to load roadmap");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEpics(); }, []);

  const filteredEpics = filterStatus === "all"
    ? epics
    : epics.filter(e => e.status === filterStatus);

  const statusCounts = epics.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center">
                <Map className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-slate-800 font-bold text-lg" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  Product Roadmap
                </h1>
                <p className="text-slate-400 text-xs">M8 · AI CTO Layer · Epic planning</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchEpics} className="gap-1.5 text-xs">
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
              <Button size="sm" onClick={() => setShowCreateModal(true)} className="gap-1.5 text-xs bg-violet-600 hover:bg-violet-700">
                <Plus className="w-3 h-3" /> New Epic
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-5xl mx-auto space-y-6">
          {/* Status filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatus === "all"
                  ? "bg-slate-800 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              All Epics ({epics.length})
            </button>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = statusCounts[key] || 0;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    filterStatus === key ? "border-transparent" : "border-slate-200 hover:border-slate-300"
                  }`}
                  style={filterStatus === key ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color + "40" } : {}}
                >
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Epics list */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredEpics.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
              <Map className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No epics found</p>
              <p className="text-slate-400 text-sm mt-1">Create your first epic to start planning</p>
              <Button size="sm" className="mt-4 bg-violet-600 hover:bg-violet-700" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-3 h-3 mr-1.5" /> Create Epic
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEpics.map(epic => {
                const statusCfg = STATUS_CONFIG[epic.status] || STATUS_CONFIG.backlog;
                const priorityCfg = PRIORITY_CONFIG[epic.priority] || PRIORITY_CONFIG.medium;
                const progress = epic.task_count > 0
                  ? Math.round((epic.completed_count / epic.task_count) * 100)
                  : 0;
                const isExpanded = expandedEpic === epic.id;
                const StatusIcon = statusCfg.icon;

                return (
                  <div key={epic.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <button
                      className="w-full text-left p-4 flex items-start gap-4"
                      onClick={() => setExpandedEpic(isExpanded ? null : epic.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-slate-800 font-semibold text-sm truncate">{epic.title}</span>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: statusCfg.bg, color: statusCfg.color }}
                          >
                            <StatusIcon className="w-3 h-3 inline mr-1" />
                            {statusCfg.label}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: priorityCfg.bg, color: priorityCfg.color }}
                          >
                            {epic.priority}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600">
                            {epic.milestone}
                          </span>
                        </div>
                        {epic.description && (
                          <p className="text-slate-500 text-xs line-clamp-2">{epic.description}</p>
                        )}
                        {/* Progress bar */}
                        {epic.task_count > 0 && (
                          <div className="mt-2.5 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${progress}%`,
                                  background: progress === 100 ? "#16a34a" : "#2563eb"
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 flex-shrink-0">
                              {epic.completed_count}/{epic.task_count} tasks · {progress}%
                            </span>
                          </div>
                        )}
                        {epic.task_count === 0 && (
                          <p className="text-slate-400 text-xs mt-1.5">No tasks yet</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-slate-400 mt-0.5">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-50">
                        <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-slate-50 rounded-lg p-2.5">
                            <p className="text-slate-400 mb-0.5">Total Tasks</p>
                            <p className="text-slate-700 font-bold text-base">{epic.task_count}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2.5">
                            <p className="text-slate-400 mb-0.5">Completed</p>
                            <p className="text-green-600 font-bold text-base">{epic.completed_count}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2.5">
                            <p className="text-slate-400 mb-0.5">Progress</p>
                            <p className="text-blue-600 font-bold text-base">{progress}%</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2.5">
                            <p className="text-slate-400 mb-0.5">Milestone</p>
                            <p className="text-violet-600 font-bold text-base">{epic.milestone}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1.5"
                            onClick={() => window.location.href = `/backlog?epic=${epic.id}`}
                          >
                            <Zap className="w-3 h-3" /> View Tasks
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Epic Modal */}
      {showCreateModal && (
        <CreateEpicModal
          token={token!}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchEpics(); }}
        />
      )}
    </AppLayout>
  );
}

function CreateEpicModal({ token, onClose, onCreated }: {
  token: string | undefined;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", milestone: "M8" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/cto/epics`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token || ""}`, "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Failed to create epic");
      toast.success("Epic created");
      onCreated();
    } catch (e) {
      toast.error("Failed to create epic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-slate-800 font-bold text-base">Create New Epic</h2>
          <p className="text-slate-400 text-xs mt-0.5">Add a high-level product initiative to the roadmap</p>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Title *</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="e.g. Bitrix24 CRM Integration"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="What does this epic achieve?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Priority</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Milestone</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={form.milestone}
                onChange={e => setForm(f => ({ ...f, milestone: e.target.value }))}
              >
                <option value="M8">M8</option>
                <option value="M9">M9</option>
                <option value="M10">M10</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1 text-sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1 text-sm bg-violet-600 hover:bg-violet-700">
              {loading ? "Creating..." : "Create Epic"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
