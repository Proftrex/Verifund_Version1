import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Home from "@/pages/home";
import Campaigns from "@/pages/campaigns";
import BrowseCampaigns from "@/pages/browse-campaigns";
import CampaignDetail from "@/pages/campaign-detail";
import CreateCampaign from "@/pages/create-campaign";
import ProfileVerification from "@/pages/profile-verification";
import Admin from "@/pages/admin";
import Support from "@/pages/support";
import Volunteer from "@/pages/volunteer";
import MyProfile from "@/pages/my-profile";
import UserProfile from "@/pages/user-profile";
import VolunteerApplications from "@/pages/volunteer-applications";
import AcceptSupportInvite from "@/pages/accept-support-invite";
import PaymentSuccess from "@/pages/payment-success";
import PaymentCancel from "@/pages/payment-cancel";
import SupportTicketForm from "@/pages/support-ticket-form";
import NotificationsPage from "@/pages/notifications";
import NotFound from "@/pages/not-found";
import { AdminRoute } from "@/components/AdminRoute";

function Router() {
  const { isAuthenticated, isLoading, error, user } = useAuth();

  console.log('Router state:', { isAuthenticated, isLoading, user: !!user });
  
  // If we're loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes always available */}
      <Route path="/login" component={Login} />
      <Route path="/support/tickets/new" component={SupportTicketForm} />
      <Route path="/accept-support-invite/:token" component={AcceptSupportInvite} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/cancel" component={PaymentCancel} />
      
      {/* Main routes based on authentication */}
      <Route path="/" component={isAuthenticated ? Home : Landing} />
      <Route path="/browse-campaigns" component={isAuthenticated ? BrowseCampaigns : Landing} />
      <Route path="/campaigns" component={isAuthenticated ? Campaigns : Landing} />
      <Route path="/campaigns/:id" component={isAuthenticated ? CampaignDetail : Landing} />
      <Route path="/create-campaign" component={isAuthenticated ? CreateCampaign : Landing} />
      <Route path="/volunteer" component={isAuthenticated ? Volunteer : Landing} />
      <Route path="/my-profile" component={isAuthenticated ? MyProfile : Landing} />
      <Route path="/profile" component={isAuthenticated ? MyProfile : Landing} />
      <Route path="/profile/:userId" component={isAuthenticated ? UserProfile : Landing} />
      <Route path="/profile-verification" component={isAuthenticated ? ProfileVerification : Landing} />
      <Route path="/volunteer-applications" component={isAuthenticated ? VolunteerApplications : Landing} />
      <Route path="/myopportunities" component={isAuthenticated ? VolunteerApplications : Landing} />
      <Route path="/campaignopportunities" component={isAuthenticated ? BrowseCampaigns : Landing} />
      <Route path="/notifications" component={isAuthenticated ? NotificationsPage : Landing} />
      <Route path="/admin" component={isAuthenticated ? () => <AdminRoute><Admin /></AdminRoute> : Landing} />
      <Route path="/admin/users/:userId" component={isAuthenticated ? () => <AdminRoute><UserProfile /></AdminRoute> : Landing} />
      <Route path="/support" component={isAuthenticated ? () => <AdminRoute><Support /></AdminRoute> : Landing} />
      
      {/* Catch all route */}
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
