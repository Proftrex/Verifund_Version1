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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  ArrowDownLeft,
  Heart
} from "lucide-react";
import type { Campaign, User } from "@shared/schema";

// Creator Profile Component for Campaign Review
function CreatorProfile({ creatorId }: { creatorId: string }) {
  const { data: creatorProfile, isLoading } = useQuery({
    queryKey: [`/api/admin/creator/${creatorId}/profile`],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Users className="w-5 h-5 mr-2" />
            Creator Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!creatorProfile) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="text-red-800">Unable to load creator profile</div>
        </CardContent>
      </Card>
    );
  }

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-300">✓ Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300">✗ Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">⏳ Pending</Badge>;
    }
  };

  const getRiskLevel = () => {
    const riskFactors = [];
    if (!creatorProfile.kycStatus || creatorProfile.kycStatus === 'pending') riskFactors.push('No KYC');
    if (creatorProfile.totalCampaigns === 0) riskFactors.push('New creator');
    if (parseFloat(creatorProfile.averageSuccessRate) < 50) riskFactors.push('Low success rate');
    if (creatorProfile.rejectedCampaigns > 0) riskFactors.push('Previous rejections');
    if (!creatorProfile.profession && !creatorProfile.organizationName) riskFactors.push('No professional info');

    if (riskFactors.length === 0) return { level: 'Low', color: 'green', factors: [] };
    if (riskFactors.length <= 2) return { level: 'Medium', color: 'yellow', factors: riskFactors };
    return { level: 'High', color: 'red', factors: riskFactors };
  };

  const riskAssessment = getRiskLevel();

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-blue-800">
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Creator Profile
          </div>
          {getKycStatusBadge(creatorProfile.kycStatus)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-blue-700">BASIC INFORMATION</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                {creatorProfile.profileImageUrl && (
                  <img 
                    src={creatorProfile.profileImageUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full mr-2 border"
                  />
                )}
                <div>
                  <div className="font-medium">
                    {creatorProfile.firstName} {creatorProfile.lastName}
                  </div>
                  <div className="text-muted-foreground">{creatorProfile.email}</div>
                </div>
              </div>
              <div><span className="font-medium">Joined:</span> {new Date(creatorProfile.createdAt).toLocaleDateString()}</div>
              {creatorProfile.profession && (
                <div><span className="font-medium">Profession:</span> {creatorProfile.profession}</div>
              )}
              {creatorProfile.organizationName && (
                <div><span className="font-medium">Organization:</span> {creatorProfile.organizationName}</div>
              )}
              {creatorProfile.organizationType && (
                <div><span className="font-medium">Type:</span> {creatorProfile.organizationType}</div>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-blue-700">PERFORMANCE METRICS</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Campaigns:</span>
                <span className="font-medium">{creatorProfile.totalCampaigns}</span>
              </div>
              <div className="flex justify-between">
                <span>Active:</span>
                <span className="text-green-600 font-medium">{creatorProfile.activeCampaigns}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="text-blue-600 font-medium">{creatorProfile.completedCampaigns}</span>
              </div>
              <div className="flex justify-between">
                <span>Rejected:</span>
                <span className="text-red-600 font-medium">{creatorProfile.rejectedCampaigns}</span>
              </div>
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <span className="font-medium">{creatorProfile.averageSuccessRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>Total Raised:</span>
                <span className="font-medium text-secondary">₱{parseFloat(creatorProfile.totalRaised).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-blue-700">RISK ASSESSMENT</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Risk Level:</span>
                <Badge className={`${
                  riskAssessment.color === 'green' ? 'bg-green-100 text-green-800 border-green-300' :
                  riskAssessment.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                  'bg-red-100 text-red-800 border-red-300'
                }`}>
                  {riskAssessment.level}
                </Badge>
              </div>
              {riskAssessment.factors.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-1">Risk Factors:</div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {riskAssessment.factors.map((factor, index) => (
                      <li key={index}>• {factor}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="text-sm">
                <div><span className="font-medium">Contributions Made:</span> {creatorProfile.totalContributions}</div>
                <div><span className="font-medium">Amount Contributed:</span> ₱{parseFloat(creatorProfile.contributionsValue).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedKycUser, setSelectedKycUser] = useState<any>(null);
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [showCampaignViewer, setShowCampaignViewer] = useState(false);

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

    if (!isLoading && isAuthenticated && !(user as any)?.isAdmin && !(user as any)?.isSupport) {
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
  const { data: pendingCampaigns = [] } = useQuery({
    queryKey: ["/api/admin/campaigns/pending"],
    enabled: !!((user as any)?.isAdmin || (user as any)?.isSupport),
    retry: false,
  }) as { data: any[] };

  const { data: pendingKyc = [] } = useQuery({
    queryKey: ["/api/admin/kyc/pending"],
    enabled: !!((user as any)?.isAdmin || (user as any)?.isSupport),
    retry: false,
  }) as { data: any[] };

  const { data: analytics = {} } = useQuery({
    queryKey: ["/api/admin/analytics"],
    enabled: !!((user as any)?.isAdmin || (user as any)?.isSupport),
    retry: false,
  }) as { data: any };

  const { data: supportInvitations = [] } = useQuery({
    queryKey: ["/api/admin/support/invitations"],
    enabled: !!(user as any)?.isAdmin,
    retry: false,
  }) as { data: any[] };

  const { data: allCampaigns = [] } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: () => fetch("/api/campaigns").then(res => res.json()),
    enabled: !!(user as any)?.isAdmin,
  }) as { data: any[] };

  const { data: pendingDeposits = [] } = useQuery({
    queryKey: ["/api/admin/transactions/deposits/pending"],
    enabled: !!(user as any)?.isAdmin,
    retry: false,
  }) as { data: any[] };

  const { data: pendingWithdrawals = [] } = useQuery({
    queryKey: ["/api/admin/transactions/withdrawals/pending"],
    enabled: !!(user as any)?.isAdmin,
    retry: false,
  }) as { data: any[] };

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

  // Support invitation mutation
  const inviteSupportMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", `/api/admin/support/invite`, { email });
    },
    onSuccess: () => {
      toast({ title: "Support Invited", description: "Support invitation has been sent." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/invitations"] });
      setInviteEmail("");
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
      toast({ title: "Error", description: "Failed to send support invitation.", variant: "destructive" });
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

        {/* Enhanced Analytics Dashboard */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-800" data-testid="stat-total-deposited">
                    ₱{analytics?.totalDeposited?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-green-600">Total Deposited</div>
                </div>
                <ArrowDownLeft className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-800" data-testid="stat-total-withdrawn">
                    ₱{analytics?.totalWithdrawn?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-red-600">Amount Withdrawn</div>
                </div>
                <ArrowUpRight className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-800" data-testid="stat-tips-collected">
                    ₱{analytics?.totalTipsCollected?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-purple-600">Tips Collected</div>
                </div>
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-800" data-testid="stat-contributions-collected">
                    ₱{analytics?.totalContributionsCollected?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-blue-600">Contributions Collected</div>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Operations Stats */}
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="kyc" data-testid="tab-kyc">KYC</TabsTrigger>
            <TabsTrigger value="deposits" data-testid="tab-deposits">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals" data-testid="tab-withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="fraud" data-testid="tab-fraud">Fraud</TabsTrigger>
            <TabsTrigger value="financial" data-testid="tab-financial">Financial</TabsTrigger>
            {user?.isAdmin && (
              <TabsTrigger value="support" data-testid="tab-support">Support</TabsTrigger>
            )}
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
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setShowCampaignViewer(true);
                              }}
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
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedKycUser(kycUser)}
                                  data-testid={`button-view-documents-${kycUser.id}`}
                                >
                                  <FileText className="w-4 h-4 mr-1" />
                                  View Docs
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>KYC Documents - {kycUser.firstName} {kycUser.lastName}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6">
                                  {kycUser.kycDocuments ? (
                                    Object.entries(JSON.parse(kycUser.kycDocuments)).map(([docType, docUrl]) => (
                                      <div key={docType} className="border rounded-lg p-4">
                                        <h4 className="font-medium mb-3 capitalize">
                                          {docType.replace('_', ' ')}
                                        </h4>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                          <img 
                                            src={docUrl as string}
                                            alt={`${docType} document`}
                                            className="max-w-full h-auto max-h-96 mx-auto rounded border"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.style.display = 'none';
                                              const parent = target.parentElement;
                                              if (parent) {
                                                parent.innerHTML = `
                                                  <div class="text-center py-8 text-gray-500">
                                                    <FileText class="w-12 h-12 mx-auto mb-2" />
                                                    <p>Document preview not available</p>
                                                    <p class="text-sm">Click to download: <a href="${docUrl}" target="_blank" class="text-blue-600 hover:underline">${docType}</a></p>
                                                  </div>
                                                `;
                                              }
                                            }}
                                          />
                                        </div>
                                        <div className="mt-2 flex justify-between items-center">
                                          <span className="text-sm text-gray-600">Document Type: {docType}</span>
                                          <a 
                                            href={docUrl as string} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline text-sm"
                                          >
                                            Open in New Tab
                                          </a>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-8 text-gray-500">
                                      <FileText className="w-12 h-12 mx-auto mb-2" />
                                      <p>No documents uploaded</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
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

          {/* Support Management Tab - Admin Only */}
          {user?.isAdmin && (
            <TabsContent value="support">
              <div className="space-y-6">
                {/* Invite Support Staff */}
                <Card>
                  <CardHeader>
                    <CardTitle>Invite Support Staff</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-4">
                      <input
                        type="email"
                        placeholder="Enter verified email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        data-testid="input-invite-email"
                      />
                      <Button
                        onClick={() => inviteSupportMutation.mutate(inviteEmail)}
                        disabled={inviteSupportMutation.isPending || !inviteEmail}
                        data-testid="button-send-invite"
                      >
                        {inviteSupportMutation.isPending ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Support staff can access the admin panel with limited permissions (cannot invite other support staff)
                    </p>
                  </CardContent>
                </Card>

                {/* Pending Invitations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Support Invitations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {supportInvitations && supportInvitations.length > 0 ? (
                      <div className="space-y-4">
                        {supportInvitations.map((invitation: any) => (
                          <div key={invitation.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{invitation.email}</p>
                                <p className="text-sm text-muted-foreground">
                                  Invited {new Date(invitation.createdAt).toLocaleDateString()}
                                  {' • Expires ' + new Date(invitation.expiresAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant="secondary">{invitation.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No pending invitations</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Campaign Details Modal */}
      <Dialog open={showCampaignViewer} onOpenChange={setShowCampaignViewer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-6">
              {/* Creator Profile Section */}
              <CreatorProfile campaignId={selectedCampaign.id} creatorId={selectedCampaign.creatorId} />
              
              {/* Campaign Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{selectedCampaign.title}</h3>
                  <p className="text-muted-foreground mb-4">{selectedCampaign.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Goal Amount:</span>
                      <span className="font-semibold">₱{parseFloat(selectedCampaign.goalAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span>{selectedCampaign.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{selectedCampaign.duration} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="capitalize">{selectedCampaign.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(selectedCampaign.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Campaign Images */}
                <div>
                  <h4 className="font-semibold mb-3">Campaign Images</h4>
                  {selectedCampaign.images ? (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedCampaign.images.split(',').map((imagePath: string, index: number) => (
                        <div key={index} className="relative">
                          <img
                            src={imagePath}
                            alt={`Campaign image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder-image.png";
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2 text-xs"
                            onClick={() => window.open(imagePath, '_blank')}
                          >
                            View Full
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No images uploaded</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowCampaignViewer(false)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    rejectCampaignMutation.mutate(selectedCampaign.id);
                    setShowCampaignViewer(false);
                  }}
                  disabled={rejectCampaignMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Campaign
                </Button>
                <Button
                  onClick={() => {
                    approveCampaignMutation.mutate(selectedCampaign.id);
                    setShowCampaignViewer(false);
                  }}
                  disabled={approveCampaignMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Campaign
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
