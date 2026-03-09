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
import RoadmapPage from "./pages/RoadmapPage";
import BacklogPage from "./pages/BacklogPage";
import ArchitecturePage from "./pages/ArchitecturePage";
import ReleasesPage from "./pages/ReleasesPage";
import RisksPage from "./pages/RisksPage";
import ApprovalsPage from "./pages/ApprovalsPage";
// M9 pages
import PortfolioPage from "./pages/PortfolioPage";
import AutomationsPage from "./pages/AutomationsPage";
import BatchFactoryPage from "./pages/BatchFactoryPage";
import SearchPage from "./pages/SearchPage";
import ExportArchivePage from "./pages/ExportArchivePage";
import OperationalMetricsPage from "./pages/OperationalMetricsPage";
import AuditPage from "./pages/AuditPage";
import OperatorQueuePage from "./pages/OperatorQueuePage";
// M10 pages
import SchedulerPage from "./pages/SchedulerPage";
import HealthIntelligencePage from "./pages/HealthIntelligencePage";
import LiveUpdatesPage from "./pages/LiveUpdatesPage";
import EnterprisePage from "./pages/EnterprisePage";
import DeepImportPage from "./pages/DeepImportPage";

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
      <Route path="/chat/:id"         component={() => <ProtectedRoute component={ChatPage} />} />
      <Route path="/artifacts"       component={() => <ProtectedRoute component={ArtifactsPage} />} />
      <Route path="/users"           component={() => <ProtectedRoute component={UsersPage} />} />
      <Route path="/settings"        component={() => <ProtectedRoute component={SettingsPage} />} />
      {/* M7 routes */}
      <Route path="/memory"          component={() => <ProtectedRoute component={MemoryPage} />} />
      <Route path="/evaluation"      component={() => <ProtectedRoute component={EvaluationPage} />} />
      <Route path="/capability-gaps" component={() => <ProtectedRoute component={CapabilityGapsPage} />} />
      <Route path="/recovery"        component={() => <ProtectedRoute component={RecoveryPage} />} />
      <Route path="/known-issues"     component={() => <ProtectedRoute component={KnownIssuesPage} />} />
      {/* M8 routes */}
      <Route path="/roadmap"           component={() => <ProtectedRoute component={RoadmapPage} />} />
      <Route path="/backlog"           component={() => <ProtectedRoute component={BacklogPage} />} />
      <Route path="/architecture"      component={() => <ProtectedRoute component={ArchitecturePage} />} />
      <Route path="/releases"          component={() => <ProtectedRoute component={ReleasesPage} />} />
      <Route path="/risks"             component={() => <ProtectedRoute component={RisksPage} />} />
      <Route path="/approvals"         component={() => <ProtectedRoute component={ApprovalsPage} />} />
      {/* M9 routes */}
      <Route path="/portfolio"         component={() => <ProtectedRoute component={PortfolioPage} />} />
      <Route path="/automations"       component={() => <ProtectedRoute component={AutomationsPage} />} />
      <Route path="/batch-factory"     component={() => <ProtectedRoute component={BatchFactoryPage} />} />
      <Route path="/search"            component={() => <ProtectedRoute component={SearchPage} />} />
      <Route path="/export-archive"    component={() => <ProtectedRoute component={ExportArchivePage} />} />
      <Route path="/metrics"           component={() => <ProtectedRoute component={OperationalMetricsPage} />} />
      <Route path="/audit"             component={() => <ProtectedRoute component={AuditPage} />} />
      <Route path="/operator-queue"    component={() => <ProtectedRoute component={OperatorQueuePage} />} />
      {/* M10 routes */}
      <Route path="/scheduler"          component={() => <ProtectedRoute component={SchedulerPage} />} />
      <Route path="/health"             component={() => <ProtectedRoute component={HealthIntelligencePage} />} />
      <Route path="/live"               component={() => <ProtectedRoute component={LiveUpdatesPage} />} />
      <Route path="/enterprise"         component={() => <ProtectedRoute component={EnterprisePage} />} />
      <Route path="/deep-import"        component={() => <ProtectedRoute component={DeepImportPage} />} />
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
