import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import AuthCallback from "@/pages/auth-callback";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/login" component={Login} />
      {isLoading ? (
        <Route path="/">
          <div className="min-h-screen flex items-center justify-center">
            <div>Loading...</div>
          </div>
        </Route>
      ) : isAuthenticated ? (
        <>
          <Route path="/" component={Home} />
        </>
      ) : (
        <>
          <Route path="/" component={Landing} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
