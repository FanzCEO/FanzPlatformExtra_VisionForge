import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Feed from "@/pages/Feed";
import Profile from "@/pages/Profile";
import CreatorDashboard from "@/pages/CreatorDashboard";
import LiveStream from "@/pages/LiveStream";
import Subscribe from "@/pages/Subscribe";
import Community from "@/pages/Community";
import Messages from "@/pages/Messages";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Feed} />
          <Route path="/profile/:username" component={Profile} />
          <Route path="/dashboard" component={CreatorDashboard} />
          <Route path="/live" component={LiveStream} />
          <Route path="/subscribe/:creatorId" component={Subscribe} />
          <Route path="/community" component={Community} />
          <Route path="/messages" component={Messages} />
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
