import { useState } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { MobileNav } from "@/components/MobileNav";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import TestView from "@/pages/TestView";
import Results from "@/pages/Results";
import Admin from "@/pages/Admin";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Redirect to="/" />;
  }
  
  return <>{children}</>;
}

function Router() {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
        <Route path="/login">
          <AuthRoute>
            <AnimatedPage><Login /></AnimatedPage>
          </AuthRoute>
        </Route>
        <Route path="/register">
          <AuthRoute>
            <AnimatedPage><Register /></AnimatedPage>
          </AuthRoute>
        </Route>
        <Route path="/">
          <ProtectedRoute>
            <AnimatedPage><Home /></AnimatedPage>
          </ProtectedRoute>
        </Route>
        <Route path="/test/:id" component={TestView} />
        <Route path="/results">
          <ProtectedRoute>
            <AnimatedPage><Results /></AnimatedPage>
          </ProtectedRoute>
        </Route>
        <Route path="/admin">
          <ProtectedRoute>
            <AnimatedPage><Admin /></AnimatedPage>
          </ProtectedRoute>
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
  const { isAuthenticated } = useAuth();
  useServiceWorker();

  const isTestView = location.startsWith("/test/");
  const isAuthPage = location === "/login" || location === "/register";

  return (
    <>
      {showSplash && (
        <ConnectionStatus onComplete={() => setShowSplash(false)} />
      )}
      <Toaster />
      <div className={isTestView || isAuthPage ? "" : "pb-16 md:pb-0"}>
        <Router />
      </div>
      {!isTestView && !isAuthPage && isAuthenticated && <MobileNav />}
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
