/* ============================================================
   SettingsPage — API config, platform info, user preferences
   ============================================================ */

import AppLayout from "@/components/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Server, Key, Info, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://2.56.240.170:8000";

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState(API_BASE);
  const [apiStatus, setApiStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");

  const checkApi = async () => {
    setApiStatus("checking");
    try {
      const res = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(5000) });
      setApiStatus(res.ok ? "ok" : "error");
    } catch {
      setApiStatus("error");
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col" style={{ background: "#0a0d14" }}>
        <div className="flex items-center gap-2 px-6 h-14 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Settings className="w-4 h-4 text-blue-400" />
          <h1 className="text-white text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
            Settings
          </h1>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-2xl space-y-6">
            {/* API Configuration */}
            <div className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Server className="w-4 h-4 text-blue-400" />
                <h2 className="text-white text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  API Configuration
                </h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">API Base URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      className="flex-1 h-9 text-sm"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}
                    />
                    <Button
                      onClick={checkApi}
                      className="h-9 px-4 text-xs"
                      style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd" }}
                    >
                      {apiStatus === "checking" ? "Checking…" : "Test"}
                    </Button>
                  </div>
                  {apiStatus === "ok" && (
                    <p className="text-green-400 text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> API is reachable
                    </p>
                  )}
                  {apiStatus === "error" && (
                    <p className="text-red-400 text-xs">⚠ Cannot reach API. Check URL and server status.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Platform Info */}
            <div className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-violet-400" />
                <h2 className="text-white text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  Platform Information
                </h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Version", value: "Milestone 6 (M6)" },
                  { label: "API Modules", value: "48 endpoints active" },
                  { label: "Sub-stages", value: "M6.1 n8n · M6.2 Bitrix24 · M6.3 Site Ops · M6.4 CMS · M6.5 Visual QA · M6.7 Design Profile" },
                  { label: "Server", value: "2.56.240.170 (Docker)" },
                  { label: "Domain", value: "app.mksitdev.ru (Nginx + HTTPS)" },
                  { label: "Auth", value: "JWT · Roles: admin, operator, viewer" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between py-2"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-slate-500 text-xs">{label}</span>
                    <span className="text-slate-300 text-xs text-right max-w-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-4 h-4 text-amber-400" />
                <h2 className="text-white text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  Security
                </h2>
              </div>
              <Button
                className="h-9 text-xs"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
                onClick={() => toast.info("Feature coming soon")}
              >
                Change Password
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
