/* ============================================================
   DashboardPage — Obsidian Glass stats overview
   ============================================================ */

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Bot, Zap, FileText, Globe, TrendingUp, Activity, CheckCircle2, Clock } from "lucide-react";

const STATS = [
  { icon: Bot, label: "AI Requests Today", value: "1,247", trend: "+12%", color: "#3b82f6" },
  { icon: Zap, label: "Automations Run", value: "89", trend: "+5%", color: "#8b5cf6" },
  { icon: FileText, label: "Artifacts Created", value: "342", trend: "+28%", color: "#10b981" },
  { icon: Globe, label: "Sites Analyzed", value: "17", trend: "+3", color: "#f59e0b" },
];

const RECENT_ACTIVITY = [
  { icon: CheckCircle2, text: "n8n workflow generated for CRM integration", time: "2 min ago", color: "#10b981" },
  { icon: Bot, text: "Bitrix24 entity mapper completed", time: "8 min ago", color: "#3b82f6" },
  { icon: FileText, text: "PRD document created for e-commerce project", time: "15 min ago", color: "#8b5cf6" },
  { icon: Globe, text: "CMS discovery: WordPress 6.4 detected on blacksart.ru", time: "23 min ago", color: "#f59e0b" },
  { icon: Zap, text: "Design profile created: dark_tech / saas_dashboard", time: "31 min ago", color: "#06b6d4" },
  { icon: CheckCircle2, text: "Visual QA review: 87/100 score, approved", time: "45 min ago", color: "#10b981" },
];

const M6_MODULES = [
  { name: "n8n Builder", endpoints: 7, status: "active" },
  { name: "Bitrix24 Builder", endpoints: 7, status: "active" },
  { name: "Business Site Ops", endpoints: 7, status: "active" },
  { name: "CMS Mastery", endpoints: 11, status: "active" },
  { name: "Visual Production QA", endpoints: 6, status: "active" },
  { name: "Design Profile Layer", endpoints: 10, status: "active" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6" style={{ background: "#0a0d14" }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1"
            style={{ fontFamily: "Geist, Inter, sans-serif", letterSpacing: "-0.02em" }}>
            Welcome back, {user?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-slate-500 text-sm">AI Dev Team Platform · Milestone 6 Production</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {STATS.map(({ icon: Icon, label, value, trend, color }) => (
            <div key={label} className="rounded-xl p-5 relative overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-4 translate-x-4"
                style={{ background: color, filter: "blur(20px)" }} />
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "#10b98118", color: "#10b981", border: "1px solid #10b98130" }}>
                  {trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-white mb-0.5"
                style={{ fontFamily: "Geist, Inter, sans-serif" }}>{value}</p>
              <p className="text-slate-500 text-xs">{label}</p>
            </div>
          ))}
        </div>

        {/* Two columns: Activity + M6 Modules */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="rounded-xl p-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4 text-blue-400" />
              <h2 className="text-white text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                Recent Activity
              </h2>
            </div>
            <div className="space-y-4">
              {RECENT_ACTIVITY.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-xs leading-relaxed">{item.text}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span className="text-slate-600 text-xs">{item.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* M6 Modules Status */}
          <div className="rounded-xl p-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              <h2 className="text-white text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                M6 Modules Status
              </h2>
            </div>
            <div className="space-y-3">
              {M6_MODULES.map((mod) => (
                <div key={mod.name} className="flex items-center justify-between py-2.5 px-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
                    <span className="text-slate-300 text-sm">{mod.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 text-xs">{mod.endpoints} endpoints</span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "#10b98115", color: "#10b981", border: "1px solid #10b98130" }}>
                      {mod.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Total endpoints</span>
                <span className="text-white font-semibold">48 active</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: "100%", background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
