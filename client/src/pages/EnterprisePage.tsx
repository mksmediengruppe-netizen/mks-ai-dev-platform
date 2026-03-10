/**
 * EnterprisePage — M10 Enterprise Readiness
 * Design: Professional dashboard, compliance metrics, SLA reporting
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { API_BASE as API } from "../lib/api";

interface SLAReport {
  period: string;
  automation_sla: {
    total_runs: number;
    successful: number;
    failed: number;
    success_rate_pct: number;
  };
  approval_compliance: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  };
  audit_events_logged: number;
  open_policy_violations: number;
  compliance_score: number;
}

interface AccessBoundaries {
  user_role_distribution: { role: string; count: number }[];
  active_policy_rules: number;
  sso_enabled: boolean;
  mfa_enabled: boolean;
  audit_logging: boolean;
  data_isolation: string;
  enterprise_readiness_score: number;
}

interface Digest {
  digest_type: string;
  period_start: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  escalations_created: number;
  health_score_avg: number;
  top_issues: string | string[];
  recommendations: string | string[];
  owner_summary: string;
  operator_summary: string;
  created_at: string;
}

function parseJSON(val: string | string[] | null): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return [String(val)]; }
}

export default function EnterprisePage() {
  const { user } = useAuth();
  const [sla, setSla] = useState<SLAReport | null>(null);
  const [access, setAccess] = useState<AccessBoundaries | null>(null);
  const [dailyDigest, setDailyDigest] = useState<Digest | null>(null);
  const [weeklyDigest, setWeeklyDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"sla" | "access" | "digest">("sla");

  const headers = { Authorization: `Bearer ${(user as any)?.access_token || (user as any)?.token || ""}` };

  const load = useCallback(async () => {
    try {
      const [slaRes, accessRes, dailyRes, weeklyRes] = await Promise.all([
        fetch(`${API}/enterprise/sla-report`, { headers }),
        fetch(`${API}/enterprise/access-boundaries`, { headers }),
        fetch(`${API}/summaries/digest?digest_type=daily`, { headers }),
        fetch(`${API}/summaries/digest?digest_type=weekly`, { headers }),
      ]);
      if (slaRes.ok) setSla(await slaRes.json());
      if (accessRes.ok) setAccess(await accessRes.json());
      if (dailyRes.ok) setDailyDigest(await dailyRes.json());
      if (weeklyRes.ok) setWeeklyDigest(await weeklyRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const scoreColor = (score: number) =>
    score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600";

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Enterprise</h1>
        <p className="text-slate-500 text-sm mt-1">SLA compliance, access control, and operational digests</p>
      </div>

      {/* Summary */}
      {sla && access && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Compliance Score", value: `${access.enterprise_readiness_score}%`, color: scoreColor(access.enterprise_readiness_score) },
            { label: "Automation Success", value: `${sla.automation_sla.success_rate_pct}%`, color: scoreColor(sla.automation_sla.success_rate_pct) },
            { label: "Audit Events (30d)", value: sla.audit_events_logged, color: "text-slate-700" },
            { label: "Policy Violations", value: sla.open_policy_violations, color: sla.open_policy_violations > 0 ? "text-red-600" : "text-emerald-600" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
        {(["sla", "access", "digest"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "sla" ? "SLA Report" : t === "access" ? "Access Control" : "Digests"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">Loading...</div>
      ) : tab === "sla" && sla ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Automation SLA */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Automation SLA (Last 30 Days)</h3>
            <div className="space-y-3">
              {[
                { label: "Total Runs", value: sla.automation_sla.total_runs },
                { label: "Successful", value: sla.automation_sla.successful },
                { label: "Failed", value: sla.automation_sla.failed },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-800">{item.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-600">Success Rate</span>
                  <span className={`font-bold ${scoreColor(sla.automation_sla.success_rate_pct)}`}>
                    {sla.automation_sla.success_rate_pct}%
                  </span>
                </div>
                <div className="bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${sla.automation_sla.success_rate_pct >= 80 ? "bg-emerald-400" : sla.automation_sla.success_rate_pct >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${sla.automation_sla.success_rate_pct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Approval Compliance */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Approval Compliance (Last 30 Days)</h3>
            <div className="space-y-3">
              {[
                { label: "Total Approvals", value: sla.approval_compliance.total },
                { label: "Approved", value: sla.approval_compliance.approved, color: "text-emerald-600" },
                { label: "Rejected", value: sla.approval_compliance.rejected, color: "text-red-600" },
                { label: "Pending", value: sla.approval_compliance.pending, color: "text-amber-600" },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span className={`font-semibold ${item.color || "text-slate-800"}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : tab === "access" && access ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Role Distribution */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-4">User Role Distribution</h3>
            <div className="space-y-2">
              {access.user_role_distribution.map(r => (
                <div key={r.role} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 w-24 capitalize">{r.role}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-400"
                      style={{ width: `${Math.min(100, r.count * 20)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-6 text-right">{r.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Security & Compliance</h3>
            <div className="space-y-3">
              {[
                { label: "Active Policy Rules", value: access.active_policy_rules, type: "number" },
                { label: "SSO Enabled", value: access.sso_enabled, type: "bool" },
                { label: "MFA Enabled", value: access.mfa_enabled, type: "bool" },
                { label: "Audit Logging", value: access.audit_logging, type: "bool" },
                { label: "Data Isolation", value: access.data_isolation, type: "string" },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">{item.label}</span>
                  {item.type === "bool" ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.value ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {item.value ? "Enabled" : "Disabled"}
                    </span>
                  ) : (
                    <span className="font-semibold text-slate-800">{String(item.value)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : tab === "digest" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { digest: dailyDigest, label: "Daily Digest" },
            { digest: weeklyDigest, label: "Weekly Digest" },
          ].map(({ digest, label }) => digest ? (
            <div key={label} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">{label}</h3>
                <span className="text-xs text-slate-400">{new Date(digest.created_at).toLocaleDateString()}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Runs", value: digest.total_runs },
                  { label: "Success", value: digest.successful_runs, color: "text-emerald-600" },
                  { label: "Failed", value: digest.failed_runs, color: "text-red-600" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className={`text-xl font-bold ${s.color || "text-slate-700"}`}>{s.value}</div>
                    <div className="text-xs text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="text-sm text-slate-600 mb-3 p-3 bg-slate-50 rounded-lg">
                {digest.owner_summary}
              </div>

              {parseJSON(digest.top_issues).length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-slate-500 mb-1">Top Issues</div>
                  <ul className="space-y-0.5">
                    {parseJSON(digest.top_issues).map((issue, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-red-400">•</span>{issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parseJSON(digest.recommendations).length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">Recommendations</div>
                  <ul className="space-y-0.5">
                    {parseJSON(digest.recommendations).map((rec, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-emerald-500">→</span>{rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div key={label} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-center text-slate-400 text-sm">
              {label} not available
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
