/* ============================================================
   AppLayout — Professional Light sidebar + main content
   White sidebar with blue accent, clean borders, shadow depth
   ============================================================ */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Bot, LayoutDashboard, MessageSquare, FileText,
  Users, Settings, LogOut, ChevronLeft, ChevronRight,
  Zap, Code2, Globe
} from "lucide-react";
import { toast } from "sonner";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: MessageSquare, label: "Chat Workspace", href: "/chat" },
  { icon: FileText, label: "Artifacts", href: "/artifacts" },
  { icon: Zap, label: "Automations", href: "/chat" },
  { icon: Code2, label: "Builder", href: "/chat" },
  { icon: Globe, label: "Sites", href: "/chat" },
];

const ADMIN_NAV: NavItem[] = [
  { icon: Users, label: "Users", href: "/users", roles: ["admin"] },
  { icon: Settings, label: "Settings", href: "/settings", roles: ["admin", "operator"] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const { user, logout, hasRole } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
  };

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  const roleBadgeClass = user?.role === "admin"
    ? "role-admin"
    : user?.role === "operator"
    ? "role-operator"
    : "role-viewer";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-200 relative bg-white"
        style={{
          width: collapsed ? "60px" : "240px",
          borderRight: "1px solid #e2e8f0",
          boxShadow: "1px 0 0 0 #f1f5f9",
        }}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 flex-shrink-0 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="ml-3 overflow-hidden">
              <p className="text-slate-800 text-sm font-bold leading-tight truncate"
                style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                AI Dev Team
              </p>
              <p className="text-slate-400 text-xs">Platform M6</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
            <Link key={href + label} href={href}>
              <a
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-100 group"
                style={{
                  color: isActive(href) ? "#2563eb" : "#64748b",
                  background: isActive(href) ? "#eff6ff" : "transparent",
                  fontWeight: isActive(href) ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isActive(href)) {
                    (e.currentTarget as HTMLElement).style.background = "#f8fafc";
                    (e.currentTarget as HTMLElement).style.color = "#334155";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(href)) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "#64748b";
                  }
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </a>
            </Link>
          ))}

          {/* Admin section */}
          {ADMIN_NAV.some(item => !item.roles || item.roles.some(r => hasRole(r as any))) && (
            <>
              {!collapsed && (
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider px-3 pt-4 pb-1">
                  Admin
                </p>
              )}
              {ADMIN_NAV.map(({ icon: Icon, label, href, roles }) => {
                if (roles && !roles.some(r => hasRole(r as any))) return null;
                return (
                  <Link key={href + label} href={href}>
                    <a
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-100"
                      style={{
                        color: isActive(href) ? "#2563eb" : "#64748b",
                        background: isActive(href) ? "#eff6ff" : "transparent",
                        fontWeight: isActive(href) ? 500 : 400,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive(href)) {
                          (e.currentTarget as HTMLElement).style.background = "#f8fafc";
                          (e.currentTarget as HTMLElement).style.color = "#334155";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive(href)) {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                          (e.currentTarget as HTMLElement).style.color = "#64748b";
                        }
                      }}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </a>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User section */}
        <div className="p-3 flex-shrink-0 border-t border-slate-100">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 text-xs font-semibold truncate">{user?.name}</p>
                <span className={roleBadgeClass}>{user?.role}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center z-20 transition-colors bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 shadow-sm"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col bg-slate-50">
        {children}
      </main>
    </div>
  );
}
