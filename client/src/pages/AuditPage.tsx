/* ============================================================
   AuditPage — M9 Audit Trail & Policy Rules
   Full audit log, policy rules, action history
   ============================================================ */

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Shield, RefreshCw, Search, Filter, Clock, User,
  CheckCircle2, XCircle, AlertTriangle, Info, ShieldCheck, ShieldAlert
} from "lucide-react";

import { API_BASE as API } from "../lib/api";

interface AuditEvent {
  id: number;
  event_type: string;
  actor_id: number | null;
  actor_name: string | null;
  resource_type: string | null;
  resource_id: number | null;
  action: string;
  outcome: string;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

interface PolicyRule {
  id: number;
  name: string;
  description: string;
  rule_type: string;
  target_resource: string;
  condition_json: any;
  action_on_trigger: string;
  is_active: boolean;
  severity: string;
  created_at: string;
}

const OUTCOME_STYLE: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  success: { color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 },
  failure: { color: "text-red-600 bg-red-50", icon: XCircle },
  blocked: { color: "text-amber-600 bg-amber-50", icon: AlertTriangle },
  warning: { color: "text-amber-600 bg-amber-50", icon: AlertTriangle },
  info: { color: "text-blue-600 bg-blue-50", icon: Info },
};

const SEVERITY_STYLE: Record<string, string> = {
  low: "text-slate-500 bg-slate-100",
  medium: "text-amber-600 bg-amber-50",
  high: "text-red-600 bg-red-50",
  critical: "text-red-800 bg-red-100",
};

function formatDate(d: string) {
  return new Date(d).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}

export default function AuditPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"audit" | "policy">("audit");
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const [aR, pR] = await Promise.all([
        fetch(`${API}/audit/events?limit=100`, { headers: { Authorization: `Bearer ${user?.token}` } }),
        fetch(`${API}/policy/rules`, { headers: { Authorization: `Bearer ${user?.token}` } }),
      ]);
      if (aR.ok) setEvents(await aR.json());
      if (pR.ok) setPolicies(await pR.json());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredEvents = events.filter(e => {
    const matchSearch = !search || 
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      (e.actor_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.resource_type || "").toLowerCase().includes(search.toLowerCase());
    const matchOutcome = outcomeFilter === "all" || e.outcome === outcomeFilter;
    return matchSearch && matchOutcome;
  });

  const outcomes = ["all", "success", "failure", "blocked", "warning", "info"];

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              Audit & Policy
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Full audit trail, policy rules, and action history</p>
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Events</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{events.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Success</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{events.filter(e => e.outcome === "success").length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Blocked/Warn</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {events.filter(e => e.outcome === "blocked" || e.outcome === "warning").length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Active Policies</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{policies.filter(p => p.is_active).length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-4">
          {(["audit", "policy"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "audit" ? "Audit Trail" : "Policy Rules"}
              <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                {t === "audit" ? events.length : policies.length}
              </span>
            </button>
          ))}
        </div>

        {/* Audit Tab */}
        {tab === "audit" && (
          <>
            {/* Filters */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter by action, actor, resource..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                {outcomes.map(o => (
                  <button
                    key={o}
                    onClick={() => setOutcomeFilter(o)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                      outcomeFilter === o
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Time</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Actor</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Action</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Resource</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400">No events found</td>
                      </tr>
                    ) : filteredEvents.map(e => {
                      const s = OUTCOME_STYLE[e.outcome] || OUTCOME_STYLE.info;
                      const OutcomeIcon = s.icon;
                      return (
                        <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatDate(e.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-600 text-xs">{e.actor_name || "system"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-700 font-medium text-xs">{e.action}</span>
                            {e.details && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{e.details}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {e.resource_type && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                                {e.resource_type}{e.resource_id ? ` #${e.resource_id}` : ""}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${s.color}`}>
                              <OutcomeIcon className="w-3 h-3" />
                              {e.outcome}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Policy Tab */}
        {tab === "policy" && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : policies.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No policy rules defined</p>
              </div>
            ) : policies.map(p => (
              <div key={p.id} className={`bg-white rounded-xl border p-4 ${p.is_active ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className={`w-4 h-4 ${p.is_active ? "text-emerald-500" : "text-slate-400"}`} />
                      <span className="text-sm font-semibold text-slate-800">{p.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${SEVERITY_STYLE[p.severity] || SEVERITY_STYLE.low}`}>
                        {p.severity}
                      </span>
                      {!p.is_active && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-400">inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{p.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{p.rule_type}</span>
                      <span>→</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{p.target_resource}</span>
                      <span>→</span>
                      <span className={`px-2 py-0.5 rounded font-medium ${
                        p.action_on_trigger === "block" ? "bg-red-50 text-red-600" :
                        p.action_on_trigger === "warn" ? "bg-amber-50 text-amber-600" :
                        "bg-blue-50 text-blue-600"
                      }`}>{p.action_on_trigger}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
