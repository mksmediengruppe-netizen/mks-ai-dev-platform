/* ============================================================
   ReleasesPage — M8 AI CTO Layer
   Release management and changelog
   ============================================================ */

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Rocket, Plus, RefreshCw, ChevronDown, ChevronRight, CheckCircle2, Clock, AlertCircle, Package } from "lucide-react";

import { API_BASE as API } from "../lib/api";

interface Release {
  id: number;
  version: string;
  title: string;
  description: string;
  status: string;
  release_type: string;
  features_count: number;
  bugfixes_count: number;
  breaking_changes: boolean;
  planned_date: string | null;
  released_at: string | null;
  created_at: string;
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  planning:  { label: "Planning",  color: "#7c3aed", bg: "#f5f3ff", icon: Clock },
  staging:   { label: "Staging",   color: "#d97706", bg: "#fffbeb", icon: AlertCircle },
  released:  { label: "Released",  color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle2 },
  rolled_back: { label: "Rolled Back", color: "#dc2626", bg: "#fef2f2", icon: AlertCircle },
};

const TYPE_COLOR: Record<string, { color: string; bg: string }> = {
  major: { color: "#dc2626", bg: "#fef2f2" },
  minor: { color: "#2563eb", bg: "#eff6ff" },
  patch: { color: "#16a34a", bg: "#f0fdf4" },
  hotfix: { color: "#ea580c", bg: "#fff7ed" },
};

export default function ReleasesPage() {
  const { user } = useAuth();
  const token = user?.token || "";
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchReleases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/release/list`, { headers });
      if (!res.ok) throw new Error();
      setReleases(await res.json());
    } catch {
      toast.error("Failed to load releases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReleases(); }, []);

  const promote = async (id: number, stage: string) => {
    try {
      await fetch(`${API}/release/${id}/promote`, {
        method: "POST",
        headers,
        body: JSON.stringify({ stage })
      });
      toast.success(`Release promoted to ${stage}`);
      fetchReleases();
    } catch {
      toast.error("Failed to promote release");
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
                <Rocket className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-slate-800 font-bold text-lg" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  Releases
                </h1>
                <p className="text-slate-400 text-xs">M8 · Release Management · {releases.length} releases</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchReleases} className="gap-1.5 text-xs">
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 text-xs bg-orange-500 hover:bg-orange-600">
                <Plus className="w-3 h-3" /> New Release
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-4xl mx-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : releases.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
              <Rocket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No releases yet</p>
              <Button size="sm" className="mt-4 bg-orange-500 hover:bg-orange-600" onClick={() => setShowCreate(true)}>
                <Plus className="w-3 h-3 mr-1.5" /> Plan First Release
              </Button>
            </div>
          ) : (
            releases.map(rel => {
              const cfg = STATUS_CFG[rel.status] || STATUS_CFG.planning;
              const typeCfg = TYPE_COLOR[rel.release_type] || TYPE_COLOR.minor;
              const StatusIcon = cfg.icon;
              const isOpen = expanded === rel.id;
              return (
                <div key={rel.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => setExpanded(isOpen ? null : rel.id)}>
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-slate-800 font-bold text-sm font-mono">{rel.version}</span>
                        <span className="text-slate-600 text-sm">{rel.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: cfg.bg, color: cfg.color }}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />{cfg.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: typeCfg.bg, color: typeCfg.color }}>
                          {rel.release_type}
                        </span>
                        {rel.breaking_changes && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">⚠ Breaking</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{rel.features_count} features</span>
                        <span>{rel.bugfixes_count} bugfixes</span>
                        {rel.planned_date && <span>Planned: {new Date(rel.planned_date).toLocaleDateString()}</span>}
                        {rel.released_at && <span>Released: {new Date(rel.released_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-3">
                      {rel.description && <p className="text-slate-600 text-sm">{rel.description}</p>}
                      {rel.status !== "released" && (
                        <div className="flex gap-2">
                          {rel.status === "planning" && (
                            <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => promote(rel.id, "staging")}>
                              <Rocket className="w-3 h-3" /> Promote to Staging
                            </Button>
                          )}
                          {rel.status === "staging" && (
                            <Button size="sm" className="text-xs gap-1.5 bg-green-600 hover:bg-green-700" onClick={() => promote(rel.id, "released")}>
                              <CheckCircle2 className="w-3 h-3" /> Mark as Released
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {showCreate && (
        <CreateReleaseModal token={token} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchReleases(); }} />
      )}
    </AppLayout>
  );
}

function CreateReleaseModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ version: "", title: "", description: "", release_type: "minor", planned_date: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.version.trim() || !form.title.trim()) { toast.error("Version and Title are required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/release/create`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, planned_date: form.planned_date || null })
      });
      if (!res.ok) throw new Error();
      toast.success("Release created");
      onCreated();
    } catch {
      toast.error("Failed to create release");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-slate-800 font-bold text-base">Plan New Release</h2>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Version *</label>
              <input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                placeholder="v1.2.0" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={form.release_type} onChange={e => setForm(f => ({ ...f, release_type: e.target.value }))}>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="patch">Patch</option>
                <option value="hotfix">Hotfix</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Title *</label>
            <input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g. Bitrix24 Integration Release" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" rows={2}
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Planned Date</label>
            <input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={form.planned_date} onChange={e => setForm(f => ({ ...f, planned_date: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1 text-sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1 text-sm bg-orange-500 hover:bg-orange-600">
              {loading ? "Creating..." : "Create Release"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
