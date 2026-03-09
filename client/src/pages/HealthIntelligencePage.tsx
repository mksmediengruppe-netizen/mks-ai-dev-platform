/**
 * HealthIntelligencePage — M10 Predictive Health & Risk Intelligence
 * Design: Clean data-dense layout, color-coded risk levels, trend indicators
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API = import.meta.env.VITE_API_URL || "https://api.mksitdev.ru";

interface HealthScore {
  project_id: number;
  project_name: string;
  score: number;
  trend: string;
  risk_level: string;
  velocity_score: number;
  quality_score: number;
  team_score: number;
  delivery_score: number;
  open_issues: number;
  failed_runs: number;
  pending_approvals: number;
  last_calculated_at: string;
}

interface RiskSummary {
  project_id: number;
  project_name: string;
  risk_level: string;
  top_risks: string[];
  recommendations: string[];
  predicted_delay_days: number | null;
  confidence: number;
}

interface Escalation {
  id: number;
  project_id: number | null;
  project_name: string | null;
  escalation_type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

const riskColors: Record<string, string> = {
  low: "text-emerald-600 bg-emerald-50 border-emerald-200",
  medium: "text-amber-600 bg-amber-50 border-amber-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  critical: "text-red-600 bg-red-50 border-red-200",
};

const trendIcon = (trend: string) => {
  if (trend === "improving") return <span className="text-emerald-500">↑</span>;
  if (trend === "declining") return <span className="text-red-500">↓</span>;
  return <span className="text-slate-400">→</span>;
};

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right">{Math.round(value)}</span>
    </div>
  );
}

export default function HealthIntelligencePage() {
  const { user } = useAuth();
  const [scores, setScores] = useState<HealthScore[]>([]);
  const [risks, setRisks] = useState<RiskSummary[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"health" | "risks" | "escalations">("health");
  const [selected, setSelected] = useState<HealthScore | null>(null);

  const headers = { Authorization: `Bearer ${(user as any)?.access_token || (user as any)?.token || ""}` };

  const load = useCallback(async () => {
    try {
      const [scoresRes, risksRes, escRes] = await Promise.all([
        fetch(`${API}/health/scores`, { headers }),
        fetch(`${API}/health/risk-summary`, { headers }),
        fetch(`${API}/health/escalations`, { headers }),
      ]);
      if (scoresRes.ok) setScores(await scoresRes.json());
      if (risksRes.ok) setRisks(await risksRes.json());
      if (escRes.ok) setEscalations(await escRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((s, h) => s + h.score, 0) / scores.length)
    : 0;
  const criticalCount = scores.filter(h => h.risk_level === "critical").length;
  const openEscalations = escalations.filter(e => e.status === "open").length;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Health Intelligence</h1>
        <p className="text-slate-500 text-sm mt-1">Predictive project health, risk analysis, and escalation management</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Avg Health Score", value: `${avgScore}/100`, color: avgScore >= 70 ? "text-emerald-600" : avgScore >= 50 ? "text-amber-600" : "text-red-600" },
          { label: "Critical Projects", value: criticalCount, color: criticalCount > 0 ? "text-red-600" : "text-emerald-600" },
          { label: "Open Escalations", value: openEscalations, color: openEscalations > 0 ? "text-orange-600" : "text-emerald-600" },
          { label: "Projects Tracked", value: scores.length, color: "text-slate-700" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
        {(["health", "risks", "escalations"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "health" ? "Health Scores" : t === "risks" ? "Risk Analysis" : "Escalations"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">Loading...</div>
      ) : tab === "health" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {scores.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-slate-400">No health scores available</div>
          ) : scores.map(h => (
            <div
              key={h.project_id}
              onClick={() => setSelected(selected?.project_id === h.project_id ? null : h)}
              className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
                selected?.project_id === h.project_id ? "border-blue-400 shadow-md" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-slate-800">{h.project_name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Updated {new Date(h.last_calculated_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {trendIcon(h.trend)}
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${riskColors[h.risk_level] || riskColors.medium}`}>
                    {h.risk_level}
                  </span>
                  <span className="text-2xl font-bold text-slate-800">{Math.round(h.score)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div><div className="text-xs text-slate-500 mb-0.5">Velocity</div><ScoreBar value={h.velocity_score} color="bg-blue-400" /></div>
                <div><div className="text-xs text-slate-500 mb-0.5">Quality</div><ScoreBar value={h.quality_score} color="bg-emerald-400" /></div>
                <div><div className="text-xs text-slate-500 mb-0.5">Team</div><ScoreBar value={h.team_score} color="bg-purple-400" /></div>
                <div><div className="text-xs text-slate-500 mb-0.5">Delivery</div><ScoreBar value={h.delivery_score} color="bg-amber-400" /></div>
              </div>

              {selected?.project_id === h.project_id && (
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                  <div><div className="text-lg font-bold text-red-500">{h.open_issues}</div><div className="text-xs text-slate-400">Open Issues</div></div>
                  <div><div className="text-lg font-bold text-orange-500">{h.failed_runs}</div><div className="text-xs text-slate-400">Failed Runs</div></div>
                  <div><div className="text-lg font-bold text-amber-500">{h.pending_approvals}</div><div className="text-xs text-slate-400">Pending Approvals</div></div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : tab === "risks" ? (
        <div className="space-y-4">
          {risks.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No risk data available</div>
          ) : risks.map(r => (
            <div key={r.project_id} className={`bg-white border rounded-xl p-4 ${riskColors[r.risk_level]?.split(" ")[2] ? `border-${riskColors[r.risk_level]?.split(" ")[2]}` : "border-slate-200"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-slate-800">{r.project_name}</div>
                  {r.predicted_delay_days && (
                    <div className="text-xs text-orange-600 mt-0.5">
                      Predicted delay: {r.predicted_delay_days} days (confidence: {Math.round(r.confidence * 100)}%)
                    </div>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${riskColors[r.risk_level] || riskColors.medium}`}>
                  {r.risk_level} risk
                </span>
              </div>
              {r.top_risks.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-medium text-slate-600 mb-1">Top Risks</div>
                  <ul className="space-y-0.5">
                    {r.top_risks.map((risk, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5">•</span>{risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {r.recommendations.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-600 mb-1">Recommendations</div>
                  <ul className="space-y-0.5">
                    {r.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5">→</span>{rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Severity</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Project</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {escalations.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">No escalations</td></tr>
              ) : escalations.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{e.title}</div>
                    <div className="text-xs text-slate-400">{e.escalation_type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${riskColors[e.severity] || riskColors.medium}`}>
                      {e.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">{e.project_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      e.status === "open" ? "bg-red-100 text-red-700" :
                      e.status === "resolved" ? "bg-emerald-100 text-emerald-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500 font-mono">
                    {new Date(e.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
