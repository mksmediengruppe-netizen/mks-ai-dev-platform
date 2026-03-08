/* ============================================================
   DESIGN SYSTEM: Obsidian Glass — AI Dev Team Platform
   Dark glass morphism, blue/violet accent, sidebar layout
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

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/chat" component={() => <ProtectedRoute component={ChatPage} />} />
      <Route path="/artifacts" component={() => <ProtectedRoute component={ArtifactsPage} />} />
      <Route path="/users" component={() => <ProtectedRoute component={UsersPage} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
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
