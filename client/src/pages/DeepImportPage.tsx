/**
 * DeepImportPage — M10 Deep Project Import / Clone
 * Design: Step-by-step wizard style, file upload, bundle list
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API = import.meta.env.VITE_API_URL || "https://api.mksitdev.ru";

interface ImportBundle {
  id: number;
  source_project_id: number | null;
  source_project_name: string | null;
  bundle_name: string;
  bundle_version: string;
  status: string;
  artifact_count: number;
  created_by_email: string | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

interface Project {
  id: number;
  name: string;
  status: string;
}

const statusColors: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-700",
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-700",
  imported: "bg-slate-100 text-slate-600",
};

export default function DeepImportPage() {
  const { user } = useAuth();
  const [bundles, setBundles] = useState<ImportBundle[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"bundles" | "export" | "clone">("bundles");
  const [exportProjectId, setExportProjectId] = useState<number | null>(null);
  const [cloneProjectId, setCloneProjectId] = useState<number | null>(null);
  const [cloneName, setCloneName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const headers = { Authorization: `Bearer ${(user as any)?.access_token || (user as any)?.token || ""}` };
  const jsonHeaders = { ...headers, "Content-Type": "application/json" };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      const [bundlesRes, projectsRes] = await Promise.all([
        fetch(`${API}/projects/import-bundles`, { headers }),
        fetch(`${API}/projects`, { headers }),
      ]);
      if (bundlesRes.ok) setBundles(await bundlesRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    if (!exportProjectId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/projects/${exportProjectId}/export`, {
        method: "POST", headers: jsonHeaders,
        body: JSON.stringify({ include_conversations: true, include_memories: true, include_decisions: true })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Export bundle created: ${data.bundle_name || "bundle"}`);
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Export failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClone = async () => {
    if (!cloneProjectId || !cloneName.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/projects/${cloneProjectId}/clone`, {
        method: "POST", headers: jsonHeaders,
        body: JSON.stringify({ new_name: cloneName.trim() })
      });
      if (res.ok) {
        showToast(`Project cloned as "${cloneName}"`);
        setCloneName("");
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Clone failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async (projectId: number, projectName: string) => {
    if (!confirm(`Archive project "${projectName}"? It will be marked as archived.`)) return;
    try {
      const res = await fetch(`${API}/projects/${projectId}/archive`, {
        method: "POST", headers: jsonHeaders,
        body: JSON.stringify({ reason: "Archived via UI" })
      });
      if (res.ok) {
        showToast(`Project "${projectName}" archived`);
        load();
      } else {
        showToast("Archive failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm text-white ${
          toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Deep Import & Clone</h1>
        <p className="text-slate-500 text-sm mt-1">Export, import, clone, and archive projects with full artifact transfer</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
        {(["bundles", "export", "clone"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "bundles" ? "Import Bundles" : t === "export" ? "Export Project" : "Clone / Archive"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">Loading...</div>
      ) : tab === "bundles" ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Bundle</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Source Project</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Artifacts</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bundles.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">No bundles yet — export a project to create one</td></tr>
              ) : bundles.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{b.bundle_name}</div>
                    <div className="text-xs text-slate-400">v{b.bundle_version}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{b.source_project_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[b.status] || "bg-slate-100 text-slate-600"}`}>
                      {b.status}
                    </span>
                    {b.error_message && (
                      <div className="text-xs text-red-500 mt-0.5 truncate max-w-xs">{b.error_message}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-slate-600">{b.artifact_count}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500 font-mono">
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === "export" ? (
        <div className="max-w-lg">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-slate-800 mb-1">Export Project</h3>
            <p className="text-sm text-slate-500 mb-4">
              Creates a full export bundle including tasks, memories, decisions, conversations, and artifacts.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Project</label>
              <select
                value={exportProjectId || ""}
                onChange={e => setExportProjectId(Number(e.target.value) || null)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Choose a project —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleExport}
              disabled={!exportProjectId || actionLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading ? "Exporting..." : "Export Project"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          {/* Clone */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-slate-800 mb-1">Clone Project</h3>
            <p className="text-sm text-slate-500 mb-4">Create a copy of an existing project as a new baseline.</p>
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Source Project</label>
              <select
                value={cloneProjectId || ""}
                onChange={e => setCloneProjectId(Number(e.target.value) || null)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Choose source —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">New Project Name</label>
              <input
                type="text"
                value={cloneName}
                onChange={e => setCloneName(e.target.value)}
                placeholder="My Project Clone"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleClone}
              disabled={!cloneProjectId || !cloneName.trim() || actionLoading}
              className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading ? "Cloning..." : "Clone Project"}
            </button>
          </div>

          {/* Archive */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-slate-800 mb-1">Archive Project</h3>
            <p className="text-sm text-slate-500 mb-4">Mark completed projects as archived to keep the portfolio clean.</p>
            <div className="space-y-2">
              {projects.filter(p => p.status !== "archived").length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-sm">No active projects to archive</div>
              ) : projects.filter(p => p.status !== "archived").map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                  <span className="text-sm text-slate-700">{p.name}</span>
                  <button
                    onClick={() => handleArchive(p.id, p.name)}
                    className="text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Archive
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
