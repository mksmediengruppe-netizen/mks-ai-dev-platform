/* ============================================================
   UsersPage — Professional Light theme
   Fetches real users from /users API endpoint (admin only)
   Add User modal connected to POST /users API
   ============================================================ */

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users, Shield, Eye, Edit2, Trash2, Plus, UserCheck,
  RefreshCw, AlertCircle, X, Loader2, Eye as EyeIcon, EyeOff
} from "lucide-react";
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
  admin:    { badge: "bg-red-50 text-red-700 border-red-100",       dot: "bg-red-500" },
  operator: { badge: "bg-blue-50 text-blue-700 border-blue-100",    dot: "bg-blue-500" },
  viewer:   { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

function nameFromEmail(email: string) {
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function relativeTime(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return "—"; }
}

// ── Add User Modal ────────────────────────────────────────────
interface AddUserModalProps {
  token: string;
  onClose: () => void;
  onCreated: (u: ApiUser) => void;
}

function AddUserModal({ token, onClose, onCreated }: AddUserModalProps) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState<"admin" | "operator" | "viewer">("operator");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email format";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Minimum 6 characters";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password, role }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`User ${data.email} created successfully`);
        onCreated({
          id: data.id,
          email: data.email,
          role: data.role,
          is_active: true,
          created_at: new Date().toISOString(),
        });
        onClose();
      } else {
        toast.error(data.detail || "Failed to create user");
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-slate-900 text-lg font-bold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              Add New User
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">Create a new platform account</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="new-email" className="text-slate-700 text-sm font-medium">
              Email address
            </Label>
            <Input
              id="new-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: "" })); }}
              placeholder="user@company.com"
              className={`h-10 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 ${errors.email ? "border-red-400 focus:border-red-400" : ""}`}
              autoComplete="off"
              autoFocus
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-slate-700 text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: "" })); }}
                placeholder="Min. 6 characters"
                className={`h-10 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 pr-10 ${errors.password ? "border-red-400 focus:border-red-400" : ""}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label className="text-slate-700 text-sm font-medium">Role</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["admin", "operator", "viewer"] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2.5 rounded-lg border text-xs font-medium transition-all capitalize ${
                    role === r
                      ? r === "admin"
                        ? "bg-red-50 border-red-300 text-red-700"
                        : r === "operator"
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-slate-100 border-slate-300 text-slate-700"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="text-slate-400 text-xs">
              {role === "admin" && "Full access to all platform features and settings"}
              {role === "operator" && "Can manage chats, artifacts, and workflows"}
              {role === "viewer" && "Read-only access to dashboards and reports"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-10 text-sm border-slate-200 text-slate-600 bg-white"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-10 text-sm bg-blue-600 hover:bg-blue-700 text-white border-0"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> Create User</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers]       = useState<ApiUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  const handleUserCreated = (newUser: ApiUser) => {
    setUsers(prev => [newUser, ...prev]);
  };

  const admins    = users.filter(u => u.role === "admin").length;
  const operators = users.filter(u => u.role === "operator").length;
  const viewers   = users.filter(u => u.role === "viewer").length;

  const isAdmin = user?.role === "admin";

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
              className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600 bg-white"
              onClick={fetchUsers}
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {isAdmin && (
              <Button
                className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white border-0"
                onClick={() => setShowModal(true)}
              >
                <Plus className="w-3.5 h-3.5" /> Add User
              </Button>
            )}
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
                        onClick={() => toast.info("Edit user — coming soon")}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-500 flex items-center justify-center transition-colors"
                        title="Edit user"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (isCurrentUser) { toast.error("You cannot delete your own account"); return; }
                          toast.info("Delete user — coming soon");
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-500 flex items-center justify-center transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Non-admin notice */}
            {!isAdmin && (
              <p className="text-slate-400 text-xs text-center mt-4">
                Only admins can create or modify users.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Add User Modal */}
      {showModal && user?.token && (
        <AddUserModal
          token={user.token}
          onClose={() => setShowModal(false)}
          onCreated={handleUserCreated}
        />
      )}
    </AppLayout>
  );
}
