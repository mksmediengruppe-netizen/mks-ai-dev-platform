/* ============================================================
   BacklogPage — M8 AI CTO Layer
   Task backlog with status filters, create/edit tasks
   ============================================================ */

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ListTodo, Plus, RefreshCw, Clock, CheckCircle2,
  Circle, AlertCircle, Zap, Filter, Bot
} from "lucide-react";

import { API_BASE as API } from "../lib/api";

interface Task {
  id: number;
  epic_id: number | null;
  epic_title: string | null;
  title: string;
  description: string;
  task_type: string;
  status: string;
  priority: string;
  agent_type: string | null;
  risk_level: string;
  estimated_hours: number | null;
  definition_of_done: string | null;
  acceptance_criteria: string | null;
  created_at: string;
}

const STATUS_COLS = [
  { key: "backlog",     label: "Backlog",     color: "#94a3b8", bg: "#f8fafc" },
  { key: "in_progress", label: "In Progress", color: "#2563eb", bg: "#eff6ff" },
  { key: "review",      label: "Review",      color: "#d97706", bg: "#fffbeb" },
  { key: "completed",   label: "Done",        color: "#16a34a", bg: "#f0fdf4" },
];

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#dc2626", high: "#ea580c", medium: "#2563eb", low: "#64748b"
};

const RISK_COLOR: Record<string, string> = {
  critical: "#dc2626", high: "#ea580c", medium: "#d97706", low: "#16a34a"
};

export default function BacklogPage() {
  const { user } = useAuth();
  const token = user?.token || "";
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/cto/backlog`, { headers });
      if (!res.ok) throw new Error();
      setTasks(await res.json());
    } catch {
      toast.error("Failed to load backlog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const filtered = tasks.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const updateStatus = async (taskId: number, status: string) => {
    try {
      await fetch(`${API}/cto/task/${taskId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status })
      });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <ListTodo className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-slate-800 font-bold text-lg" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  Task Backlog
                </h1>
                <p className="text-slate-400 text-xs">M8 · AI CTO Layer · {tasks.length} tasks total</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchTasks} className="gap-1.5 text-xs">
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700">
                <Plus className="w-3 h-3" /> New Task
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-6xl mx-auto space-y-5">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              {["all", ...STATUS_COLS.map(s => s.key)].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    filterStatus === s ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {s === "all" ? `All (${tasks.length})` : `${STATUS_COLS.find(c => c.key === s)?.label} (${statusCounts[s] || 0})`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
              {["all", "critical", "high", "medium", "low"].map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    filterPriority === p ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {p === "all" ? "All Priority" : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Kanban-style columns */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {STATUS_COLS.map(col => {
                const colTasks = filtered.filter(t => t.status === col.key);
                return (
                  <div key={col.key} className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      <span className="text-xs font-semibold text-slate-600">{col.label}</span>
                      <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {colTasks.length}
                      </span>
                    </div>
                    {colTasks.length === 0 ? (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center">
                        <p className="text-slate-400 text-xs">No tasks</p>
                      </div>
                    ) : (
                      colTasks.map(task => (
                        <div key={task.id} className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-slate-700 text-xs font-semibold leading-tight line-clamp-2">{task.title}</p>
                            <span
                              className="flex-shrink-0 w-2 h-2 rounded-full mt-0.5"
                              style={{ background: PRIORITY_COLOR[task.priority] || "#64748b" }}
                              title={`Priority: ${task.priority}`}
                            />
                          </div>
                          {task.epic_title && (
                            <p className="text-violet-500 text-xs mb-1.5 truncate">↳ {task.epic_title}</p>
                          )}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {task.agent_type && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-500">
                                <Bot className="w-2.5 h-2.5" />{task.agent_type.replace("_agent", "")}
                              </span>
                            )}
                            {task.estimated_hours && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-500">
                                <Clock className="w-2.5 h-2.5" />{task.estimated_hours}h
                              </span>
                            )}
                            <span
                              className="px-1.5 py-0.5 rounded text-xs font-medium"
                              style={{ background: RISK_COLOR[task.risk_level] + "20", color: RISK_COLOR[task.risk_level] }}
                            >
                              {task.risk_level} risk
                            </span>
                          </div>
                          {/* Quick status change */}
                          <div className="mt-2.5 flex gap-1">
                            {STATUS_COLS.filter(s => s.key !== col.key).slice(0, 2).map(s => (
                              <button
                                key={s.key}
                                onClick={() => updateStatus(task.id, s.key)}
                                className="text-xs px-2 py-0.5 rounded border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
                              >
                                → {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateTaskModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchTasks(); }}
        />
      )}
    </AppLayout>
  );
}

function CreateTaskModal({ token, onClose, onCreated }: {
  token: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "", description: "", task_type: "feature", priority: "medium",
    agent_type: "", risk_level: "low", estimated_hours: "", definition_of_done: ""
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/cto/task`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null })
      });
      if (!res.ok) throw new Error();
      toast.success("Task created");
      onCreated();
    } catch {
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-slate-800 font-bold text-base">Create New Task</h2>
          <p className="text-slate-400 text-xs mt-0.5">Add a task to the CTO backlog</p>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Title *</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Implement Bitrix24 webhook handler"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))}>
                <option value="feature">Feature</option>
                <option value="bugfix">Bugfix</option>
                <option value="integration">Integration</option>
                <option value="migration">Migration</option>
                <option value="research">Research</option>
                <option value="ops">Ops</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Priority</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Risk Level</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.risk_level} onChange={e => setForm(f => ({ ...f, risk_level: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Est. Hours</label>
              <input type="number" min="0.5" step="0.5"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 4"
                value={form.estimated_hours}
                onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Agent Type</label>
            <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.agent_type} onChange={e => setForm(f => ({ ...f, agent_type: e.target.value }))}>
              <option value="">— None —</option>
              <option value="code_agent">Code Agent</option>
              <option value="qa_agent">QA Agent</option>
              <option value="deployment_agent">Deployment Agent</option>
              <option value="integration_agent">Integration Agent</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Definition of Done</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              placeholder="What does 'done' look like for this task?"
              value={form.definition_of_done}
              onChange={e => setForm(f => ({ ...f, definition_of_done: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1 text-sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1 text-sm bg-blue-600 hover:bg-blue-700">
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
