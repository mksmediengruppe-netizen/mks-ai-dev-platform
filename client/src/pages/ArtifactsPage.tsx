/* ============================================================
   ArtifactsPage — Professional Light theme
   Documents, specs, schemas, workflows panel
   ============================================================ */

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { FileText, Code2, Database, Zap, Globe, Search, Download, Eye, Clock } from "lucide-react";

const ARTIFACTS = [
  { id: "1", type: "prd", title: "E-Commerce Platform PRD", project: "ShopBuilder", size: "12 KB", date: "2 hours ago", icon: FileText, iconBg: "bg-purple-50", iconColor: "text-purple-600", badgeBg: "bg-purple-50 text-purple-700 border-purple-100" },
  { id: "2", type: "workflow", title: "CRM Lead Notification Workflow", project: "n8n Automation", size: "4 KB", date: "3 hours ago", icon: Zap, iconBg: "bg-amber-50", iconColor: "text-amber-600", badgeBg: "bg-amber-50 text-amber-700 border-amber-100" },
  { id: "3", type: "schema", title: "User & Orders DB Schema", project: "ShopBuilder", size: "8 KB", date: "5 hours ago", icon: Database, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { id: "4", type: "code", title: "RBAC Auth Backend", project: "SaaS Platform", size: "24 KB", date: "1 day ago", icon: Code2, iconBg: "bg-blue-50", iconColor: "text-blue-600", badgeBg: "bg-blue-50 text-blue-700 border-blue-100" },
  { id: "5", type: "site", title: "blacksart.ru CMS Analysis", project: "Site Audit", size: "6 KB", date: "1 day ago", icon: Globe, iconBg: "bg-cyan-50", iconColor: "text-cyan-600", badgeBg: "bg-cyan-50 text-cyan-700 border-cyan-100" },
  { id: "6", type: "prd", title: "Tech Spec — API Gateway", project: "Platform M6", size: "18 KB", date: "2 days ago", icon: FileText, iconBg: "bg-purple-50", iconColor: "text-purple-600", badgeBg: "bg-purple-50 text-purple-700 border-purple-100" },
  { id: "7", type: "workflow", title: "Bitrix24 Entity Mapper", project: "CRM Integration", size: "9 KB", date: "2 days ago", icon: Zap, iconBg: "bg-amber-50", iconColor: "text-amber-600", badgeBg: "bg-amber-50 text-amber-700 border-amber-100" },
  { id: "8", type: "code", title: "Admin Dashboard UI Scaffold", project: "SaaS Platform", size: "31 KB", date: "3 days ago", icon: Code2, iconBg: "bg-blue-50", iconColor: "text-blue-600", badgeBg: "bg-blue-50 text-blue-700 border-blue-100" },
];

const TYPE_LABELS: Record<string, string> = {
  prd: "Document",
  workflow: "Workflow",
  schema: "Schema",
  code: "Code",
  site: "Site Report",
};

export default function ArtifactsPage() {
  const [search, setSearch] = useState("");
  const filtered = ARTIFACTS.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.project.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              Artifacts
            </h1>
            <p className="text-slate-500 text-xs">{filtered.length} items</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artifacts…"
              className="pl-9 h-8 text-xs bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-w-6xl">
            {filtered.map((art) => {
              const Icon = art.icon;
              return (
                <div
                  key={art.id}
                  className="group bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg ${art.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${art.iconColor}`} />
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-800 text-sm font-semibold mb-1 leading-snug"
                    style={{ fontFamily: "Geist, Inter, sans-serif" }}>{art.title}</p>
                  <p className="text-slate-400 text-xs mb-3">{art.project}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${art.badgeBg}`}>
                      {TYPE_LABELS[art.type]}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{art.date}</span>
                      <span className="text-xs">· {art.size}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
