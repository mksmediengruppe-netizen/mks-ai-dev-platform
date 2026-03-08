/* ============================================================
   DashboardPage — Professional Light theme
   Stats overview, activity feed, M6 modules status
   ============================================================ */

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Bot, Zap, FileText, Globe, TrendingUp, Activity, CheckCircle2, Clock, MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const STATS = [
  { icon: Bot, label: "AI Requests Today", value: "1,247", trend: "+12%", iconBg: "bg-blue-50", iconColor: "text-blue-600", trendColor: "text-emerald-600 bg-emerald-50" },
  { icon: Zap, label: "Automations Run", value: "89", trend: "+5%", iconBg: "bg-purple-50", iconColor: "text-purple-600", trendColor: "text-emerald-600 bg-emerald-50" },
  { icon: FileText, label: "Artifacts Created", value: "342", trend: "+28%", iconBg: "bg-emerald-50", iconColor: "text-emerald-600", trendColor: "text-emerald-600 bg-emerald-50" },
  { icon: Globe, label: "Sites Analyzed", value: "17", trend: "+3", iconBg: "bg-amber-50", iconColor: "text-amber-600", trendColor: "text-emerald-600 bg-emerald-50" },
];

const RECENT_ACTIVITY = [
  { icon: CheckCircle2, text: "n8n workflow generated for CRM integration", time: "2 min ago", iconColor: "text-emerald-500", iconBg: "bg-emerald-50" },
  { icon: Bot, text: "Bitrix24 entity mapper completed", time: "8 min ago", iconColor: "text-blue-500", iconBg: "bg-blue-50" },
  { icon: FileText, text: "PRD document created for e-commerce project", time: "15 min ago", iconColor: "text-purple-500", iconBg: "bg-purple-50" },
  { icon: Globe, text: "CMS discovery: WordPress 6.4 detected on blacksart.ru", time: "23 min ago", iconColor: "text-amber-500", iconBg: "bg-amber-50" },
  { icon: Zap, text: "Design profile created: light_saas / dashboard", time: "31 min ago", iconColor: "text-cyan-500", iconBg: "bg-cyan-50" },
  { icon: CheckCircle2, text: "Visual QA review: 87/100 score, approved", time: "45 min ago", iconColor: "text-emerald-500", iconBg: "bg-emerald-50" },
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
      {/* Page header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b border-slate-100 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
            Dashboard
          </h1>
          <p className="text-slate-500 text-xs">
            Welcome back, <span className="font-medium text-slate-700">{user?.name?.split(" ")[0] || "User"}</span>
          </p>
        </div>
        <Link href="/chat">
          <a>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              New Chat
            </button>
          </a>
        </Link>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          {STATS.map(({ icon: Icon, label, value, trend, iconBg, iconColor, trendColor }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
                  <Icon className={`w-4.5 h-4.5 ${iconColor}`} style={{ width: "18px", height: "18px" }} />
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trendColor}`}>
                  {trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                {value}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <h2 className="text-slate-700 text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  Recent Activity
                </h2>
              </div>
              <Link href="/artifacts">
                <a className="flex items-center gap-1 text-blue-600 text-xs font-medium hover:underline">
                  View all <ArrowRight className="w-3 h-3" />
                </a>
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {RECENT_ACTIVITY.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                    <div className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 text-xs leading-relaxed">{item.text}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-400 text-xs">{item.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* M6 Modules Status */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <h2 className="text-slate-700 text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                M6 Modules Status
              </h2>
            </div>
            <div className="divide-y divide-slate-50">
              {M6_MODULES.map((mod) => (
                <div key={mod.name} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">{mod.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs">{mod.endpoints} endpoints</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                      {mod.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-500">Total endpoints active</span>
                <span className="text-slate-800 font-bold">48</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
