/* ============================================================
   DESIGN SYSTEM: Professional Light — AI Dev Team Platform
   Clean SaaS dashboard: white/slate palette, blue accent,
   sidebar layout, crisp typography (Geist + Inter)
   ============================================================ */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import ArtifactsPage from "./pages/ArtifactsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import DashboardPage from "./pages/DashboardPage";
import MemoryPage from "./pages/MemoryPage";
import EvaluationPage from "./pages/EvaluationPage";
import CapabilityGapsPage from "./pages/CapabilityGapsPage";
import RecoveryPage from "./pages/RecoveryPage";
import KnownIssuesPage from "./pages/KnownIssuesPage";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/dashboard"       component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/chat"            component={() => <ProtectedRoute component={ChatPage} />} />
      <Route path="/artifacts"       component={() => <ProtectedRoute component={ArtifactsPage} />} />
      <Route path="/users"           component={() => <ProtectedRoute component={UsersPage} />} />
      <Route path="/settings"        component={() => <ProtectedRoute component={SettingsPage} />} />
      {/* M7 routes */}
      <Route path="/memory"          component={() => <ProtectedRoute component={MemoryPage} />} />
      <Route path="/evaluation"      component={() => <ProtectedRoute component={EvaluationPage} />} />
      <Route path="/capability-gaps" component={() => <ProtectedRoute component={CapabilityGapsPage} />} />
      <Route path="/recovery"        component={() => <ProtectedRoute component={RecoveryPage} />} />
      <Route path="/known-issues"     component={() => <ProtectedRoute component={KnownIssuesPage} />} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
