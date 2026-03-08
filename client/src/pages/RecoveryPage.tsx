/* ============================================================
   RecoveryPage — M7 Recovery & Backup
   View backup/restore run history, trigger new backups
   ============================================================ */

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, Clock, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.mksitdev.ru";

interface RestoreRun {
  id: number;
  project_id: number | null;
  restore_type: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  summary_md: string | null;
}

const STATUS_STYLES: Record<string, { cls: string; icon: React.ReactNode }> = {
  completed: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  pending:   { cls: "bg-amber-50 text-amber-700 border-amber-100",   icon: <Clock className="w-3.5 h-3.5" /> },
  failed:    { cls: "bg-red-50 text-red-700 border-red-100",         icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

const TYPE_STYLES: Record<string, string> = {
  backup: "bg-blue-50 text-blue-700",
  full:   "bg-purple-50 text-purple-700",
  partial:"bg-slate-100 text-slate-600",
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

export default function RecoveryPage() {
  const { user } = useAuth();
  const [runs, setRuns]         = useState<RestoreRun[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [backing, setBacking]   = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchRuns = async () => {
    if (!user?.token) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/recovery/runs?limit=20`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRuns(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerBackup = async () => {
    if (!user?.token) return;
    setBacking(true);
    try {
      const res = await fetch(`${API_BASE}/recovery/backup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      toast.success(`Backup #${data.id} completed successfully`);
      await fetchRuns();
    } catch (e: any) {
      toast.error(`Backup failed: ${e.message}`);
    } finally {
      setBacking(false);
    }
  };

  useEffect(() => { fetchRuns(); }, [user?.token]);

  const completedCount = runs.filter(r => r.status === "completed").length;
  const backups        = runs.filter(r => r.restore_type === "backup").length;
  const restores       = runs.filter(r => r.restore_type !== "backup").length;

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <div>
              <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                Recovery & Backup
              </h1>
              <p className="text-slate-500 text-xs">
                {loading ? "Loading…" : `${backups} backups · ${restores} restores`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600"
              onClick={fetchRuns} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600"
              onClick={() => toast.info("Feature coming soon")}>
              <RotateCcw className="w-3.5 h-3.5" /> Restore
            </Button>
            <Button className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              onClick={triggerBackup} disabled={backing}>
              <Download className={`w-3.5 h-3.5 ${backing ? "animate-bounce" : ""}`} />
              {backing ? "Backing up…" : "Backup Now"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        {!loading && !error && (
          <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-6 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-slate-600 text-sm font-medium">{completedCount}</span>
              <span className="text-slate-400 text-xs">completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-slate-600 text-sm font-medium">{backups}</span>
              <span className="text-slate-400 text-xs">backups</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-slate-600 text-sm font-medium">{restores}</span>
              <span className="text-slate-400 text-xs">restores</span>
            </div>
          </div>
        )}

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
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                Loading recovery history…
              </div>
            )}

            {!loading && runs.length === 0 && !error && (
              <div className="bg-white rounded-xl border border-slate-100 p-10 text-center">
                <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No backup or restore runs yet.</p>
                <p className="text-slate-400 text-xs mt-1">Click "Backup Now" to create the first baseline.</p>
              </div>
            )}

            {!loading && runs.map(run => {
              const statusInfo = STATUS_STYLES[run.status] || STATUS_STYLES.pending;
              const typeClass  = TYPE_STYLES[run.restore_type] || "bg-slate-100 text-slate-600";
              const isExpanded = expanded === run.id;
              return (
                <div key={run.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : run.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs font-mono">#{run.id}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeClass}`}>
                        {run.restore_type}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 ${statusInfo.cls}`}>
                        {statusInfo.icon}
                        {run.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Clock className="w-3 h-3" />
                      {relativeTime(run.started_at)}
                    </div>
                  </div>
                  {isExpanded && run.summary_md && (
                    <div className="px-4 pb-4 border-t border-slate-50">
                      <div className="mt-3 bg-slate-50 rounded-lg p-3 text-xs text-slate-600 whitespace-pre-wrap font-mono">
                        {run.summary_md}
                      </div>
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
