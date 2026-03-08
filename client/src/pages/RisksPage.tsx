/* ============================================================
   RisksPage — M8 AI CTO Layer
   Risk log and cost notes combined view
   ============================================================ */

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldAlert, DollarSign, RefreshCw, Plus, AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "https://api.mksitdev.ru";

interface Risk {
  id: number;
  title: string;
  description: string;
  category: string;
  probability: string;
  impact: string;
  risk_score: number;
  status: string;
  mitigation: string | null;
  created_at: string;
}

interface CostNote {
  id: number;
  category: string;
  description: string;
  amount_usd: number;
  period: string;
  is_recurring: boolean;
  created_at: string;
}

const RISK_LEVEL = (score: number) => {
  if (score >= 9) return { label: "Critical", color: "#dc2626", bg: "#fef2f2" };
  if (score >= 6) return { label: "High",     color: "#ea580c", bg: "#fff7ed" };
  if (score >= 3) return { label: "Medium",   color: "#d97706", bg: "#fffbeb" };
  return                 { label: "Low",      color: "#16a34a", bg: "#f0fdf4" };
};

export default function RisksPage() {
  const { user } = useAuth();
  const token = user?.token || "";
  const [risks, setRisks] = useState<Risk[]>([]);
  const [costs, setCosts] = useState<CostNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"risks" | "costs">("risks");
  const [showCreateRisk, setShowCreateRisk] = useState(false);
  const [showCreateCost, setShowCreateCost] = useState(false);

  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rRes, cRes] = await Promise.all([
        fetch(`${API}/risks/summary`, { headers }),
        fetch(`${API}/costs/summary`, { headers })
      ]);
      if (rRes.ok) setRisks(await rRes.json());
      if (cRes.ok) setCosts(await cRes.json());
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const totalMonthlyCost = costs.filter(c => c.is_recurring).reduce((s, c) => s + c.amount_usd, 0);
  const totalOnceCost = costs.filter(c => !c.is_recurring).reduce((s, c) => s + c.amount_usd, 0);
  const criticalRisks = risks.filter(r => r.risk_score >= 9).length;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500 flex items-center justify-center">
                <ShieldAlert className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-slate-800 font-bold text-lg" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  Risks & Costs
                </h1>
                <p className="text-slate-400 text-xs">M8 · Risk Register + Cost Tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchAll} className="gap-1.5 text-xs">
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
              {tab === "risks" ? (
                <Button size="sm" onClick={() => setShowCreateRisk(true)} className="gap-1.5 text-xs bg-red-500 hover:bg-red-600">
                  <Plus className="w-3 h-3" /> Add Risk
                </Button>
              ) : (
                <Button size="sm" onClick={() => setShowCreateCost(true)} className="gap-1.5 text-xs bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-3 h-3" /> Add Cost
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 max-w-5xl mx-auto space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <p className="text-slate-400 text-xs mb-1">Total Risks</p>
              <p className="text-slate-800 font-bold text-2xl">{risks.length}</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-100 p-4 shadow-sm">
              <p className="text-red-400 text-xs mb-1">Critical Risks</p>
              <p className="text-red-600 font-bold text-2xl">{criticalRisks}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <p className="text-slate-400 text-xs mb-1">Monthly Cost</p>
              <p className="text-teal-600 font-bold text-2xl">${totalMonthlyCost.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <p className="text-slate-400 text-xs mb-1">One-time Cost</p>
              <p className="text-slate-800 font-bold text-2xl">${totalOnceCost.toFixed(0)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setTab("risks")}
              className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${tab === "risks" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <AlertTriangle className="w-3 h-3 inline mr-1.5" />Risk Log ({risks.length})
            </button>
            <button
              onClick={() => setTab("costs")}
              className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${tab === "costs" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <DollarSign className="w-3 h-3 inline mr-1" />Cost Notes ({costs.length})
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tab === "risks" ? (
            <div className="space-y-2">
              {risks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                  <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No risks recorded</p>
                </div>
              ) : (
                risks.sort((a, b) => b.risk_score - a.risk_score).map(risk => {
                  const lvl = RISK_LEVEL(risk.risk_score);
                  return (
                    <div key={risk.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm" style={{ background: lvl.bg, color: lvl.color }}>
                          {risk.risk_score}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-slate-800 font-semibold text-sm">{risk.title}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: lvl.bg, color: lvl.color }}>{lvl.label}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">{risk.category}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500">P:{risk.probability} × I:{risk.impact}</span>
                          </div>
                          {risk.description && <p className="text-slate-500 text-xs mb-1">{risk.description}</p>}
                          {risk.mitigation && (
                            <p className="text-green-600 text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Mitigation: {risk.mitigation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {costs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                  <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No cost notes recorded</p>
                </div>
              ) : (
                costs.sort((a, b) => b.amount_usd - a.amount_usd).map(cost => (
                  <div key={cost.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                      {cost.is_recurring ? <TrendingUp className="w-5 h-5 text-teal-600" /> : <DollarSign className="w-5 h-5 text-teal-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-slate-800 font-semibold text-sm">{cost.description}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">{cost.category}</span>
                        {cost.is_recurring && <span className="px-2 py-0.5 rounded-full text-xs bg-teal-50 text-teal-600">Recurring</span>}
                      </div>
                      <p className="text-slate-400 text-xs">{cost.period}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-teal-600 font-bold text-base">${cost.amount_usd.toFixed(2)}</p>
                      <p className="text-slate-400 text-xs">{cost.is_recurring ? "/mo" : "once"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showCreateRisk && (
        <CreateRiskModal token={token} onClose={() => setShowCreateRisk(false)} onCreated={() => { setShowCreateRisk(false); fetchAll(); }} />
      )}
      {showCreateCost && (
        <CreateCostModal token={token} onClose={() => setShowCreateCost(false)} onCreated={() => { setShowCreateCost(false); fetchAll(); }} />
      )}
    </AppLayout>
  );
}

function CreateRiskModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", category: "technical", probability: "medium", impact: "medium", mitigation: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/risks/add`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error();
      toast.success("Risk recorded");
      onCreated();
    } catch {
      toast.error("Failed to add risk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-slate-800 font-bold text-base">Add Risk</h2>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Title *</label>
            <input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="e.g. API rate limit exceeded" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" rows={2}
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="technical">Technical</option>
                <option value="security">Security</option>
                <option value="business">Business</option>
                <option value="operational">Operational</option>
                <option value="financial">Financial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Probability</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Impact</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Mitigation Plan</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" rows={2}
              placeholder="How will this risk be mitigated?" value={form.mitigation} onChange={e => setForm(f => ({ ...f, mitigation: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1 text-sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1 text-sm bg-red-500 hover:bg-red-600">
              {loading ? "Saving..." : "Add Risk"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateCostModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ description: "", category: "infrastructure", amount_usd: "", period: "monthly", is_recurring: true });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount_usd) { toast.error("Description and amount are required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/costs/add`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount_usd: parseFloat(form.amount_usd) })
      });
      if (!res.ok) throw new Error();
      toast.success("Cost note added");
      onCreated();
    } catch {
      toast.error("Failed to add cost");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-slate-800 font-bold text-base">Add Cost Note</h2>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description *</label>
            <input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g. OpenAI API usage" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="infrastructure">Infrastructure</option>
                <option value="api">API</option>
                <option value="tooling">Tooling</option>
                <option value="personnel">Personnel</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Amount (USD) *</label>
              <input type="number" min="0" step="0.01" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="49.99" value={form.amount_usd} onChange={e => setForm(f => ({ ...f, amount_usd: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Period</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_recurring} onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-xs font-medium text-slate-600">Recurring</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1 text-sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1 text-sm bg-teal-600 hover:bg-teal-700">
              {loading ? "Saving..." : "Add Cost"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
