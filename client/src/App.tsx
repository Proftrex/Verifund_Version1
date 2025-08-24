import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
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
import VolunteerApplications from "@/pages/volunteer-applications";
import AcceptSupportInvite from "@/pages/accept-support-invite";
import PaymentSuccess from "@/pages/payment-success";
import PaymentCancel from "@/pages/payment-cancel";
import SupportTicketForm from "@/pages/support-ticket-form";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, error } = useAuth();

  // If we're loading or have a temporary error, show loading state instead of redirecting
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/browse-campaigns" component={BrowseCampaigns} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/campaigns/:id" component={CampaignDetail} />
          <Route path="/create-campaign" component={CreateCampaign} />
          <Route path="/volunteer" component={Volunteer} />
          <Route path="/my-profile" component={MyProfile} />
          <Route path="/volunteer-applications" component={VolunteerApplications} />
          <Route path="/admin" component={Admin} />
          <Route path="/support" component={Support} />
          <Route path="/support/tickets/new" component={SupportTicketForm} />
        </>
      )}
      {/* Profile verification should be accessible to all authenticated users */}
      {isAuthenticated && <Route path="/profile-verification" component={ProfileVerification} />}
      {/* Support invitation acceptance page */}
      <Route path="/accept-support-invite/:token" component={AcceptSupportInvite} />
      {/* Payment pages should be accessible to all users */}
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/cancel" component={PaymentCancel} />
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
