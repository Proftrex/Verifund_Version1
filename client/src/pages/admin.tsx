import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Flag, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Eye,
  Shield,
  FileText,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import type { Campaign, User } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("campaigns");

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    if (!isLoading && isAuthenticated && !user?.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Fetch admin data
  const { data: pendingCampaigns } = useQuery({
    queryKey: ["/api/admin/campaigns/pending"],
    enabled: !!user?.isAdmin,
    retry: false,
  });

  const { data: pendingKyc } = useQuery({
    queryKey: ["/api/admin/kyc/pending"],
    enabled: !!user?.isAdmin,
    retry: false,
  });

  const { data: allCampaigns } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: () => fetch("/api/campaigns").then(res => res.json()),
    enabled: !!user?.isAdmin,
  });

  const { data: pendingDeposits } = useQuery({
    queryKey: ["/api/admin/transactions/deposits/pending"],
    enabled: !!user?.isAdmin,
    retry: false,
  });

  const { data: pendingWithdrawals } = useQuery({
    queryKey: ["/api/admin/transactions/withdrawals/pending"],
    enabled: !!user?.isAdmin,
    retry: false,
  });

  // Mutations
  const approveCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest("POST", `/api/admin/campaigns/${campaignId}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "Campaign Approved", description: "Campaign has been approved and is now active." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to approve campaign.", variant: "destructive" });
    },
  });

  const rejectCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest("POST", `/api/admin/campaigns/${campaignId}/reject`, {});
    },
    onSuccess: () => {
      toast({ title: "Campaign Rejected", description: "Campaign has been rejected." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to reject campaign.", variant: "destructive" });
    },
  });

  const flagCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest("POST", `/api/admin/campaigns/${campaignId}/flag`, {});
    },
    onSuccess: () => {
      toast({ title: "Campaign Flagged", description: "Campaign has been flagged for review." });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to flag campaign.", variant: "destructive" });
    },
  });

  const approveKycMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/kyc/${userId}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "KYC Approved", description: "User KYC has been approved." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/pending"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to approve KYC.", variant: "destructive" });
    },
  });

  const rejectKycMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/kyc/${userId}/reject`, {});
    },
    onSuccess: () => {
      toast({ title: "KYC Rejected", description: "User KYC has been rejected." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/pending"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to reject KYC.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading admin panel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  const activeCampaigns = allCampaigns?.filter((c: Campaign) => c.status === "active") || [];
  const flaggedCampaigns = allCampaigns?.filter((c: Campaign) => c.status === "flagged") || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-red-800 mb-2" data-testid="text-admin-title">
                Admin Control Panel
              </h1>
              <p className="text-lg text-muted-foreground">
                Monitor and manage platform operations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Last login: <span data-testid="text-last-login">{new Date().toLocaleString()}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-800" data-testid="stat-pending-campaigns">
                    {pendingCampaigns?.length || 0}
                  </div>
                  <div className="text-sm text-blue-600">Pending Campaigns</div>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-800" data-testid="stat-active-campaigns">
                    {activeCampaigns.length}
                  </div>
                  <div className="text-sm text-green-600">Active Campaigns</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-800" data-testid="stat-flagged-campaigns">
                    {flaggedCampaigns.length}
                  </div>
                  <div className="text-sm text-red-600">Flagged Campaigns</div>
                </div>
                <Flag className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-800" data-testid="stat-pending-kyc">
                    {pendingKyc?.length || 0}
                  </div>
                  <div className="text-sm text-yellow-600">KYC Pending</div>
                </div>
                <Shield className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="kyc" data-testid="tab-kyc">KYC</TabsTrigger>
            <TabsTrigger value="deposits" data-testid="tab-deposits">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals" data-testid="tab-withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="fraud" data-testid="tab-fraud">Fraud</TabsTrigger>
            <TabsTrigger value="financial" data-testid="tab-financial">Financial</TabsTrigger>
          </TabsList>

          {/* Campaign Review Tab */}
          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Pending Campaign Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingCampaigns && pendingCampaigns.length > 0 ? (
                    pendingCampaigns.map((campaign: Campaign) => (
                      <div 
                        key={campaign.id}
                        className="border rounded-lg p-4"
                        data-testid={`pending-campaign-${campaign.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2" data-testid={`campaign-title-${campaign.id}`}>
                              {campaign.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2" data-testid={`campaign-description-${campaign.id}`}>
                              {campaign.description.slice(0, 200)}...
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>Goal: ₱{parseFloat(campaign.goalAmount).toLocaleString()}</span>
                              <span>Category: {campaign.category}</span>
                              <span>Duration: {campaign.duration} days</span>
                              <span>Submitted: {new Date(campaign.createdAt!).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button 
                              size="sm"
                              onClick={() => approveCampaignMutation.mutate(campaign.id)}
                              disabled={approveCampaignMutation.isPending}
                              data-testid={`button-approve-${campaign.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectCampaignMutation.mutate(campaign.id)}
                              disabled={rejectCampaignMutation.isPending}
                              data-testid={`button-reject-${campaign.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              data-testid={`button-review-${campaign.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                      <p className="text-muted-foreground">No pending campaigns to review.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYC Verification Tab */}
          <TabsContent value="kyc">
            <Card>
              <CardHeader>
                <CardTitle>Pending KYC Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingKyc && pendingKyc.length > 0 ? (
                    pendingKyc.map((kycUser: User) => (
                      <div 
                        key={kycUser.id}
                        className="border rounded-lg p-4"
                        data-testid={`pending-kyc-${kycUser.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2" data-testid={`kyc-user-name-${kycUser.id}`}>
                              {kycUser.firstName} {kycUser.lastName}
                            </h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div>Email: {kycUser.email}</div>
                              <div>Status: {kycUser.kycStatus}</div>
                              <div>Submitted: {new Date(kycUser.createdAt!).toLocaleDateString()}</div>
                            </div>
                            {kycUser.kycDocuments && (
                              <div className="mt-2">
                                <span className="text-sm font-medium">Documents:</span>
                                <div className="text-sm text-muted-foreground">
                                  {Object.keys(JSON.parse(kycUser.kycDocuments)).join(", ")}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button 
                              size="sm"
                              onClick={() => approveKycMutation.mutate(kycUser.id)}
                              disabled={approveKycMutation.isPending}
                              data-testid={`button-approve-kyc-${kycUser.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectKycMutation.mutate(kycUser.id)}
                              disabled={rejectKycMutation.isPending}
                              data-testid={`button-reject-kyc-${kycUser.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              data-testid={`button-view-documents-${kycUser.id}`}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View Docs
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">All Verified!</h3>
                      <p className="text-muted-foreground">No pending KYC verifications.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deposit Management Tab */}
          <TabsContent value="deposits">
            <Card>
              <CardHeader>
                <CardTitle>Deposit Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingDeposits && pendingDeposits.length > 0 ? (
                    pendingDeposits.map((deposit: any) => (
                      <div 
                        key={deposit.id}
                        className="border rounded-lg p-4"
                        data-testid={`pending-deposit-${deposit.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2" data-testid={`deposit-id-${deposit.id}`}>
                              Deposit #{deposit.id.slice(0, 8)}...
                            </h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div>Amount: ₱{parseFloat(deposit.amount).toLocaleString()}</div>
                              <div>User ID: {deposit.userId}</div>
                              <div>Payment Provider: {deposit.paymentProvider}</div>
                              <div>Exchange Rate: {deposit.exchangeRate}</div>
                              <div>Submitted: {new Date(deposit.createdAt).toLocaleString()}</div>
                              <div>Description: {deposit.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button 
                              size="sm"
                              onClick={() => {
                                // Add approve transaction mutation here
                                console.log('Approve deposit:', deposit.id);
                              }}
                              data-testid={`button-approve-deposit-${deposit.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                // Add reject transaction mutation here
                                console.log('Reject deposit:', deposit.id);
                              }}
                              data-testid={`button-reject-deposit-${deposit.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              data-testid={`button-view-deposit-${deposit.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <CreditCard className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">All Deposits Processed!</h3>
                      <p className="text-muted-foreground">No pending deposits to review.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawal Management Tab */}
          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingWithdrawals && pendingWithdrawals.length > 0 ? (
                    pendingWithdrawals.map((withdrawal: any) => (
                      <div 
                        key={withdrawal.id}
                        className="border rounded-lg p-4"
                        data-testid={`pending-withdrawal-${withdrawal.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2" data-testid={`withdrawal-id-${withdrawal.id}`}>
                              Withdrawal #{withdrawal.id.slice(0, 8)}...
                            </h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div>Amount: ₱{parseFloat(withdrawal.amount).toLocaleString()}</div>
                              <div>User ID: {withdrawal.userId}</div>
                              <div>Exchange Rate: {withdrawal.exchangeRate}</div>
                              <div>Fee Amount: ₱{parseFloat(withdrawal.feeAmount || '0').toLocaleString()}</div>
                              <div>Submitted: {new Date(withdrawal.createdAt).toLocaleString()}</div>
                              <div>Description: {withdrawal.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button 
                              size="sm"
                              onClick={() => {
                                // Add approve withdrawal mutation here
                                console.log('Approve withdrawal:', withdrawal.id);
                              }}
                              data-testid={`button-approve-withdrawal-${withdrawal.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                // Add reject withdrawal mutation here
                                console.log('Reject withdrawal:', withdrawal.id);
                              }}
                              data-testid={`button-reject-withdrawal-${withdrawal.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              data-testid={`button-view-withdrawal-${withdrawal.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <ArrowUpRight className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">All Withdrawals Processed!</h3>
                      <p className="text-muted-foreground">No pending withdrawals to review.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fraud Management Tab */}
          <TabsContent value="fraud">
            <Card>
              <CardHeader>
                <CardTitle>Fraud Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Fraud Detection:</strong> Monitor campaigns for suspicious activity and take appropriate action.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Flagged Campaigns</h3>
                    {flaggedCampaigns.length > 0 ? (
                      flaggedCampaigns.map((campaign: Campaign) => (
                        <div 
                          key={campaign.id}
                          className="border border-red-200 rounded-lg p-4 bg-red-50"
                          data-testid={`flagged-campaign-${campaign.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Flag className="w-4 h-4 text-red-600" />
                                <h4 className="font-semibold text-red-800">{campaign.title}</h4>
                              </div>
                              <p className="text-sm text-red-700 mb-2">
                                {campaign.description.slice(0, 100)}...
                              </p>
                              <div className="text-sm text-red-600">
                                Current: ₱{parseFloat(campaign.currentAmount).toLocaleString()} / 
                                Goal: ₱{parseFloat(campaign.goalAmount).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Button 
                                size="sm"
                                variant="outline"
                                data-testid={`button-investigate-${campaign.id}`}
                              >
                                Investigate
                              </Button>
                              <Button 
                                size="sm"
                                variant="destructive"
                                data-testid={`button-take-down-${campaign.id}`}
                              >
                                Take Down
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-muted-foreground">No flagged campaigns</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Active Campaigns Monitor</h3>
                    <div className="grid gap-4">
                      {activeCampaigns.slice(0, 5).map((campaign: Campaign) => (
                        <div 
                          key={campaign.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                          data-testid={`active-campaign-${campaign.id}`}
                        >
                          <div>
                            <div className="font-medium">{campaign.title}</div>
                            <div className="text-sm text-muted-foreground">
                              ₱{parseFloat(campaign.currentAmount).toLocaleString()} raised
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => flagCampaignMutation.mutate(campaign.id)}
                            disabled={flagCampaignMutation.isPending}
                            data-testid={`button-flag-${campaign.id}`}
                          >
                            <Flag className="w-4 h-4 mr-1" />
                            Flag
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Overview Tab */}
          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">Platform Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Total Campaigns:</span>
                        <span className="font-semibold" data-testid="stat-total-campaigns">
                          {allCampaigns?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Total Funds Raised:</span>
                        <span className="font-semibold text-secondary" data-testid="stat-total-raised">
                          ₱{allCampaigns?.reduce((sum: number, c: Campaign) => 
                            sum + parseFloat(c.currentAmount), 0).toLocaleString() || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Platform Fees (3.8%):</span>
                        <span className="font-semibold text-primary" data-testid="stat-platform-fees">
                          ₱{(allCampaigns?.reduce((sum: number, c: Campaign) => 
                            sum + parseFloat(c.currentAmount), 0) * 0.038).toLocaleString() || "0"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Financial monitoring and transaction oversight will be displayed here.
                      </div>
                      <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 text-yellow-600 mr-2" />
                          <span className="text-sm text-yellow-800">
                            Manual overrides and refund processing available for admin use.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
