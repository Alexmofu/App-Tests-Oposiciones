import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { MobileNav } from "@/components/MobileNav";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { motion, AnimatePresence } from "framer-motion";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import TestView from "@/pages/TestView";
import Results from "@/pages/Results";
import Admin from "@/pages/Admin";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -8 }
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.2
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

function Router() {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
        <Route path="/">
          <AnimatedPage><Home /></AnimatedPage>
        </Route>
        <Route path="/test/:id" component={TestView} />
        <Route path="/results">
          <AnimatedPage><Results /></AnimatedPage>
        </Route>
        <Route path="/admin">
          <AnimatedPage><Admin /></AnimatedPage>
        </Route>
        <Route>
          <AnimatedPage><NotFound /></AnimatedPage>
        </Route>
      </Switch>
    </AnimatePresence>
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
