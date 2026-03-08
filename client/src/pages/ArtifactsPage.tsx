/* ============================================================
   ArtifactsPage — Documents, specs, schemas, workflows panel
   ============================================================ */

import AppLayout from "@/components/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { FileText, Code2, Database, Zap, Globe, Search, Download, Eye, Clock } from "lucide-react";

const ARTIFACTS = [
  { id: "1", type: "prd", title: "E-Commerce Platform PRD", project: "ShopBuilder", size: "12 KB", date: "2 hours ago", icon: FileText, color: "#8b5cf6" },
  { id: "2", type: "workflow", title: "CRM Lead Notification Workflow", project: "n8n Automation", size: "4 KB", date: "3 hours ago", icon: Zap, color: "#f59e0b" },
  { id: "3", type: "schema", title: "User & Orders DB Schema", project: "ShopBuilder", size: "8 KB", date: "5 hours ago", icon: Database, color: "#10b981" },
  { id: "4", type: "code", title: "RBAC Auth Backend", project: "SaaS Platform", size: "24 KB", date: "1 day ago", icon: Code2, color: "#3b82f6" },
  { id: "5", type: "site", title: "blacksart.ru CMS Analysis", project: "Site Audit", size: "6 KB", date: "1 day ago", icon: Globe, color: "#06b6d4" },
  { id: "6", type: "prd", title: "Tech Spec — API Gateway", project: "Platform M6", size: "18 KB", date: "2 days ago", icon: FileText, color: "#8b5cf6" },
  { id: "7", type: "workflow", title: "Bitrix24 Entity Mapper", project: "CRM Integration", size: "9 KB", date: "2 days ago", icon: Zap, color: "#f59e0b" },
  { id: "8", type: "code", title: "Admin Dashboard UI Scaffold", project: "SaaS Platform", size: "31 KB", date: "3 days ago", icon: Code2, color: "#3b82f6" },
];

const TYPE_LABELS: Record<string, string> = {
  prd: "Document",
  workflow: "Workflow",
  schema: "Schema",
  code: "Code",
  site: "Site Report",
};

export default function ArtifactsPage() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col" style={{ background: "#0a0d14" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-14 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h1 className="text-white text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              Artifacts
            </h1>
            <p className="text-slate-500 text-xs">{ARTIFACTS.length} items</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <Input
              placeholder="Search artifacts…"
              className="pl-9 h-8 text-xs"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0" }}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-w-6xl">
            {ARTIFACTS.map((art) => {
              const Icon = art.icon;
              return (
                <div key={art.id} className="group rounded-xl p-4 transition-all cursor-pointer"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: `${art.color}18`, border: `1px solid ${art.color}30` }}>
                      <Icon className="w-4 h-4" style={{ color: art.color }} />
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-400 transition-colors"
                        style={{ background: "rgba(255,255,255,0.05)" }}>
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-green-400 transition-colors"
                        style={{ background: "rgba(255,255,255,0.05)" }}>
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-white text-sm font-medium mb-1 leading-snug"
                    style={{ fontFamily: "Geist, Inter, sans-serif" }}>{art.title}</p>
                  <p className="text-slate-500 text-xs mb-3">{art.project}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${art.color}15`, color: art.color, border: `1px solid ${art.color}25` }}>
                      {TYPE_LABELS[art.type]}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-600">
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
