/* ============================================================
   SearchPage — M9 Cross-project Global Search
   Search across tasks, issues, decisions, templates, projects
   ============================================================ */

import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Search, FileText, AlertTriangle, Cpu, Code2, Briefcase,
  Clock, ChevronRight, Loader2
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "https://api.mksitdev.ru";

interface SearchResult {
  type: string;
  id: number;
  title: string;
  body: string;
  status: string;
  project: string | null;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  task: { icon: FileText, color: "text-blue-500 bg-blue-50", label: "Task" },
  issue: { icon: AlertTriangle, color: "text-amber-500 bg-amber-50", label: "Issue" },
  decision: { icon: Cpu, color: "text-purple-500 bg-purple-50", label: "Decision" },
  template: { icon: Code2, color: "text-emerald-500 bg-emerald-50", label: "Template" },
  project: { icon: Briefcase, color: "text-slate-500 bg-slate-100", label: "Project" },
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = async (q: string) => {
    if (q.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const r = await fetch(`${API}/search/global?q=${encodeURIComponent(q)}&limit=50`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!r.ok) throw new Error("Search failed");
      const data = await r.json();
      setResults(data.results || []);
    } catch (e: any) {
      toast.error(e.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q), 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      doSearch(query);
    }
  };

  const types = ["all", ...Object.keys(TYPE_CONFIG)];
  const filtered = typeFilter === "all" ? results : results.filter(r => r.type === typeFilter);

  const groupedCounts = Object.keys(TYPE_CONFIG).reduce((acc, t) => {
    acc[t] = results.filter(r => r.type === t).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800 mb-1" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
            Cross-project Search
          </h1>
          <p className="text-slate-500 text-sm">Search across tasks, issues, decisions, templates, and projects</p>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, issues, decisions, templates..."
            className="w-full pl-12 pr-12 py-3.5 text-base border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
          )}
        </div>

        {/* Type Filters */}
        {searched && results.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {types.map(t => {
              const count = t === "all" ? results.length : groupedCounts[t] || 0;
              if (t !== "all" && count === 0) return null;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    typeFilter === t
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {t === "all" ? "All" : TYPE_CONFIG[t]?.label || t}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${typeFilter === t ? "bg-blue-500" : "bg-slate-100 text-slate-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Results */}
        {!searched && !loading && (
          <div className="text-center py-16 text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-slate-500">Start typing to search</p>
            <p className="text-sm mt-1">Searches across all projects, tasks, issues, decisions, and templates</p>
          </div>
        )}

        {searched && !loading && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No results found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((r, i) => {
              const cfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.task;
              const Icon = cfg.icon;
              return (
                <div key={`${r.type}-${r.id}-${i}`} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {r.title}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {r.status && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-500">
                            {r.status}
                          </span>
                        )}
                      </div>
                      {r.body && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-1">{r.body}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {r.project && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {r.project}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(r.created_at)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
