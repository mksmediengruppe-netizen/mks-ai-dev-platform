/* ============================================================
   LoginPage — Obsidian Glass design
   Split layout: left brand panel | right login form
   ============================================================ */

import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Bot, Zap, Shield, Code2 } from "lucide-react";
import { toast } from "sonner";

const LOGIN_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663413127711/7myqqxjLrvciy6sPuXJuMu/login-bg-mhw4u5KhRp9PBNQD7QoNUW.webp";

const FEATURES = [
  { icon: Bot, label: "AI Dev Team", desc: "Autonomous agents for every task" },
  { icon: Zap, label: "n8n & Bitrix24", desc: "Workflow automation built-in" },
  { icon: Code2, label: "Full-Stack Builder", desc: "Apps, APIs, DBs in minutes" },
  { icon: Shield, label: "Role-Based Access", desc: "Admin, Operator, Viewer roles" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("admin@platform.local");
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
      navigate("/");
    } else {
      toast.error(result.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Brand Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #0a0e1a 0%, #0f1117 60%, #0d1230 100%)`,
        }}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${LOGIN_BG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/60 via-transparent to-violet-950/40" />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              AI Dev Team Platform
            </span>
          </div>
          <p className="text-blue-300/60 text-sm ml-12">Milestone 6 — Production</p>
        </div>

        <div className="relative z-10">
          <h1
            className="text-4xl font-bold mb-4 leading-tight"
            style={{
              fontFamily: "Geist, Inter, sans-serif",
              background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Your AI Engineering Team
          </h1>
          <p className="text-slate-400 text-base mb-10 leading-relaxed max-w-sm">
            Build, automate, and ship faster with an AI team that understands your stack, your CMS, and your business.
          </p>

          <div className="grid grid-cols-1 gap-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-slate-500 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-slate-600 text-xs">
          © 2026 AI Dev Team Platform · mksitdev.ru
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8"
        style={{ background: "#0f1117" }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              AI Dev Team Platform
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Geist, Inter, sans-serif", letterSpacing: "-0.02em" }}>
              Sign in
            </h2>
            <p className="text-slate-500 text-sm">Enter your credentials to access the platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@platform.local"
                className="h-11 text-sm"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e2e8f0",
                }}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 text-sm"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e2e8f0",
                }}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                border: "none",
                color: "white",
              }}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Test credentials hint */}
          <div className="mt-6 p-4 rounded-lg" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
            <p className="text-blue-400 text-xs font-medium mb-2">Test credentials</p>
            <div className="space-y-1 text-xs text-slate-500">
              <p><span className="text-slate-400">Admin:</span> admin@platform.local / admin123</p>
              <p><span className="text-slate-400">Operator:</span> operator@platform.local / op123</p>
              <p><span className="text-slate-400">Viewer:</span> viewer@platform.local / view123</p>
            </div>
          </div>

          <p className="text-center text-slate-600 text-xs mt-6">
            AI Dev Team Platform · M6 Release
          </p>
        </div>
      </div>
    </div>
  );
}
