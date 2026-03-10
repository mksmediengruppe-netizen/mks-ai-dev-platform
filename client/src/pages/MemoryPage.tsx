/* ============================================================
   MemoryPage — M7 Huge Long-Term Memory
   Search and browse memory snapshots across all scopes
   ============================================================ */

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Brain, Search, RefreshCw, Tag, Clock, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

import { API_BASE } from "../lib/api";

interface MemorySnapshot {
  id: number;
  scope: string;
  project_id: number | null;
  conversation_id: string | null;
  snapshot_type: string;
  summary_json: Record<string, any>;
  tags: string[];
  created_at: string;
}

const SCOPE_COLORS: Record<string, string> = {
  global:       "bg-purple-50 text-purple-700 border-purple-100",
  project:      "bg-blue-50 text-blue-700 border-blue-100",
  conversation: "bg-emerald-50 text-emerald-700 border-emerald-100",
  user:         "bg-amber-50 text-amber-700 border-amber-100",
};

const TYPE_COLORS: Record<string, string> = {
  summary:         "bg-slate-100 text-slate-600",
  decision:        "bg-indigo-50 text-indigo-700",
  decision_record: "bg-indigo-50 text-indigo-700",
  platform_init:   "bg-green-50 text-green-700",
  cors_fix:        "bg-red-50 text-red-700",
  users_api:       "bg-blue-50 text-blue-700",
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MemoryPage() {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<MemorySnapshot[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [query, setQuery]         = useState("");
  const [scope, setScope]         = useState("");

  const fetchSnapshots = async (q = query, s = scope) => {
    if (!user?.token) return;
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (q) params.set("q", q);
      if (s) params.set("scope", s);
      const res = await fetch(`${API_BASE}/memory/search?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSnapshots(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSnapshots(); }, [user?.token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSnapshots();
  };

  const scopes = ["", "global", "project", "conversation", "user"];

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-500" />
            <div>
              <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                Long-Term Memory
              </h1>
              <p className="text-slate-500 text-xs">
                {loading ? "Loading…" : `${snapshots.length} snapshots`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600"
              onClick={() => fetchSnapshots()} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button className="h-8 text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white border-0"
              onClick={() => toast.info("Feature coming soon")}>
              <Plus className="w-3.5 h-3.5" /> Add Snapshot
            </Button>
          </div>
        </div>

        {/* Search + filter bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search memory…"
                className="w-full pl-9 pr-3 h-8 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-300 focus:border-purple-300"
              />
            </div>
            <Button type="submit" className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white border-0">Search</Button>
          </form>
          <div className="flex items-center gap-1">
            {scopes.map(s => (
              <button key={s || "all"} onClick={() => { setScope(s); fetchSnapshots(query, s); }}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${scope === s ? "bg-purple-50 text-purple-700 border-purple-200 font-medium" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}>
                {s || "All"}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Error: {error}</span>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                Loading memory snapshots…
              </div>
            )}

            {!loading && snapshots.length === 0 && !error && (
              <div className="bg-white rounded-xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
                No memory snapshots found.
              </div>
            )}

            {!loading && snapshots.map(snap => {
              const scopeClass = SCOPE_COLORS[snap.scope] || "bg-slate-100 text-slate-600 border-slate-200";
              const typeClass  = TYPE_COLORS[snap.snapshot_type] || "bg-slate-100 text-slate-600";
              return (
                <div key={snap.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${scopeClass}`}>
                        {snap.scope}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeClass}`}>
                        {snap.snapshot_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {relativeTime(snap.created_at)}
                    </div>
                  </div>
                  <div className="mt-3 bg-slate-50 rounded-lg p-3 text-xs text-slate-600 font-mono overflow-x-auto">
                    {Object.entries(snap.summary_json).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-purple-600 font-semibold flex-shrink-0">{k}:</span>
                        <span className="text-slate-700">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                      </div>
                    ))}
                  </div>
                  {snap.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {snap.tags.map(t => (
                        <span key={t} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
