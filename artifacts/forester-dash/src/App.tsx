import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { BottomNav } from "@/components/BottomNav";
import { AlertSystem } from "@/components/AlertSystem";
import Dashboard from "@/pages/Dashboard";
import Vehicle from "@/pages/Vehicle";
import Speedometer from "@/pages/Speedometer";
import Service from "@/pages/Service";
import Tyres from "@/pages/Tyres";
import Repairs from "@/pages/Repairs";
import Camping from "@/pages/Camping";
import Lighting from "@/pages/Lighting";
import Diagnostics from "@/pages/Diagnostics";
import Reminders from "@/pages/Reminders";
import Settings from "@/pages/Settings";
import Spotify from "@/pages/Spotify";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/vehicle" component={Vehicle} />
      <Route path="/speedometer" component={Speedometer} />
      <Route path="/service" component={Service} />
      <Route path="/tyres" component={Tyres} />
      <Route path="/repairs" component={Repairs} />
      <Route path="/camping" component={Camping} />
      <Route path="/lighting" component={Lighting} />
      <Route path="/diagnostics" component={Diagnostics} />
      <Route path="/reminders" component={Reminders} />
      <Route path="/settings" component={Settings} />
      <Route path="/spotify" component={Spotify} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AlertSystem />
          <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
            <Router />
            <BottomNav />
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
