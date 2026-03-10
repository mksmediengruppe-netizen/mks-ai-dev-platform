/* ============================================================
   UsersPage — Professional Light theme
   Features:
   - Fetch real users from GET /users
   - Role filter bar (All / Admin / Operator / Viewer)
   - Search by email
   - Add User modal  → POST /users
   - Edit User modal → PATCH /users/{id}  (role + password + active toggle)
   - Delete User     → DELETE /users/{id} with confirm dialog
   ============================================================ */

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users, Shield, Eye, Edit2, Trash2, Plus, UserCheck,
  RefreshCw, AlertCircle, X, Loader2, EyeOff, Save, Search,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

import { API_BASE } from "../lib/api";

interface ApiUser {
  id: number;
  email: string;
  role: "admin" | "operator" | "viewer";
  is_active: boolean;
  created_at: string;
}

const ROLE_STYLES: Record<string, { badge: string }> = {
  admin:    { badge: "bg-red-50 text-red-700 border-red-100" },
  operator: { badge: "bg-blue-50 text-blue-700 border-blue-100" },
  viewer:   { badge: "bg-slate-100 text-slate-600 border-slate-200" },
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

// ── Shared Modal Shell ────────────────────────────────────────
function ModalShell({ title, subtitle, onClose, children, danger }: {
  title: string; subtitle: string; onClose: () => void; children: React.ReactNode; danger?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md border overflow-hidden ${danger ? "border-red-200" : "border-slate-200"}`}>
        <div className={`flex items-center justify-between px-6 py-5 border-b ${danger ? "border-red-100 bg-red-50/50" : "border-slate-100"}`}>
          <div>
            <h2 className={`text-lg font-bold ${danger ? "text-red-800" : "text-slate-900"}`} style={{ fontFamily: "Geist, Inter, sans-serif" }}>{title}</h2>
            <p className={`text-xs mt-0.5 ${danger ? "text-red-600" : "text-slate-500"}`}>{subtitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Role Picker ───────────────────────────────────────────────
function RolePicker({ value, onChange }: { value: string; onChange: (r: "admin" | "operator" | "viewer") => void }) {
  const roles = [
    { id: "admin" as const,    label: "Admin",    desc: "Full access to all features and settings",   cls: "bg-red-50 border-red-300 text-red-700" },
    { id: "operator" as const, label: "Operator", desc: "Can manage chats, artifacts, and workflows", cls: "bg-blue-50 border-blue-300 text-blue-700" },
    { id: "viewer" as const,   label: "Viewer",   desc: "Read-only access to dashboards and reports", cls: "bg-slate-100 border-slate-300 text-slate-700" },
  ];
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-700 text-sm font-medium">Role</Label>
      <div className="grid grid-cols-3 gap-2">
        {roles.map(r => (
          <button key={r.id} type="button" onClick={() => onChange(r.id)}
            className={`py-2.5 rounded-lg border text-xs font-medium transition-all ${value === r.id ? r.cls : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}>
            {r.label}
          </button>
        ))}
      </div>
      <p className="text-slate-400 text-xs">{roles.find(r => r.id === value)?.desc}</p>
    </div>
  );
}

// ── Add User Modal ────────────────────────────────────────────
function AddUserModal({ token, onClose, onCreated }: {
  token: string; onClose: () => void; onCreated: (u: ApiUser) => void;
}) {
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
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, role }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`User ${data.email} created`);
        onCreated({ id: data.id, email: data.email, role: data.role, is_active: true, created_at: new Date().toISOString() });
        onClose();
      } else { toast.error(data.detail || "Failed to create user"); }
    } catch { toast.error("Network error — please try again"); }
    finally { setLoading(false); }
  };

  return (
    <ModalShell title="Add New User" subtitle="Create a new platform account" onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="add-email" className="text-slate-700 text-sm font-medium">Email address</Label>
          <Input id="add-email" type="email" value={email} autoFocus autoComplete="off"
            onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
            placeholder="user@company.com"
            className={`h-10 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 ${errors.email ? "border-red-400" : ""}`} />
          {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-password" className="text-slate-700 text-sm font-medium">Password</Label>
          <div className="relative">
            <Input id="add-password" type={showPwd ? "text" : "password"} value={password} autoComplete="new-password"
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
              placeholder="Min. 6 characters"
              className={`h-10 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 pr-10 ${errors.password ? "border-red-400" : ""}`} />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
        </div>
        <RolePicker value={role} onChange={setRole} />
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}
            className="flex-1 h-10 text-sm border-slate-200 text-slate-600 bg-white">Cancel</Button>
          <Button type="submit" disabled={loading}
            className="flex-1 h-10 text-sm bg-blue-600 hover:bg-blue-700 text-white border-0">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : <><Plus className="w-4 h-4 mr-2" />Create User</>}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Edit User Modal ───────────────────────────────────────────
