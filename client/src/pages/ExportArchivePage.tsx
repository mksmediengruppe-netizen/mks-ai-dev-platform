/* ============================================================
   ExportArchivePage — M9 Export / Import / Archive
   Export project data, import projects, archive completed ones
   ============================================================ */

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Download, Upload, Archive, RefreshCw, CheckCircle2, Clock,
  FileJson, Package, Briefcase, AlertTriangle, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

const API = import.meta.env.VITE_API_URL || "https://api.mksitdev.ru";

interface ExportRecord {
  id: number;
  project_id: number | null;
  project_name: string | null;
  export_type: string;
  format: string;
  status: string;
  file_size_kb: number | null;
  artifact_path: string | null;
  requested_by: string;
  created_at: string;
  completed_at: string | null;
}

interface Project {
  id: number;
  name: string;
  status: string;
}

const STATUS_STYLE: Record<string, string> = {
  completed: "text-emerald-600 bg-emerald-50 border-emerald-200",
  failed: "text-red-600 bg-red-50 border-red-200",
  running: "text-blue-600 bg-blue-50 border-blue-200",
  pending: "text-slate-500 bg-slate-100 border-slate-200",
};

const EXPORT_TYPES = [
  { value: "full_export", label: "Full Export", desc: "All project data including tasks, decisions, memory" },
  { value: "knowledge_export", label: "Knowledge Export", desc: "Decisions, architecture, templates only" },
  { value: "tasks_export", label: "Tasks Export", desc: "Backlog, epics, and task history" },
  { value: "archive", label: "Archive Project", desc: "Mark project as archived and export final state" },
];

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatSize(kb: number | null) {
  if (!kb) return "—";
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function ExportArchivePage() {
  const { user } = useAuth();
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [exportType, setExportType] = useState("full_export");
  const [exporting, setExporting] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [exR, prR] = await Promise.all([
        fetch(`${API}/export/records`, { headers: { Authorization: `Bearer ${user?.token}` } }),
        fetch(`${API}/portfolio/projects`, { headers: { Authorization: `Bearer ${user?.token}` } }),
      ]);
      if (exR.ok) setExports(await exR.json());
      if (prR.ok) {
        const prData = await prR.json();
        setProjects(prData.projects || prData);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const triggerExport = async () => {
    setExporting(true);
    try {
      const body: Record<string, any> = { export_type: exportType };
      if (selectedProject) body.project_id = Number(selectedProject);
      const r = await fetch(`${API}/export/trigger`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Export failed to start");
      toast.success("Export triggered successfully");
      setShowExport(false);
      setTimeout(load, 1500);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  };

  const completed = exports.filter(e => e.status === "completed").length;
  const totalSize = exports.reduce((sum, e) => sum + (e.file_size_kb || 0), 0);

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              Export / Import / Archive
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Export project data, archive completed projects, transfer knowledge</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Button onClick={() => setShowExport(!showExport)} className="flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" />
              New Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Exports</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{exports.length}</p>
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
              <FileJson className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Size</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{formatSize(totalSize)}</p>
          </div>
        </div>

        {/* Export Form */}
        {showExport && (
          <div className="bg-white border border-blue-200 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">New Export</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">Project (optional)</label>
                <select
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Projects</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">Export Type</label>
                <select
                  value={exportType}
                  onChange={e => setExportType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {EXPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            {/* Description of selected type */}
            <div className="p-3 bg-blue-50 rounded-lg mb-4">
              <p className="text-xs text-blue-700">
                {EXPORT_TYPES.find(t => t.value === exportType)?.desc}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowExport(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <Button onClick={triggerExport} disabled={exporting} className="text-sm">
                {exporting ? "Exporting..." : "Start Export"}
              </Button>
            </div>
          </div>
        )}

        {/* Import Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Import functionality</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Project import is available via the API endpoint <code className="bg-amber-100 px-1 rounded">POST /import/project</code>.
              Upload a previously exported JSON package to restore a project's knowledge base and artifacts.
            </p>
          </div>
        </div>

        {/* Export Records */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exports.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Archive className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No exports yet</p>
            <p className="text-sm mt-1">Create your first export to archive or transfer project data</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Export History</h3>
            {exports.map(ex => (
              <div key={ex.id} className="bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    ex.export_type === "archive" ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-500"
                  }`}>
                    {ex.export_type === "archive" ? <Archive className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-slate-800">
                        {EXPORT_TYPES.find(t => t.value === ex.export_type)?.label || ex.export_type}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${STATUS_STYLE[ex.status] || STATUS_STYLE.pending}`}>
                        {ex.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {ex.project_name && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {ex.project_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(ex.created_at)}
                      </span>
                      {ex.file_size_kb && (
                        <span className="flex items-center gap-1">
                          <FileJson className="w-3 h-3" />
                          {formatSize(ex.file_size_kb)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-slate-400">Format</p>
                    <p className="text-xs font-medium text-slate-600 uppercase">{ex.format}</p>
                  </div>
                  {expandedId === ex.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
                {expandedId === ex.id && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Requested By</p>
                        <p className="text-slate-600">{ex.requested_by}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Completed</p>
                        <p className="text-slate-600">{formatDate(ex.completed_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">File Size</p>
                        <p className="text-slate-600">{formatSize(ex.file_size_kb)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Artifact Path</p>
                        <p className="text-slate-600 text-xs truncate">{ex.artifact_path || "—"}</p>
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
