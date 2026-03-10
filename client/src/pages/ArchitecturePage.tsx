/* ============================================================
   ArchitecturePage — M8 AI CTO Layer
   Architecture Decision Records (ADRs)
   ============================================================ */

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Cpu, Plus, RefreshCw, ChevronDown, ChevronRight, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

import { API_BASE as API } from "../lib/api";

interface ADR {
  id: number;
  title: string;
  context: string;
  decision: string;
  consequences: string;
  status: string;
  category: string;
  risk_level: string;
  created_at: string;
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  proposed:   { label: "Proposed",   color: "#d97706", bg: "#fffbeb", icon: Clock },
  accepted:   { label: "Accepted",   color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle2 },
  deprecated: { label: "Deprecated", color: "#94a3b8", bg: "#f8fafc", icon: XCircle },
  superseded: { label: "Superseded", color: "#7c3aed", bg: "#f5f3ff", icon: AlertCircle },
};

const RISK_COLOR: Record<string, string> = {
  critical: "#dc2626", high: "#ea580c", medium: "#d97706", low: "#16a34a"
};

export default function ArchitecturePage() {
  const { user } = useAuth();
  const token = user?.token || "";
  const [adrs, setAdrs] = useState<ADR[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchAdrs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/arch/decisions`, { headers });
      if (!res.ok) throw new Error();
      setAdrs(await res.json());
    } catch {
      toast.error("Failed to load architecture decisions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdrs(); }, []);

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Cpu className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-slate-800 font-bold text-lg" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  Architecture Decisions
                </h1>
                <p className="text-slate-400 text-xs">M8 · ADR Log · {adrs.length} decisions recorded</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchAdrs} className="gap-1.5 text-xs">
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-3 h-3" /> New ADR
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-4xl mx-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : adrs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
              <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No architecture decisions yet</p>
              <Button size="sm" className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreate(true)}>
                <Plus className="w-3 h-3 mr-1.5" /> Record First ADR
              </Button>
            </div>
          ) : (
            adrs.map(adr => {
              const cfg = STATUS_CFG[adr.status] || STATUS_CFG.proposed;
              const StatusIcon = cfg.icon;
              const isOpen = expanded === adr.id;
              return (
                <div key={adr.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => setExpanded(isOpen ? null : adr.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-slate-800 font-semibold text-sm">{adr.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: cfg.bg, color: cfg.color }}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />{cfg.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{adr.category}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: RISK_COLOR[adr.risk_level] + "20", color: RISK_COLOR[adr.risk_level] }}>
                          {adr.risk_level} risk
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs line-clamp-2">{adr.context}</p>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-slate-50 space-y-3 pt-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Context</p>
                        <p className="text-slate-700 text-sm">{adr.context}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Decision</p>
                        <p className="text-slate-700 text-sm">{adr.decision}</p>
                      </div>
                      {adr.consequences && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Consequences</p>
                          <p className="text-slate-700 text-sm">{adr.consequences}</p>
                        </div>
                      )}
                      <p className="text-slate-400 text-xs">Recorded: {new Date(adr.created_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {showCreate && (
        <CreateADRModal token={token} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchAdrs(); }} />
      )}
    </AppLayout>
  );
}

function CreateADRModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", context: "", decision: "", consequences: "", category: "infrastructure", risk_level: "medium" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.decision.trim()) { toast.error("Title and Decision are required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/arch/decisions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error();
      toast.success("ADR recorded");
      onCreated();
    } catch {
      toast.error("Failed to create ADR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-slate-800 font-bold text-base">Record Architecture Decision</h2>
          <p className="text-slate-400 text-xs mt-0.5">Document an ADR for future reference</p>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Title *</label>
            <input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Use PostgreSQL for persistent storage"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Context</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" rows={2}
              placeholder="What is the situation and why is this decision needed?"
              value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Decision *</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" rows={2}
              placeholder="What was decided?"
              value={form.decision} onChange={e => setForm(f => ({ ...f, decision: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Consequences</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" rows={2}
              placeholder="What are the trade-offs and implications?"
              value={form.consequences} onChange={e => setForm(f => ({ ...f, consequences: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="infrastructure">Infrastructure</option>
                <option value="security">Security</option>
                <option value="integration">Integration</option>
                <option value="data">Data</option>
                <option value="api">API</option>
                <option value="frontend">Frontend</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Risk Level</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.risk_level} onChange={e => setForm(f => ({ ...f, risk_level: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1 text-sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1 text-sm bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Saving..." : "Record ADR"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
