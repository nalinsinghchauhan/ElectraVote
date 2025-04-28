import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminMembers from "@/pages/admin/members";
import AdminElections from "@/pages/admin/elections";
import AdminSettings from "@/pages/admin/settings";
import AdminElectionResults from "@/pages/admin/election-results";
import MemberDashboard from "@/pages/member/dashboard";
import MemberElections from "@/pages/member/elections";
import MemberElectionResults from "@/pages/member/election-results";
import Profile from "@/pages/profile";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} adminOnly={true} />
      <ProtectedRoute path="/admin/members" component={AdminMembers} adminOnly={true} />
      <ProtectedRoute path="/admin/elections" component={AdminElections} adminOnly={true} />
      <ProtectedRoute path="/admin/elections/:id/results" component={AdminElectionResults} adminOnly={true} />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} adminOnly={true} />
      
      {/* Member Routes */}
      <ProtectedRoute path="/member/dashboard" component={MemberDashboard} />
      <ProtectedRoute path="/member/elections" component={MemberElections} />
      <ProtectedRoute path="/member/elections/:id/results" component={MemberElectionResults} />
      
      {/* Common Routes */}
      <ProtectedRoute path="/profile" component={Profile} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background text-foreground">
              <Toaster />
              <Router />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
