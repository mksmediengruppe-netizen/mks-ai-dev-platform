/* ============================================================
   SettingsPage — Professional Light theme
   API config, platform info, user preferences
   ============================================================ */

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Server, Info, CheckCircle2, XCircle, Loader2, Shield, Bell } from "lucide-react";
import { toast } from "sonner";

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
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
        {/* Header */}
        <div className="flex items-center gap-2 px-6 py-4 bg-white border-b border-slate-100 flex-shrink-0">
          <Settings className="w-4 h-4 text-blue-500" />
          <div>
            <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              Settings
            </h1>
            <p className="text-slate-500 text-xs">Platform configuration</p>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-2xl space-y-5">

            {/* API Configuration */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
                <Server className="w-4 h-4 text-blue-500" />
                <h2 className="text-slate-700 text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  API Configuration
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-600 text-xs font-medium">API Base URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      className="flex-1 h-9 text-sm bg-slate-50 border-slate-200 text-slate-800"
                    />
                    <Button
                      onClick={checkApi}
                      disabled={apiStatus === "checking"}
                      variant="outline"
                      className="h-9 px-4 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      {apiStatus === "checking" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : "Test"}
                    </Button>
                  </div>
                  {apiStatus === "ok" && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      API is reachable
                    </div>
                  )}
                  {apiStatus === "error" && (
                    <div className="flex items-center gap-1.5 text-red-500 text-xs">
                      <XCircle className="w-3.5 h-3.5" />
                      Cannot reach API
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 text-xs font-medium">API Version</Label>
                  <Input
                    value="M6 Production"
                    readOnly
                    className="h-9 text-sm bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
                <Shield className="w-4 h-4 text-purple-500" />
                <h2 className="text-slate-700 text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  Security
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-600 text-xs font-medium">Current Password</Label>
                  <Input type="password" placeholder="••••••••" className="h-9 text-sm bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 text-xs font-medium">New Password</Label>
                  <Input type="password" placeholder="••••••••" className="h-9 text-sm bg-slate-50 border-slate-200" />
                </div>
                <Button
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white border-0"
                  onClick={() => toast.info("Feature coming soon")}
                >
                  Update Password
                </Button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
                <Bell className="w-4 h-4 text-amber-500" />
                <h2 className="text-slate-700 text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  Notifications
                </h2>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: "API errors", desc: "Notify when API returns errors" },
                  { label: "New artifacts", desc: "Notify when new artifacts are created" },
                  { label: "User activity", desc: "Notify on new user logins" },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-slate-700 text-sm font-medium">{label}</p>
                      <p className="text-slate-400 text-xs">{desc}</p>
                    </div>
                    <button
                      onClick={() => toast.info("Feature coming soon")}
                      className="w-10 h-5 rounded-full bg-blue-600 flex items-center justify-end pr-0.5 transition-colors"
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Info */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
                <Info className="w-4 h-4 text-slate-400" />
                <h2 className="text-slate-700 text-sm font-semibold" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
                  Platform Info
                </h2>
              </div>
              <div className="p-5 space-y-2">
                {[
                  { label: "Platform", value: "AI Dev Team Platform" },
                  { label: "Version", value: "Milestone 6 Production" },
                  { label: "Capabilities", value: "48 active endpoints" },
                  { label: "Modules", value: "M1–M6 + Addendum" },
                  { label: "Server", value: "2.56.240.170:8000" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-slate-500 text-xs">{label}</span>
                    <span className="text-slate-700 text-xs font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
