/* ============================================================
   ApprovalsPage — M8 AI CTO Layer
   Approval requests management
   ============================================================ */

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ClipboardCheck, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle, Plus } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "https://api.mksitdev.ru";

interface Approval {
  id: number;
  title: string;
  description: string;
  request_type: string;
  status: string;
  priority: string;
  requested_by: string;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  pending:  { label: "Pending",  color: "#d97706", bg: "#fffbeb", icon: Clock },
  approved: { label: "Approved", color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "#dc2626", bg: "#fef2f2", icon: XCircle },
  escalated:{ label: "Escalated",color: "#7c3aed", bg: "#f5f3ff", icon: AlertCircle },
};

const PRIORITY_COLOR: Record<string, { color: string; bg: string }> = {
  critical: { color: "#dc2626", bg: "#fef2f2" },
  high:     { color: "#ea580c", bg: "#fff7ed" },
  medium:   { color: "#2563eb", bg: "#eff6ff" },
  low:      { color: "#64748b", bg: "#f8fafc" },
};

export default function ApprovalsPage() {
  const { user } = useAuth();
  const token = user?.token || "";
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/approvals/list`, { headers });
      if (!res.ok) throw new Error();
      setApprovals(await res.json());
    } catch {
      toast.error("Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, []);

  const review = async (id: number, decision: "approved" | "rejected") => {
    try {
      await fetch(`${API}/approvals/${id}/review`, {
        method: "POST",
        headers,
        body: JSON.stringify({ decision, notes: reviewNotes })
      });
      toast.success(`Request ${decision}`);
      setReviewingId(null);
      setReviewNotes("");
      fetchApprovals();
    } catch {
      toast.error("Failed to submit review");
    }
  };

  const filtered = filterStatus === "all" ? approvals : approvals.filter(a => a.status === filterStatus);
  const pendingCount = approvals.filter(a => a.status === "pending").length;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
                <ClipboardCheck className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-slate-800 font-bold text-lg" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  Approvals
                </h1>
                <p className="text-slate-400 text-xs">
                  M8 · Approval Queue
                  {pendingCount > 0 && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs font-medium">{pendingCount} pending</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchApprovals} className="gap-1.5 text-xs">
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-3 h-3" /> New Request
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-4xl mx-auto space-y-5">
          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {["all", "pending", "approved", "rejected", "escalated"].map(s => {
              const count = s === "all" ? approvals.length : approvals.filter(a => a.status === s).length;
              const cfg = s !== "all" ? STATUS_CFG[s] : null;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    filterStatus === s
                      ? s === "all" ? "bg-slate-800 text-white border-transparent" : "border-transparent"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                  }`}
                  style={filterStatus === s && cfg ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color + "40" } : {}}
                >
                  {s === "all" ? `All (${count})` : `${STATUS_CFG[s].label} (${count})`}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
              <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No approval requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(approval => {
                const cfg = STATUS_CFG[approval.status] || STATUS_CFG.pending;
                const pCfg = PRIORITY_COLOR[approval.priority] || PRIORITY_COLOR.medium;
                const StatusIcon = cfg.icon;
                const isReviewing = reviewingId === approval.id;
                return (
                  <div key={approval.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-slate-800 font-semibold text-sm">{approval.title}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: cfg.bg, color: cfg.color }}>
                              <StatusIcon className="w-3 h-3 inline mr-1" />{cfg.label}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: pCfg.bg, color: pCfg.color }}>
                              {approval.priority}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">{approval.request_type}</span>
                          </div>
                          {approval.description && <p className="text-slate-500 text-xs mb-2">{approval.description}</p>}
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span>By: {approval.requested_by}</span>
                            <span>{new Date(approval.created_at).toLocaleDateString()}</span>
                            {approval.reviewed_by && <span>Reviewed by: {approval.reviewed_by}</span>}
                          </div>
                          {approval.review_notes && (
                            <p className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2">
                              <span className="font-medium">Review notes:</span> {approval.review_notes}
                            </p>
                          )}
                        </div>
                        {approval.status === "pending" && user?.role === "admin" && (
                          <button
                            onClick={() => setReviewingId(isReviewing ? null : approval.id)}
                            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                    {isReviewing && (
                      <div className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-3">
                        <textarea
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          rows={2}
                          placeholder="Review notes (optional)..."
                          value={reviewNotes}
                          onChange={e => setReviewNotes(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="gap-1.5 text-xs bg-green-600 hover:bg-green-700" onClick={() => review(approval.id, "approved")}>
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => review(approval.id, "rejected")}>
                            <XCircle className="w-3 h-3" /> Reject
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => { setReviewingId(null); setReviewNotes(""); }}>
                            Cancel
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

      {showCreate && (
        <CreateApprovalModal token={token} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchApprovals(); }} />
      )}
    </AppLayout>
  );
}

function CreateApprovalModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", request_type: "deployment", priority: "medium" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/approvals/create`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error();
      toast.success("Approval request created");
      onCreated();
    } catch {
      toast.error("Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-slate-800 font-bold text-base">New Approval Request</h2>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Title *</label>
            <input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Deploy M8 to production" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" rows={2}
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.request_type} onChange={e => setForm(f => ({ ...f, request_type: e.target.value }))}>
                <option value="deployment">Deployment</option>
                <option value="budget">Budget</option>
                <option value="architecture">Architecture</option>
                <option value="access">Access</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Priority</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1 text-sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1 text-sm bg-indigo-600 hover:bg-indigo-700">
              {loading ? "Creating..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
