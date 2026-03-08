/* ============================================================
   UsersPage — User management with role badges (admin only)
   ============================================================ */

import AppLayout from "@/components/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Users, Shield, Eye, Edit2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const USERS = [
  { id: "1", name: "Admin User", email: "admin@platform.local", role: "admin", status: "active", lastSeen: "Just now" },
  { id: "2", name: "Operator One", email: "operator@platform.local", role: "operator", status: "active", lastSeen: "5 min ago" },
  { id: "3", name: "Viewer User", email: "viewer@platform.local", role: "viewer", status: "active", lastSeen: "1 hour ago" },
  { id: "4", name: "Dev Team Lead", email: "lead@platform.local", role: "operator", status: "inactive", lastSeen: "2 days ago" },
];

const ROLE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  admin: { bg: "#ef444415", color: "#f87171", border: "#ef444430" },
  operator: { bg: "#3b82f615", color: "#60a5fa", border: "#3b82f630" },
  viewer: { bg: "#64748b15", color: "#94a3b8", border: "#64748b30" },
};

export default function UsersPage() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col" style={{ background: "#0a0d14" }}>
        <div className="flex items-center justify-between px-6 h-14 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h1 className="text-white text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              User Management
            </h1>
          </div>
          <Button
            className="h-8 text-xs gap-1.5"
            style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd" }}
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
                { role: "admin", count: 1, icon: Shield, color: "#ef4444" },
                { role: "operator", count: 2, icon: Edit2, color: "#3b82f6" },
                { role: "viewer", count: 1, icon: Eye, color: "#64748b" },
              ].map(({ role, count, icon: Icon, color }) => (
                <div key={role} className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-white text-lg font-bold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>{count}</p>
                    <p className="text-slate-500 text-xs capitalize">{role}s</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Users table */}
            <div className="rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="grid grid-cols-5 gap-4 px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider"
                style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="col-span-2">User</span>
                <span>Role</span>
                <span>Status</span>
                <span>Last seen</span>
              </div>
              {USERS.map((u, i) => {
                const rs = ROLE_STYLES[u.role];
                return (
                  <div key={u.id}
                    className="grid grid-cols-5 gap-4 px-4 py-3.5 items-center group transition-colors"
                    style={{
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                      borderBottom: i < USERS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    }}
                  >
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">{u.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-slate-200 text-sm font-medium">{u.name}</p>
                        <p className="text-slate-600 text-xs">{u.email}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                        {u.role}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={u.status === "active"
                          ? { background: "#10b98115", color: "#10b981", border: "1px solid #10b98130" }
                          : { background: "#64748b15", color: "#64748b", border: "1px solid #64748b30" }}>
                        {u.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 text-xs">{u.lastSeen}</span>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-blue-400 transition-colors"
                          onClick={() => toast.info("Feature coming soon")}>
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
                          onClick={() => toast.info("Feature coming soon")}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
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
