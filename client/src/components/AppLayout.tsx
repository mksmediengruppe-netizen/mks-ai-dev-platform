/* ============================================================
   AppLayout — Obsidian Glass sidebar + main content
   Fixed left sidebar (240px, collapsible) + main area
   ============================================================ */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Bot, LayoutDashboard, MessageSquare, FileText,
  Users, Settings, LogOut, ChevronLeft, ChevronRight,
  Zap, Code2, Globe, Shield
} from "lucide-react";
import { toast } from "sonner";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663413127711/7myqqxjLrvciy6sPuXJuMu/hero-bg-jyvt5GgWtoUAAtFCx8Yq9Q.webp";

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
  { icon: Shield, label: "Settings", href: "/settings", roles: ["admin", "operator"] },
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
    <div className="flex h-screen overflow-hidden" style={{ background: "#0a0d14" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-200 relative"
        style={{
          width: collapsed ? "60px" : "240px",
          background: "rgba(12,15,23,0.95)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Subtle background glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `url(${HERO_BG})`,
            backgroundSize: "cover",
            backgroundPosition: "left center",
            filter: "blur(20px)",
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center h-16 px-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="ml-3 overflow-hidden">
              <p className="text-white text-sm font-semibold leading-tight truncate"
                style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                AI Dev Team
              </p>
              <p className="text-slate-500 text-xs">Platform M6</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
            <Link key={href + label} href={href}>
              <a
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group"
                style={{
                  color: isActive(href) ? "#93c5fd" : "#64748b",
                  background: isActive(href) ? "rgba(59,130,246,0.12)" : "transparent",
                  border: isActive(href) ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(href)) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLElement).style.color = "#94a3b8";
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
                <p className="text-slate-600 text-xs font-medium uppercase tracking-wider px-3 pt-4 pb-1">
                  Admin
                </p>
              )}
              {ADMIN_NAV.map(({ icon: Icon, label, href, roles }) => {
                if (roles && !roles.some(r => hasRole(r as any))) return null;
                return (
                  <Link key={href + label} href={href}>
                    <a
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
                      style={{
                        color: isActive(href) ? "#93c5fd" : "#64748b",
                        background: isActive(href) ? "rgba(59,130,246,0.12)" : "transparent",
                        border: isActive(href) ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive(href)) {
                          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                          (e.currentTarget as HTMLElement).style.color = "#94a3b8";
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
        <div className="relative z-10 p-3 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-xs font-medium truncate">{user?.name}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded ${roleBadgeClass}`}>
                  {user?.role}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-slate-500 hover:text-red-400"
                onClick={handleLogout}
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-8 text-slate-500 hover:text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center z-20 transition-colors"
          style={{
            background: "#1a1f2e",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#64748b",
          }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
