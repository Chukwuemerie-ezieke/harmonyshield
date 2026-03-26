import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import Dashboard from "@/pages/dashboard";
import Compliance from "@/pages/compliance";
import ThreatMonitor from "@/pages/threat-monitor";
import Training from "@/pages/training";
import IncidentResponse from "@/pages/incident-response";
import Reports from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/compliance" component={Compliance} />
      <Route path="/threats" component={ThreatMonitor} />
      <Route path="/training" component={Training} />
      <Route path="/incidents" component={IncidentResponse} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3rem",
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={sidebarStyle as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-w-0">
              <header className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-30">
                <div className="flex items-center gap-2">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">
                    EdTech Cybersecurity Suite
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                </div>
              </header>
              <main className="flex-1 overflow-y-auto">
                <Router hook={useHashLocation}>
                  <AppRouter />
                </Router>
                <PerplexityAttribution />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
