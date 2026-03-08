/* ============================================================
   LoginPage — Professional Light theme
   Split layout: left brand panel (blue gradient) | right form
   ============================================================ */

import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Bot, Zap, Shield, Code2 } from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
  { icon: Bot, label: "AI Dev Team", desc: "Autonomous agents for every task" },
  { icon: Zap, label: "n8n & Bitrix24", desc: "Workflow automation built-in" },
  { icon: Code2, label: "Full-Stack Builder", desc: "Apps, APIs, DBs in minutes" },
  { icon: Shield, label: "Role-Based Access", desc: "Admin, Operator, Viewer roles" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    } else {
      toast.error(result.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left: Brand Panel */}
      <div
        className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #1e40af 0%, #2563eb 40%, #3b82f6 100%)",
        }}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                              radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-20"
          style={{ background: "white", filter: "blur(80px)" }} />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full opacity-15"
          style={{ background: "#93c5fd", filter: "blur(60px)" }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              AI Dev Team
            </span>
          </div>
          <p className="text-blue-200/70 text-xs ml-12">Platform · Milestone 7</p>
        </div>

        {/* Main content */}
        <div className="relative z-10">
          <h1
            className="text-4xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: "Geist, Inter, sans-serif", letterSpacing: "-0.03em" }}
          >
            Your AI Engineering Team
          </h1>
          <p className="text-blue-100/80 text-base mb-10 leading-relaxed max-w-sm">
            Build, automate, and ship faster with an AI team that understands your stack, your CMS, and your business.
          </p>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/15 border border-white/20">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{label}</p>
                  <p className="text-blue-200/70 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-blue-200/50 text-xs">
          © 2026 AI Dev Team Platform · mksitdev.ru
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-800 font-bold text-lg" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              AI Dev Team Platform
            </span>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900 mb-1"
                style={{ fontFamily: "Geist, Inter, sans-serif", letterSpacing: "-0.02em" }}>
                Sign in
              </h2>
              <p className="text-slate-500 text-sm">Enter your credentials to access the platform</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-700 text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@platform.local"
                  className="h-10 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-700 text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white border-0"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-slate-400 text-xs mt-5">
            AI Dev Team Platform · M7 Release
          </p>
        </div>
      </div>
    </div>
  );
}
