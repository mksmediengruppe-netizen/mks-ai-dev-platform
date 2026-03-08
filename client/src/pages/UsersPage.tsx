/* ============================================================
   UsersPage — Professional Light theme
   Fetches real users from /users API endpoint (admin only)
   ============================================================ */

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Users, Shield, Eye, Edit2, Trash2, Plus, UserCheck, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.mksitdev.ru";

interface ApiUser {
  id: number;
  email: string;
  role: "admin" | "operator" | "viewer";
  is_active: boolean;
  created_at: string;
}

const ROLE_STYLES: Record<string, { badge: string; dot: string }> = {
  admin:    { badge: "bg-red-50 text-red-700 border-red-100",     dot: "bg-red-500" },
  operator: { badge: "bg-blue-50 text-blue-700 border-blue-100",  dot: "bg-blue-500" },
  viewer:   { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

// Derive a display name from email: "ym@mksmedia.ru" → "ym"
function nameFromEmail(email: string) {
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

// Format ISO date as relative time
function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers]     = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiUser[] = await res.json();
      setUsers(data);
    } catch (e: any) {
      setError(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [user?.token]);

  const admins    = users.filter(u => u.role === "admin").length;
  const operators = users.filter(u => u.role === "operator").length;
  const viewers   = users.filter(u => u.role === "viewer").length;

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <div>
              <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                User Management
              </h1>
              <p className="text-slate-500 text-xs">
                {loading ? "Loading…" : `${users.length} users`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600"
              onClick={fetchUsers}
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white border-0"
              onClick={() => toast.info("Feature coming soon")}
            >
              <Plus className="w-3.5 h-3.5" /> Add User
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl">
            {/* Role summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { icon: Shield,    iconBg: "bg-red-50",    iconColor: "text-red-600",   label: "Admins",    count: admins },
                { icon: UserCheck, iconBg: "bg-blue-50",   iconColor: "text-blue-600",  label: "Operators", count: operators },
                { icon: Eye,       iconBg: "bg-slate-100", iconColor: "text-slate-600", label: "Viewers",   count: viewers },
              ].map(({ icon: Icon, iconBg, iconColor, label, count }) => (
                <div key={label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <div>
                    <p className="text-slate-800 text-xl font-bold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                      {loading ? "—" : count}
                    </p>
                    <p className="text-slate-500 text-xs">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Error state */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 flex items-center gap-3 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Could not load users: {error}</span>
              </div>
            )}

            {/* Users table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">User</span>
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Email</span>
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Role</span>
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Registered</span>
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Actions</span>
              </div>

              {loading && (
                <div className="px-5 py-10 text-center text-slate-400 text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
                  Loading users…
                </div>
              )}

              {!loading && users.length === 0 && !error && (
                <div className="px-5 py-10 text-center text-slate-400 text-sm">No users found.</div>
              )}

              {!loading && users.map((u, i) => {
                const roleStyle = ROLE_STYLES[u.role] || ROLE_STYLES.viewer;
                const displayName = nameFromEmail(u.email);
                const isCurrentUser = u.email === user?.email;
                return (
                  <div
                    key={u.id}
                    className={`grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-center px-5 py-4 ${
                      i < users.length - 1 ? "border-b border-slate-50" : ""
                    } hover:bg-slate-50 transition-colors ${isCurrentUser ? "bg-blue-50/30" : ""}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{displayName[0].toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-slate-800 text-sm font-medium truncate">{displayName}</p>
                          {isCurrentUser && (
                            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">you</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                          <span className="text-slate-400 text-xs">{u.is_active ? "active" : "inactive"}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm truncate">{u.email}</p>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${roleStyle.badge}`}>
                      {u.role}
                    </span>
                    <span className="text-slate-400 text-xs whitespace-nowrap">{relativeTime(u.created_at)}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toast.info("Feature coming soon")}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-500 flex items-center justify-center transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toast.error("Feature coming soon")}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-500 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
