import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { MobileNav } from "@/components/MobileNav";
import { useServiceWorker } from "@/hooks/use-service-worker";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import TestView from "@/pages/TestView";
import Results from "@/pages/Results";
import Admin from "@/pages/Admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/test/:id" component={TestView} />
      <Route path="/results" component={Results} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [location] = useLocation();
  useServiceWorker();

  const isTestView = location.startsWith("/test/");

  return (
    <>
      {showSplash && (
        <ConnectionStatus onComplete={() => setShowSplash(false)} />
      )}
      <Toaster />
      <div className={isTestView ? "" : "pb-16 md:pb-0"}>
        <Router />
      </div>
      {!isTestView && <MobileNav />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
