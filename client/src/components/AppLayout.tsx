/* ============================================================
   AppLayout — Professional Light sidebar + main content
   MOBILE: hamburger menu, overlay, collapsible sidebar
   DESKTOP: persistent sidebar with collapse toggle
   ============================================================ */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Bot, LayoutDashboard, MessageSquare, FileText,
  Users, Settings, LogOut, ChevronLeft, ChevronRight,
  Zap, Code2, Globe, Brain, BarChart2, Puzzle, ShieldCheck,
  AlertTriangle, Menu, X, Map, ListTodo, Cpu, Rocket, ShieldAlert, ClipboardCheck
} from "lucide-react";
import { toast } from "sonner";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard",      href: "/dashboard" },
  { icon: MessageSquare,   label: "Chat Workspace", href: "/chat" },
  { icon: FileText,        label: "Artifacts",      href: "/artifacts" },
  { icon: Zap,             label: "Automations",    href: "/chat" },
  { icon: Code2,           label: "Builder",        href: "/chat" },
  { icon: Globe,           label: "Sites",          href: "/chat" },
];

const M7_NAV: NavItem[] = [
  { icon: Brain,          label: "Memory",          href: "/memory" },
  { icon: BarChart2,      label: "Evaluation",      href: "/evaluation" },
  { icon: Puzzle,         label: "Capability Gaps", href: "/capability-gaps" },
  { icon: ShieldCheck,    label: "Recovery",        href: "/recovery" },
  { icon: AlertTriangle,  label: "Known Issues",    href: "/known-issues" },
];

const M8_NAV: NavItem[] = [
  { icon: Map,             label: "Roadmap",      href: "/roadmap" },
  { icon: ListTodo,        label: "Backlog",       href: "/backlog" },
  { icon: Cpu,             label: "Architecture",  href: "/architecture" },
  { icon: Rocket,          label: "Releases",      href: "/releases" },
  { icon: ShieldAlert,     label: "Risks & Costs", href: "/risks" },
  { icon: ClipboardCheck,  label: "Approvals",     href: "/approvals" },
];

const ADMIN_NAV: NavItem[] = [
  { icon: Users,    label: "Users",    href: "/users",    roles: ["admin"] },
  { icon: Settings, label: "Settings", href: "/settings", roles: ["admin", "operator"] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [isMobile, setIsMobile]       = useState(false);
  const [location] = useLocation();
  const { user, logout, hasRole } = useAuth();

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard" && location === "/") return true;
    if (location === href) return true;
    if (href !== "/dashboard" && href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  const roleBadgeClass = user?.role === "admin"
    ? "role-admin"
    : user?.role === "operator"
    ? "role-operator"
    : "role-viewer";

  const sidebarWidth = isMobile ? "280px" : collapsed ? "60px" : "240px";

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    const showLabel = isMobile || !collapsed;
    return (
      <Link href={item.href}>
        <a
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-100"
          style={{
            color:      active ? "#2563eb" : "#64748b",
            background: active ? "#eff6ff" : "transparent",
            fontWeight: active ? 500 : 400,
          }}
          onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; (e.currentTarget as HTMLElement).style.color = "#334155"; } }}
          onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#64748b"; } }}
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          {showLabel && <span className="truncate">{item.label}</span>}
        </a>
      </Link>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center h-14 px-4 flex-shrink-0 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        {(isMobile || !collapsed) && (
          <div className="ml-3 overflow-hidden flex-1">
            <p className="text-slate-800 text-sm font-bold leading-tight truncate"
              style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              AI Dev Team
            </p>
            <p className="text-slate-400 text-xs">Platform M8</p>
          </div>
        )}
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(item => <NavLink key={item.href + item.label} item={item} />)}

        {/* Intelligence section */}
        <>
          {(isMobile || !collapsed) && (
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider px-3 pt-4 pb-1">
              Intelligence
            </p>
          )}
          {M7_NAV.map(item => <NavLink key={item.href} item={item} />)}
        </>

        {/* CTO Layer section */}
        <>
          {(isMobile || !collapsed) && (
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider px-3 pt-4 pb-1">
              CTO Layer
            </p>
          )}
          {M8_NAV.map(item => <NavLink key={item.href} item={item} />)}
        </>

        {/* Admin section */}
        {ADMIN_NAV.some(item => !item.roles || item.roles.some(r => hasRole(r as any))) && (
          <>
            {(isMobile || !collapsed) && (
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider px-3 pt-4 pb-1">
                Admin
              </p>
            )}
            {ADMIN_NAV.map(item => {
              if (item.roles && !item.roles.some(r => hasRole(r as any))) return null;
              return <NavLink key={item.href + item.label} item={item} />;
            })}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 flex-shrink-0 border-t border-slate-100">
        {(isMobile || !collapsed) ? (
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
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop persistent, mobile slide-in */}
      {isMobile ? (
        <aside
          className="fixed top-0 left-0 h-full flex flex-col bg-white z-40 transition-transform duration-250"
          style={{
            width: sidebarWidth,
            transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
            borderRight: "1px solid #e2e8f0",
            boxShadow: mobileOpen ? "4px 0 24px rgba(0,0,0,0.12)" : "none",
          }}
        >
          <SidebarContent />
        </aside>
      ) : (
        <aside
          className="flex flex-col flex-shrink-0 transition-all duration-200 relative bg-white"
          style={{
            width: sidebarWidth,
            borderRight: "1px solid #e2e8f0",
            boxShadow: "1px 0 0 0 #f1f5f9",
          }}
        >
          <SidebarContent />
          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center z-20 transition-colors bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 shadow-sm"
          >
            {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col bg-slate-50 min-w-0">
        {/* Mobile top bar */}
        {isMobile && (
          <div className="flex items-center h-14 px-4 bg-white border-b border-slate-100 flex-shrink-0 gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-slate-700 text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                AI Dev Team
              </span>
            </div>
            <div className="ml-auto">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
