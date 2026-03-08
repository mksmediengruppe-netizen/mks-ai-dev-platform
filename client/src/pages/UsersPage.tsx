/* ============================================================
   UsersPage — Professional Light theme
   User management with role badges (admin only)
   ============================================================ */

import AppLayout from "@/components/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Users, Shield, Eye, Edit2, Trash2, Plus, UserCheck } from "lucide-react";
import { toast } from "sonner";

const USERS = [
  { id: "1", name: "Admin User", email: "admin@platform.local", role: "admin", status: "active", lastSeen: "Just now" },
  { id: "2", name: "Operator One", email: "operator@platform.local", role: "operator", status: "active", lastSeen: "5 min ago" },
  { id: "3", name: "Viewer User", email: "viewer@platform.local", role: "viewer", status: "active", lastSeen: "1 hour ago" },
  { id: "4", name: "Dev Team Lead", email: "lead@platform.local", role: "operator", status: "inactive", lastSeen: "2 days ago" },
];

const ROLE_STYLES: Record<string, { badge: string; dot: string }> = {
  admin: { badge: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" },
  operator: { badge: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
  viewer: { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

export default function UsersPage() {
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
              <p className="text-slate-500 text-xs">{USERS.length} users</p>
            </div>
          </div>
          <Button
            className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white border-0"
            onClick={() => toast.info("Feature coming soon")}
          >
            <Plus className="w-3.5 h-3.5" /> Add User
          </Button>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl">
            {/* Role summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { role: "admin", count: 1, icon: Shield, iconBg: "bg-red-50", iconColor: "text-red-600", label: "Admins" },
                { role: "operator", count: 2, icon: UserCheck, iconBg: "bg-blue-50", iconColor: "text-blue-600", label: "Operators" },
                { role: "viewer", count: 1, icon: Eye, iconBg: "bg-slate-100", iconColor: "text-slate-600", label: "Viewers" },
              ].map(({ role, count, icon: Icon, iconBg, iconColor, label }) => (
                <div key={role} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <div>
                    <p className="text-slate-800 text-xl font-bold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>{count}</p>
                    <p className="text-slate-500 text-xs">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Users table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">User</span>
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Email</span>
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Role</span>
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Last Seen</span>
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Actions</span>
              </div>
              {USERS.map((u, i) => {
                const roleStyle = ROLE_STYLES[u.role] || ROLE_STYLES.viewer;
                return (
                  <div
                    key={u.id}
                    className={`grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-center px-5 py-4 ${i < USERS.length - 1 ? "border-b border-slate-50" : ""} hover:bg-slate-50 transition-colors`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{u.name[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-800 text-sm font-medium truncate">{u.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                          <span className="text-slate-400 text-xs">{u.status}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm truncate">{u.email}</p>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${roleStyle.badge}`}>
                      {u.role}
                    </span>
                    <span className="text-slate-400 text-xs whitespace-nowrap">{u.lastSeen}</span>
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