function EditUserModal({ token, targetUser, onClose, onUpdated }: {
  token: string; targetUser: ApiUser; onClose: () => void; onUpdated: (u: ApiUser) => void;
}) {
  const [role, setRole]               = useState<"admin" | "operator" | "viewer">(targetUser.role);
  const [isActive, setIsActive]       = useState(targetUser.is_active);
  const [newPassword, setNewPassword] = useState("");
  const [showPwd, setShowPwd]         = useState(false);
  const [resetPwd, setResetPwd]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [pwdError, setPwdError]       = useState("");

  const hasChanges = role !== targetUser.role || isActive !== targetUser.is_active || (resetPwd && newPassword.length >= 6);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPwd && newPassword.length < 6) { setPwdError("Minimum 6 characters"); return; }
    setPwdError("");

    const body: Record<string, unknown> = {};
    if (role !== targetUser.role) body.role = role;
    if (isActive !== targetUser.is_active) body.is_active = isActive;
    if (resetPwd && newPassword) body.password = newPassword;

    if (!Object.keys(body).length) { toast.info("No changes to save"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/${targetUser.id}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`User ${data.email} updated`);
        onUpdated(data as ApiUser);
        onClose();
      } else { toast.error(data.detail || "Failed to update user"); }
    } catch { toast.error("Network error — please try again"); }
    finally { setLoading(false); }
  };

  return (
    <ModalShell title="Edit User" subtitle={`Editing ${targetUser.email}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
        {/* User info badge */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">{nameFromEmail(targetUser.email)[0].toUpperCase()}</span>
          </div>
          <div>
            <p className="text-slate-800 text-sm font-medium">{nameFromEmail(targetUser.email)}</p>
            <p className="text-slate-500 text-xs">{targetUser.email}</p>
          </div>
        </div>

        {/* Role */}
        <RolePicker value={role} onChange={setRole} />

        {/* Active toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="text-slate-700 text-sm font-medium">Account Status</p>
            <p className="text-slate-400 text-xs mt-0.5">{isActive ? "User can log in and use the platform" : "User is blocked from logging in"}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${isActive ? "bg-emerald-500" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Password reset */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input id="reset-pwd-toggle" type="checkbox" checked={resetPwd}
              onChange={e => { setResetPwd(e.target.checked); setNewPassword(""); setPwdError(""); }}
              className="w-4 h-4 rounded border-slate-300 accent-blue-600" />
            <Label htmlFor="reset-pwd-toggle" className="text-slate-700 text-sm font-medium cursor-pointer">Reset password</Label>
          </div>
          {resetPwd && (
            <div className="relative">
              <Input type={showPwd ? "text" : "password"} value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setPwdError(""); }}
                placeholder="New password (min. 6 chars)" autoComplete="new-password" autoFocus
                className={`h-10 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 pr-10 ${pwdError ? "border-red-400" : ""}`} />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {pwdError && <p className="text-red-500 text-xs mt-1">{pwdError}</p>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}
            className="flex-1 h-10 text-sm border-slate-200 text-slate-600 bg-white">Cancel</Button>
          <Button type="submit" disabled={loading || !hasChanges}
            className="flex-1 h-10 text-sm bg-blue-600 hover:bg-blue-700 text-white border-0 disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────
function DeleteConfirmModal({ token, targetUser, onClose, onDeleted }: {
  token: string; targetUser: ApiUser; onClose: () => void; onDeleted: (id: number) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/${targetUser.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`User ${targetUser.email} deleted`);
        onDeleted(targetUser.id);
        onClose();
      } else { toast.error(data.detail || "Failed to delete user"); }
    } catch { toast.error("Network error — please try again"); }
    finally { setLoading(false); }
  };

  return (
    <ModalShell title="Delete User" subtitle="This action cannot be undone" onClose={onClose} danger>
      <div className="px-6 py-5 space-y-5">
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 text-sm font-medium">Are you sure you want to delete this user?</p>
            <p className="text-red-600 text-xs mt-1">
              <strong>{targetUser.email}</strong> ({targetUser.role}) will lose all access to the platform immediately.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}
            className="flex-1 h-10 text-sm border-slate-200 text-slate-600 bg-white">Cancel</Button>
          <Button type="button" onClick={handleDelete} disabled={loading}
            className="flex-1 h-10 text-sm bg-red-600 hover:bg-red-700 text-white border-0">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting…</> : <><Trash2 className="w-4 h-4 mr-2" />Delete User</>}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers]           = useState<ApiUser[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [editTarget, setEditTarget] = useState<ApiUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiUser | null>(null);
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "operator" | "viewer">("all");
  const [search, setSearch]         = useState("");

  const fetchUsers = async () => {
    if (!user?.token) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${user.token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setUsers(await res.json());
    } catch (e: any) { setError(e.message || "Failed to load users"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [user?.token]);

  const handleCreated = (u: ApiUser) => setUsers(prev => [u, ...prev]);
  const handleUpdated = (u: ApiUser) => setUsers(prev => prev.map(x => x.id === u.id ? u : x));
  const handleDeleted = (id: number) => setUsers(prev => prev.filter(x => x.id !== id));

  const admins    = users.filter(u => u.role === "admin").length;
  const operators = users.filter(u => u.role === "operator").length;
  const viewers   = users.filter(u => u.role === "viewer").length;
  const isAdmin   = user?.role === "admin";

  const filteredUsers = users
    .filter(u => roleFilter === "all" || u.role === roleFilter)
    .filter(u => !search.trim() || u.email.toLowerCase().includes(search.toLowerCase()));

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
              <p className="text-slate-500 text-xs">{loading ? "Loading…" : `${users.length} users`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600 bg-white"
              onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {isAdmin && (
              <Button className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white border-0"
                onClick={() => setShowAdd(true)}>
                <Plus className="w-3.5 h-3.5" /> Add User
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl">
            {/* Role filter bar */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {([
                { id: "all" as const,      label: "All Users", count: users.length,    active: "bg-slate-800 text-white border-slate-800",   inactive: "bg-white text-slate-600 border-slate-200 hover:border-slate-300" },
                { id: "admin" as const,    label: "Admin",     count: admins,          active: "bg-red-600 text-white border-red-600",       inactive: "bg-white text-red-600 border-red-200 hover:border-red-300" },
                { id: "operator" as const, label: "Operator",  count: operators,       active: "bg-blue-600 text-white border-blue-600",     inactive: "bg-white text-blue-600 border-blue-200 hover:border-blue-300" },
                { id: "viewer" as const,   label: "Viewer",    count: viewers,         active: "bg-slate-500 text-white border-slate-500",   inactive: "bg-white text-slate-500 border-slate-200 hover:border-slate-300" },
              ]).map(f => (
                <button key={f.id} onClick={() => setRoleFilter(f.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${roleFilter === f.id ? f.active : f.inactive}`}>
                  {f.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${roleFilter === f.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {loading ? "…" : f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by email…"
                className="h-9 pl-9 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-400"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Role summary cards */}
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
                {["User", "Email", "Role", "Registered", "Actions"].map(h => (
                  <span key={h} className="text-slate-500 text-xs font-medium uppercase tracking-wide">{h}</span>
                ))}
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
              {!loading && filteredUsers.length === 0 && users.length > 0 && (
                <div className="px-5 py-8 text-center text-slate-400 text-sm">
                  {search ? `No users matching "${search}"` : `No ${roleFilter} users found.`}
                </div>
              )}

              {!loading && filteredUsers.map((u, i) => {
                const roleStyle     = ROLE_STYLES[u.role] || ROLE_STYLES.viewer;
                const displayName   = nameFromEmail(u.email);
                const isCurrentUser = u.email === user?.email;
                return (
                  <div key={u.id}
                    className={`grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-center px-5 py-4 ${i < filteredUsers.length - 1 ? "border-b border-slate-50" : ""} hover:bg-slate-50 transition-colors ${isCurrentUser ? "bg-blue-50/30" : ""} ${!u.is_active ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${u.is_active ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-slate-300"}`}>
                        <span className="text-white text-xs font-bold">{displayName[0].toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-slate-800 text-sm font-medium truncate">{displayName}</p>
                          {isCurrentUser && (
                            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">you</span>
                          )}
                          {!u.is_active && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">inactive</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                          <span className="text-slate-400 text-xs">{u.is_active ? "active" : "blocked"}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm truncate">{u.email}</p>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${roleStyle.badge}`}>
                      {u.role}
                    </span>
                    <span className="text-slate-400 text-xs whitespace-nowrap">{relativeTime(u.created_at)}</span>
                    <div className="flex items-center gap-1.5">
                      {isAdmin && (
                        <button onClick={() => setEditTarget(u)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-500 flex items-center justify-center transition-colors"
                          title="Edit user">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (isCurrentUser) { toast.error("You cannot delete your own account"); return; }
                            setDeleteTarget(u);
                          }}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-500 flex items-center justify-center transition-colors"
                          title="Delete user">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!isAdmin && (
              <p className="text-slate-400 text-xs text-center mt-4">Only admins can create or modify users.</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Modals */}
      {showAdd && user?.token && (
        <AddUserModal token={user.token} onClose={() => setShowAdd(false)} onCreated={handleCreated} />
      )}
      {editTarget && user?.token && (
        <EditUserModal token={user.token} targetUser={editTarget} onClose={() => setEditTarget(null)} onUpdated={handleUpdated} />
      )}
      {deleteTarget && user?.token && (
        <DeleteConfirmModal token={user.token} targetUser={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      )}
    </AppLayout>
  );
}
