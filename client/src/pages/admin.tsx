import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import CreatorProfile from "@/components/CreatorProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
 
  XCircle, 
  Flag, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Eye,
  FileText,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Heart,
  Search,
  Mail,
  MapPin,
  Phone,
  Building,
  GraduationCap,
  Briefcase,
  Linkedin,
  Calendar,
  Wallet,
  User as UserIcon,
  X,
  MessageSquare,
  Star,
  ExternalLink,
  Play,
  Copy,
  FileQuestion,
  FileSearch,
  FileX,
  TrendingDown,
  Box,
  Shield,
  CheckCircle
} from "lucide-react";
import type { Campaign, User } from "@shared/schema";
import CampaignManagement from "@/components/CampaignManagement";
import KycManagement from "@/components/KycManagement";


export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  
  // Get tab from URL params, default to insights
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab') || 'insights';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  
  // Update tab when URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const newTab = urlParams.get('tab') || 'insights';
    setActiveTab(newTab);
  }, [window.location.search]);
  const [inviteEmail, setInviteEmail] = useState("");
  // KYC-related states moved to KycManagement component
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [showCampaignViewer, setShowCampaignViewer] = useState(false);
  
  // Transaction search states
  const [searchEmail, setSearchEmail] = useState("");
  const [searchTransactionId, setSearchTransactionId] = useState("");
  const [searchAmount, setSearchAmount] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [showCreatorProfile, setShowCreatorProfile] = useState(false);
  const [selectedFraudReport, setSelectedFraudReport] = useState<any>(null);
  const [showFraudReportDetails, setShowFraudReportDetails] = useState(false);
  // Document search states moved to KycManagement component

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

  // Pending KYC query moved to KycManagement component

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

  // Fetch creator profile data
  const { data: creatorProfile } = useQuery({
    queryKey: [`/api/admin/creator/${selectedCreatorId}/profile`],
    enabled: !!selectedCreatorId && !!((user as any)?.isAdmin || (user as any)?.isSupport),
    retry: false,
  }) as { data: any };

  // Remove automatic pending transaction queries - now search-based only

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

  // KYC mutations moved to KycManagement component

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

  // Transaction processing mutations
  const processTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      return await apiRequest("POST", `/api/admin/transactions/${transactionId}/process`);
    },
    onSuccess: () => {
      toast({
        title: "Transaction Processed",
        description: "Transaction has been processed successfully",
      });
      // Refresh search results if any exist
      if (searchResults.length > 0) {
        handleTransactionSearch();
      }
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
      
      toast({
        title: "Error",
        description: "Failed to process transaction",
        variant: "destructive",
      });
    },
  });

  const rejectTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      return await apiRequest("POST", `/api/admin/transactions/${transactionId}/reject`);
    },
    onSuccess: () => {
      toast({
        title: "Transaction Rejected",
        description: "Transaction has been rejected successfully",
      });
      // Refresh search results if any exist
      if (searchResults.length > 0) {
        handleTransactionSearch();
      }
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
      
      toast({
        title: "Error",
        description: "Failed to reject transaction",
        variant: "destructive",
      });
    },
  });

  // Transaction search function
  const handleTransactionSearch = async () => {
    if (!searchEmail && !searchTransactionId && !searchAmount) {
      toast({
        title: "Search Required",
        description: "Please enter at least one search parameter (email, transaction ID, or amount).",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchEmail) params.append('email', searchEmail);
      if (searchTransactionId) params.append('transactionId', searchTransactionId);
      if (searchAmount) params.append('amount', searchAmount);
      if (searchType && searchType !== 'all') params.append('type', searchType);

      const response = await fetch(`/api/admin/transactions/search?${params}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();
      setSearchResults(results);
      
      toast({
        title: "Search Complete",
        description: `Found ${results.length} transaction(s) matching your criteria.`,
      });
    } catch (error) {
      console.error('Transaction search error:', error);
      toast({
        title: "Search Failed",
        description: "Unable to search transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

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

  if (!isAuthenticated || !(user as any)?.isAdmin) {
    return null;
  }

  const activeCampaigns = allCampaigns?.filter((c: Campaign) => c.status === "active") || [];
  const flaggedCampaigns = allCampaigns?.filter((c: Campaign) => c.status === "flagged") || [];

  // Fraud Reports query
  const { data: fraudReports = [], isLoading: isLoadingFraudReports } = useQuery({
    queryKey: ['/api/admin/fraud-reports'],
    enabled: (user as any)?.isAdmin,
    retry: false,
    staleTime: 0,
  });
  
  const typedFraudReports = fraudReports as any[];

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

        {/* Platform Insights - User Metrics */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Platform Insights - User Activity</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-800" data-testid="stat-active-users">
                      {analytics?.activeUsers?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-blue-600">Active Users</div>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-800" data-testid="stat-contributors">
                      {analytics?.contributors?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-green-600">Contributors</div>
                  </div>
                  <Heart className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-purple-800" data-testid="stat-creators">
                      {analytics?.creators?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-purple-600">Creators</div>
                  </div>
                  <UserIcon className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-orange-800" data-testid="stat-volunteers">
                      {analytics?.volunteers?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-orange-600">Volunteers</div>
                  </div>
                  <Building className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Platform Insights - Campaign Activity */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Campaign Activity</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-800" data-testid="stat-active-campaigns">
                      {analytics?.activeCampaigns?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-green-600">Active Campaigns</div>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-800" data-testid="stat-in-progress-campaigns">
                      {analytics?.inProgressCampaigns?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-blue-600">In Progress Campaigns</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-red-800" data-testid="stat-fraud-reports">
                      {analytics?.fraudReportsCount?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-red-600">Fraud Reports</div>
                  </div>
                  <Flag className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-purple-800" data-testid="stat-verified-users">
                      {analytics?.verifiedUsers?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-purple-600">Verified Users</div>
                  </div>
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Platform Insights - Financial Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Financial Overview</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-purple-800" data-testid="stat-tips-collected">
                      ₱{analytics?.totalTipsCollected?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-purple-600">Total Tips Collected</div>
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
                    <div className="text-sm text-blue-600">Total Contributions Collected</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

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
                    <div className="text-sm text-red-600">Total Withdrawn</div>
                  </div>
                  <ArrowUpRight className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="insights" data-testid="tab-insights">Insights</TabsTrigger>
            <TabsTrigger value="kyc" data-testid="tab-kyc">KYC</TabsTrigger>
            <TabsTrigger value="volunteers" data-testid="tab-volunteers">Volunteers</TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
            <TabsTrigger value="financial" data-testid="tab-financial">Financial</TabsTrigger>
            {(user as any)?.isAdmin && (
              <TabsTrigger value="support" data-testid="tab-support">Support</TabsTrigger>
            )}
          </TabsList>

          {/* Insights Tab */}
          <TabsContent value="insights">
            {/* Admin Panel Introduction */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <span>Welcome to VeriFund Admin Panel</span>
                </CardTitle>
                <CardDescription>
                  Comprehensive platform management for administrators and support staff
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                      Admin Panel Purpose
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                        <span>Monitor platform health and user activities</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                        <span>Review and approve campaigns for platform safety</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                        <span>Verify user identities through KYC processes</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                        <span>Investigate fraud reports and maintain platform trust</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                        <span>Manage financial operations and transaction oversight</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                      Important Guidelines
                    </h3>
                    <div className="space-y-3">
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          <strong>Data Privacy:</strong> All user information is confidential. Only access data necessary for your administrative duties.
                        </AlertDescription>
                      </Alert>
                      
                      <Alert className="border-blue-200 bg-blue-50">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          <strong>Decision Impact:</strong> Campaign and KYC decisions directly affect users' livelihoods. Review thoroughly before taking action.
                        </AlertDescription>
                      </Alert>
                      
                      <Alert className="border-red-200 bg-red-50">
                        <Flag className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          <strong>Fraud Prevention:</strong> Stay vigilant for suspicious activities. When in doubt, escalate to senior administrators.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Admin Control Panel</span>
                </CardTitle>
                <CardDescription>Overview of platform performance and key metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">Platform Overview</h3>
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
                            sum + parseFloat(c.currentAmount || '0'), 0).toLocaleString() || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Platform Fees (3.8%):</span>
                        <span className="font-semibold text-primary" data-testid="stat-platform-fees">
                          ₱{(allCampaigns?.reduce((sum: number, c: Campaign) => 
                            sum + parseFloat(c.currentAmount || '0'), 0) * 0.038).toLocaleString() || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Active Users:</span>
                        <span className="font-semibold" data-testid="stat-active-users">
                          {analytics?.activeUsers || 0}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Pending KYC:</span>
                        <span className="font-semibold" data-testid="stat-pending-kyc">
                          {analytics?.pendingKYC || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Financial Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                        <span>Total Deposited:</span>
                        <span className="font-semibold text-green-600" data-testid="stat-total-deposited">
                          ₱{analytics?.totalDeposited?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                        <span>Total Withdrawn:</span>
                        <span className="font-semibold text-red-600" data-testid="stat-total-withdrawn">
                          ₱{analytics?.totalWithdrawn?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                        <span>Tips Collected:</span>
                        <span className="font-semibold text-blue-600" data-testid="stat-tips-collected">
                          ₱{analytics?.totalTipsCollected?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                        <span>Contributions Collected:</span>
                        <span className="font-semibold text-purple-600" data-testid="stat-contributions-collected">
                          ₱{analytics?.totalContributionsCollected?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* KYC Verification Tab */}
          <TabsContent value="kyc">
            <KycManagement />
          </TabsContent>

          {/* Volunteers Tab */}
          <TabsContent value="volunteers">
            <Card>
              <CardHeader>
                <CardTitle>Volunteer Management</CardTitle>
                <CardDescription>Manage volunteer applications and opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Volunteer Management</h3>
                  <p className="text-muted-foreground">
                    Volunteer oversight and application management features will be available here.
                  </p>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      This section will include volunteer application reviews, opportunity management, and volunteer performance tracking.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="space-y-6">
              {/* Transaction Search */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Search & Management</CardTitle>
                  <CardDescription>Search for transactions by user email, transaction ID, or amount. Only search when users report issues.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="space-y-6">
                  {/* Search Form */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="search-email">User Email</Label>
                      <Input
                        id="search-email"
                        placeholder="user@example.com"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        data-testid="input-search-email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="search-transaction-id">Transaction ID</Label>
                      <Input
                        id="search-transaction-id"
                        placeholder="b171b828-5d0f..."
                        value={searchTransactionId}
                        onChange={(e) => setSearchTransactionId(e.target.value)}
                        data-testid="input-search-transaction-id"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="search-amount">Amount</Label>
                      <Input
                        id="search-amount"
                        placeholder="1000.00"
                        value={searchAmount}
                        onChange={(e) => setSearchAmount(e.target.value)}
                        data-testid="input-search-amount"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="search-type">Transaction Type</Label>
                      <Select value={searchType} onValueChange={setSearchType}>
                        <SelectTrigger data-testid="select-search-type">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="deposit">Deposits</SelectItem>
                          <SelectItem value="withdrawal">Withdrawals</SelectItem>
                          <SelectItem value="contribution">Contributions</SelectItem>
                          <SelectItem value="tip">Tips</SelectItem>
                          <SelectItem value="claim_contributions">Claim Contributions</SelectItem>
                          <SelectItem value="claim_tips">Claim Tips</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Enter at least one search parameter to find transactions
                    </div>
                    <Button 
                      onClick={handleTransactionSearch}
                      disabled={isSearching || (!searchEmail && !searchTransactionId && !searchAmount)}
                      data-testid="button-search-transactions"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {isSearching ? 'Searching...' : 'Search Transactions'}
                    </Button>
                  </div>
                  
                  {/* Search Results */}
                  <div className="space-y-4">
                    {searchResults.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Search Results ({searchResults.length})</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchResults([]);
                              setSearchEmail("");
                              setSearchTransactionId("");
                              setSearchAmount("");
                              setSearchType("all");
                            }}
                            data-testid="button-clear-search"
                          >
                            Clear Results
                          </Button>
                        </div>
                        
                        {searchResults.map((result: any) => {
                          // Helper function to get readable transaction type
                          const getTransactionTypeLabel = (type: string) => {
                            const typeMap: { [key: string]: string } = {
                              'contribution': 'Contribute',
                              'tip': 'Tip',
                              'claim_tip': 'Claim Tip',
                              'claim_contribution': 'Claim Contribution',
                              'deposit': 'Deposit',
                              'withdrawal': 'Withdraw',
                              'withdraw': 'Withdraw',
                              'claim_tip_balance': 'Claim Tip Balance',
                              'claim_contribution_balance': 'Claim Contribution Balance',
                              'fee': 'Platform Fee',
                              'refund': 'Refund',
                              'transfer': 'Transfer'
                            };
                            return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                          };

                          return (
                            <div 
                              key={result.id}
                              className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-all hover:shadow-md"
                              data-testid={`search-result-${result.id}`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    result.type === 'deposit' ? 'bg-green-100' :
                                    result.type === 'withdrawal' || result.type === 'withdraw' ? 'bg-blue-100' :
                                    result.type === 'contribution' ? 'bg-purple-100' :
                                    result.type === 'tip' ? 'bg-orange-100' :
                                    result.type.includes('claim') ? 'bg-yellow-100' :
                                    'bg-gray-100'
                                  }`}>
                                    {result.type === 'deposit' && <TrendingUp className="w-3 h-3 text-green-600" />}
                                    {(result.type === 'withdrawal' || result.type === 'withdraw') && <TrendingDown className="w-3 h-3 text-blue-600" />}
                                    {result.type === 'contribution' && <Heart className="w-3 h-3 text-purple-600" />}
                                    {result.type === 'tip' && <Heart className="w-3 h-3 text-orange-600" />}
                                    {result.type.includes('claim') && <CheckCircle className="w-3 h-3 text-yellow-600" />}
                                    {!['deposit', 'withdrawal', 'withdraw', 'contribution', 'tip'].includes(result.type) && !result.type.includes('claim') && <Box className="w-3 h-3 text-gray-600" />}
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm">
                                      {getTransactionTypeLabel(result.type)}
                                    </div>
                                    <div className="font-semibold text-base text-gray-900">
                                      ₱{parseFloat(result.amount || '0').toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant={
                                      result.status === 'completed' ? 'default' : 
                                      result.status === 'failed' ? 'destructive' : 
                                      'secondary'
                                    }
                                    data-testid={`status-${result.id}`}
                                  >
                                    {result.status}
                                  </Badge>
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedTransaction(result);
                                      setShowTransactionDetails(true);
                                    }}
                                    data-testid={`button-details-${result.id}`}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    DETAILS
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                <div className="space-y-1">
                                  <div><strong>ID:</strong> {result.id}</div>
                                  <div><strong>User:</strong> {result.user?.firstName} {result.user?.lastName}</div>
                                  <div><strong>Email:</strong> {result.user?.email}</div>
                                </div>
                                <div className="space-y-1">
                                  <div><strong>Date:</strong> {new Date(result.createdAt).toLocaleDateString()}</div>
                                  {result.description && (
                                    <div><strong>Description:</strong> {result.description}</div>
                                  )}
                                  {result.paymentProvider && (
                                    <div><strong>Provider:</strong> {result.paymentProvider}</div>
                                  )}
                                </div>
                              </div>
                              
                              {result.status === 'pending' && (
                                <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
                                  <Button 
                                    size="sm"
                                    onClick={() => processTransactionMutation.mutate(result.id)}
                                    disabled={processTransactionMutation.isPending}
                                    data-testid={`button-approve-${result.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Process
                                  </Button>
                                  <Button 
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => rejectTransactionMutation.mutate(result.id)}
                                    disabled={rejectTransactionMutation.isPending}
                                    data-testid={`button-reject-${result.id}`}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Ready to Search</h3>
                        <p className="text-muted-foreground">
                          Enter search criteria above to find transactions when users report issues.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fraud Management Section */}
            <Card>
              <CardHeader>
                <CardTitle>Fraud Management</CardTitle>
                <CardDescription>Monitor campaigns for suspicious activity and take appropriate action</CardDescription>
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
                    <h3 className="font-semibold">Fraud Reports</h3>
                    {isLoadingFraudReports ? (
                      <div className="text-center py-4">Loading fraud reports...</div>
                    ) : typedFraudReports.length > 0 ? (
                      <div className="space-y-3">
                        {typedFraudReports.map((report: any) => (
                          <div 
                            key={report.id}
                            className="border border-red-200 rounded-lg p-4 bg-red-50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Flag className="w-4 h-4 text-red-600" />
                                  <h4 className="font-semibold text-red-800">{report.reportType}</h4>
                                  <Badge variant={report.status === 'pending' ? 'outline' : report.status === 'validated' ? 'secondary' : 'destructive'}>
                                    {report.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-red-700 mb-2">
                                  <strong>Document ID:</strong> <span className="font-mono bg-red-100 px-2 py-1 rounded">{report.documentId}</span>
                                </p>
                                <p className="text-sm text-red-700 mb-2">
                                  {report.description}
                                </p>
                                <div className="text-xs text-red-600">
                                  Reported by: {report.reporter?.firstName} {report.reporter?.lastName} | {new Date(report.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedFraudReport(report);
                                    setShowFraudReportDetails(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Details
                                </Button>
                                {report.status === 'pending' && (
                                  <>
                                    <Button 
                                      size="sm"
                                      variant="default"
                                    onClick={async () => {
                                      try {
                                        await fetch(`/api/admin/fraud-reports/${report.id}/validate`, {
                                          method: 'POST',
                                          credentials: 'include',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ adminNotes: 'Report validated by admin' })
                                        });
                                        queryClient.invalidateQueries({ queryKey: ['/api/admin/fraud-reports'] });
                                        toast({
                                          title: 'Report validated',
                                          description: 'Fraud report has been validated and reporter awarded social score points.'
                                        });
                                      } catch (error) {
                                        toast({
                                          title: 'Error',
                                          description: 'Failed to validate report',
                                          variant: 'destructive'
                                        });
                                      }
                                    }}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Validate
                                  </Button>
                                    <Button 
                                      size="sm"
                                      variant="destructive"
                                      onClick={async () => {
                                        try {
                                          await fetch(`/api/admin/fraud-reports/${report.id}/reject`, {
                                            method: 'POST',
                                            credentials: 'include',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ adminNotes: 'Report rejected - insufficient evidence' })
                                          });
                                          queryClient.invalidateQueries({ queryKey: ['/api/admin/fraud-reports'] });
                                          toast({
                                            title: 'Report rejected',
                                            description: 'Fraud report has been rejected.'
                                          });
                                        } catch (error) {
                                          toast({
                                            title: 'Error',
                                            description: 'Failed to reject report',
                                            variant: 'destructive'
                                          });
                                        }
                                      }}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-muted-foreground">No fraud reports submitted</p>
                      </div>
                    )}
                  </div>

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
                                Current: ₱{parseFloat(campaign.currentAmount || '0').toLocaleString()} / 
                                Goal: ₱{parseFloat(campaign.goalAmount || '0').toLocaleString()}
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
                              ₱{parseFloat(campaign.currentAmount || '0').toLocaleString()} raised
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

            {/* Document Search Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileSearch className="w-5 h-5" />
                  <span>Document Search</span>
                </CardTitle>
                <CardDescription>
                  Search for specific documents by Document ID for investigation purposes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Alert className="border-blue-200 bg-blue-50">
                    <FileQuestion className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Document Investigation:</strong> Enter a Document ID from fraud reports or other sources to locate and review specific content.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">Document ID</label>
                        <Input
                          type="text"
                          placeholder="Enter Document ID (e.g., A1B2C3D4)"
                          value=""
                          onChange={() => {}}
                          data-testid="input-document-id"
                        />
                      </div>
                      <div className="self-end">
                        <Button
                          onClick={() => {}}
                          disabled={true}
                          data-testid="button-search-document"
                        >
                          <Search className="w-4 h-4 mr-2" />
                          {"Search Disabled"}
                        </Button>
                      </div>
                    </div>

                    {false && (
                      <div className="border border-green-200 rounded-lg p-6 bg-green-50">
                        <h3 className="font-semibold text-green-800 mb-4 flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Document Found
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-green-800">Document Details</label>
                              <div className="mt-2 space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-green-700">Document ID:</span>
                                  <span className="text-sm font-mono bg-green-100 px-2 py-1 rounded">{documentSearchResult.shortId || documentSearchResult.id}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-green-700">File Name:</span>
                                  <span className="text-sm font-medium">{documentSearchResult.fileName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-green-700">File Type:</span>
                                  <span className="text-sm">{documentSearchResult.documentType}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-green-700">File Size:</span>
                                  <span className="text-sm">{documentSearchResult.fileSize ? `${Math.round(documentSearchResult.fileSize / 1024)}KB` : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-green-700">Upload Date:</span>
                                  <span className="text-sm">{new Date(documentSearchResult.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-green-800">Campaign Information</label>
                              <div className="mt-2 space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-green-700">Campaign:</span>
                                  <span className="text-sm font-medium">{documentSearchResult.campaign?.title}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-green-700">Creator:</span>
                                  <span className="text-sm">{documentSearchResult.campaign?.creator?.firstName} {documentSearchResult.campaign?.creator?.lastName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-green-700">Progress Report:</span>
                                  <span className="text-sm">{documentSearchResult.progressReport?.title}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-green-800">Actions</label>
                              <div className="mt-2 space-y-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(documentSearchResult.viewUrl || documentSearchResult.fileUrl, '_blank')}
                                  className="w-full"
                                  data-testid="button-view-document"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Document
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`/campaigns/${documentSearchResult.campaign?.id}`, '_blank')}
                                  className="w-full"
                                  data-testid="button-view-campaign"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Campaign
                                </Button>
                              </div>
                            </div>

                            {documentSearchResult.description && (
                              <div>
                                <label className="text-sm font-medium text-green-800">Document Description</label>
                                <p className="mt-2 text-sm text-green-700 bg-green-100 p-3 rounded">
                                  {documentSearchResult.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {false && (
                      <div className="text-center py-8">
                        <FileX className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-muted-foreground">No document found with ID: {documentSearchId}</p>
                        <p className="text-sm text-muted-foreground mt-1">Please verify the Document ID and try again</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          </TabsContent>

          {/* Financial Overview Tab */}
          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-1 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">Financial Operations</h3>
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

          {/* Invite Tab - Admin Only */}
          {(user as any)?.isAdmin && (
            <TabsContent value="invite">
              <Card>
                <CardHeader>
                  <CardTitle>Invite Support Staff</CardTitle>
                  <CardDescription>Invite new support staff members to help manage the platform</CardDescription>
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
                      {inviteSupportMutation.isPending ? "Sending..." : "Send Invite"}
                    </Button>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-semibold mb-4">Pending Invitations</h3>
                    {supportInvitations?.length > 0 ? (
                      <div className="space-y-2">
                        {supportInvitations.map((invitation: any) => (
                          <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <span className="font-medium">{invitation.email}</span>
                              <div className="text-sm text-muted-foreground">
                                Sent: {new Date(invitation.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge variant={invitation.status === 'pending' ? 'outline' : 'secondary'}>
                              {invitation.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No pending invitations</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Support Management Tab - Admin Only */}
          {(user as any)?.isAdmin && (
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
              {/* Creator Profile Button */}
              <div className="flex justify-between items-center pb-4 border-b">
                <h3 className="font-semibold text-lg">Campaign Review</h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCreatorId(selectedCampaign.creatorId);
                    setShowCreatorProfile(true);
                  }}
                  data-testid="view-creator-profile"
                >
                  <Users className="w-4 h-4 mr-2" />
                  View Creator Profile
                </Button>
              </div>
              
              {/* Campaign Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{selectedCampaign.title}</h3>
                  <p className="text-muted-foreground mb-4">{selectedCampaign.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Goal Amount:</span>
                      <span className="font-semibold">₱{parseFloat(selectedCampaign.goalAmount || '0').toLocaleString()}</span>
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

      {/* Transaction Details Modal */}
      <Dialog open={showTransactionDetails} onOpenChange={setShowTransactionDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Transaction Details
            </DialogTitle>
            <DialogDescription>
              Complete backend information for transaction {selectedTransaction?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Transaction Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>ID:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{selectedTransaction.id}</code></div>
                    <div><strong>Type:</strong> <Badge variant="outline">{selectedTransaction.type}</Badge></div>
                    <div><strong>Status:</strong> <Badge 
                      variant={
                        selectedTransaction.status === 'completed' ? 'default' : 
                        selectedTransaction.status === 'failed' ? 'destructive' : 
                        'secondary'
                      }
                    >{selectedTransaction.status}</Badge></div>
                    <div><strong>Amount:</strong> {selectedTransaction.amount} {selectedTransaction.currency || 'PHP'}</div>
                    {selectedTransaction.phpEquivalent && (
                      <div><strong>PHP Equivalent:</strong> ₱{parseFloat(selectedTransaction.phpEquivalent).toLocaleString()}</div>
                    )}
                    {selectedTransaction.feeAmount && (
                      <div><strong>Fee:</strong> {selectedTransaction.feeAmount} {selectedTransaction.currency || 'PHP'}</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">User Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedTransaction.user?.firstName} {selectedTransaction.user?.lastName}</div>
                    <div><strong>Email:</strong> {selectedTransaction.user?.email}</div>
                    <div><strong>User ID:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{selectedTransaction.user?.id}</code></div>
                    <div><strong>KYC Status:</strong> <Badge variant="outline">{selectedTransaction.user?.kycStatus}</Badge></div>
                    {selectedTransaction.user?.phpBalance !== undefined && (
                      <div><strong>PHP Balance:</strong> {selectedTransaction.user?.phpBalance} PHP</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Blockchain & Payment Info */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Payment & Blockchain</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {selectedTransaction.exchangeRate && (
                      <div><strong>Exchange Rate:</strong> ₱{selectedTransaction.exchangeRate} per PHP</div>
                    )}
                    {selectedTransaction.paymentProvider && (
                      <div><strong>Payment Provider:</strong> {selectedTransaction.paymentProvider}</div>
                    )}
                    {selectedTransaction.paymentProviderTxId && (
                      <div><strong>Provider Transaction ID:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{selectedTransaction.paymentProviderTxId}</code></div>
                    )}
                    {selectedTransaction.transactionHash && (
                      <div><strong>Blockchain Hash:</strong> <code className="text-xs bg-gray-100 px-1 rounded break-all">{selectedTransaction.transactionHash}</code></div>
                    )}
                    {selectedTransaction.blockNumber && (
                      <div><strong>Block Number:</strong> {selectedTransaction.blockNumber}</div>
                    )}
                  </CardContent>
                </Card>

                {/* Timestamps & Description */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Timeline & Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Created:</strong> {new Date(selectedTransaction.createdAt).toLocaleString()}</div>
                    {selectedTransaction.updatedAt && selectedTransaction.updatedAt !== selectedTransaction.createdAt && (
                      <div><strong>Updated:</strong> {new Date(selectedTransaction.updatedAt).toLocaleString()}</div>
                    )}
                    {selectedTransaction.description && (
                      <div><strong>Description:</strong> <p className="mt-1 p-2 bg-gray-50 rounded text-xs">{selectedTransaction.description}</p></div>
                    )}
                    {selectedTransaction.paymentProviderTxId && (
                      <div><strong>Full Provider Details:</strong> <code className="text-xs bg-gray-100 px-1 rounded break-all">{selectedTransaction.paymentProviderTxId}</code></div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Creator Profile Modal */}
      <Dialog open={showCreatorProfile} onOpenChange={setShowCreatorProfile}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Creator Profile
            </DialogTitle>
            <DialogDescription>
              Comprehensive profile information for creator review
            </DialogDescription>
          </DialogHeader>
          
          {creatorProfile && (
            <CreatorProfile creator={creatorProfile} />
          )}
        </DialogContent>
      </Dialog>

      {/* Fraud Report Details Modal */}
      {selectedFraudReport && (
        <Dialog open={showFraudReportDetails} onOpenChange={setShowFraudReportDetails}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Fraud Report Details</DialogTitle>
              <DialogDescription>
                Review the complete fraud report before taking action.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Report Summary */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
                  <h3 className="text-lg font-bold text-red-800">Fraud Report Summary</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-md p-3 border">
                    <Label className="text-sm font-medium text-gray-600">Report Type</Label>
                    <p className="text-base font-semibold text-gray-900 mt-1">{selectedFraudReport.reportType}</p>
                  </div>
                  <div className="bg-white rounded-md p-3 border">
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <div className="mt-2">
                      <Badge variant={selectedFraudReport.status === 'pending' ? 'outline' : selectedFraudReport.status === 'validated' ? 'secondary' : 'destructive'}>
                        {selectedFraudReport.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-white rounded-md p-3 border">
                    <Label className="text-sm font-medium text-gray-600">Submitted</Label>
                    <p className="text-base font-semibold text-gray-900 mt-1">{new Date(selectedFraudReport.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-md p-3 border">
                    <Label className="text-sm font-medium text-gray-600">Document ID</Label>
                    <p className="text-sm font-mono bg-red-100 text-red-800 rounded px-2 py-1 mt-1">{selectedFraudReport.documentId}</p>
                    <p className="text-xs text-gray-500 mt-1">Use this ID in Document Search tab</p>
                  </div>
                </div>
              </div>

              {/* Reporter Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <UserIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-bold text-blue-800">Complete Reporter Profile</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white">
                      Credibility: {selectedFraudReport.reporter?.socialScore >= 100 ? 'High' : 
                                   selectedFraudReport.reporter?.socialScore >= 50 ? 'Medium' : 'Low'}
                    </Badge>
                    {selectedFraudReport.reporter?.kycStatus === 'verified' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        KYC Verified
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Basic Information */}
                <div className="mb-6">
                  <h4 className="text-md font-bold text-blue-700 mb-3 flex items-center">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {selectedFraudReport.reporter?.firstName} {selectedFraudReport.reporter?.lastName}
                      </p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                      <p className="text-sm text-gray-700 mt-1 break-all">{selectedFraudReport.reporter?.email}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">User ID</Label>
                      <p className="text-xs font-mono bg-blue-50 rounded px-2 py-1 mt-1 text-blue-800">{selectedFraudReport.reporterId}</p>
                    </div>
                  </div>
                </div>
                
                {/* Account Status */}
                <div className="mb-6">
                  <h4 className="text-md font-bold text-blue-700 mb-3 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Account Status & Verification
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Account Age</Label>
                      <p className="text-sm text-gray-700 mt-1">
                        {selectedFraudReport.reporter?.createdAt ? 
                          Math.floor((Date.now() - new Date(selectedFraudReport.reporter.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + ' days' 
                          : 'Unknown'}
                      </p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">KYC Status</Label>
                      <Badge variant={selectedFraudReport.reporter?.kycStatus === 'verified' ? 'secondary' : 'outline'} className="mt-1">
                        {selectedFraudReport.reporter?.kycStatus || 'Unverified'}
                      </Badge>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Social Score</Label>
                      <div className="flex items-center mt-1">
                        <span className="text-lg font-bold text-blue-600">{selectedFraudReport.reporter?.socialScore || 0}</span>
                        <span className="text-sm text-gray-500 ml-1">points</span>
                        <div className={`ml-2 w-2 h-2 rounded-full ${
                          selectedFraudReport.reporter?.socialScore >= 100 ? 'bg-green-500' :
                          selectedFraudReport.reporter?.socialScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} title="Score indicator"></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Credit Score</Label>
                      <p className="text-lg font-bold text-green-600 mt-1">{selectedFraudReport.reporter?.creditScore || 0}</p>
                    </div>
                  </div>
                </div>
                
                {/* Financial Information */}
                <div className="mb-6">
                  <h4 className="text-md font-bold text-blue-700 mb-3 flex items-center">
                    <Wallet className="w-4 h-4 mr-2" />
                    Financial Profile
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">PHP Balance</Label>
                      <p className="text-lg font-bold text-purple-600 mt-1">₱{parseFloat(selectedFraudReport.reporter?.phpBalance || '0').toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Tips Balance</Label>
                      <p className="text-lg font-bold text-green-600 mt-1">₱{parseFloat(selectedFraudReport.reporter?.tipsBalance || '0').toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Contributions Balance</Label>
                      <p className="text-lg font-bold text-blue-600 mt-1">₱{parseFloat(selectedFraudReport.reporter?.contributionsBalance || '0').toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Total Contributed</Label>
                      <p className="text-sm text-gray-700 mt-1">₱{parseFloat(selectedFraudReport.reporter?.totalContributed || '0').toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                {/* Activity Summary */}
                <div>
                  <h4 className="text-md font-bold text-blue-700 mb-3 flex items-center">
                    <Flag className="w-4 h-4 mr-2" />
                    Platform Activity
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Campaigns Created</Label>
                      <p className="text-sm text-gray-700 mt-1">{selectedFraudReport.reporter?.campaignsCreated || 0} campaigns</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Campaigns Supported</Label>
                      <p className="text-sm text-gray-700 mt-1">{selectedFraudReport.reporter?.campaignsSupported || 0} campaigns</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Reports Submitted</Label>
                      <div className="flex items-center mt-1">
                        <span className="text-sm font-semibold text-red-600">1 report</span>
                        <span className="text-xs text-gray-500 ml-1">submitted</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Last Activity</Label>
                      <p className="text-xs text-gray-600 mt-1">
                        {selectedFraudReport.reporter?.lastLoginAt ? 
                          new Date(selectedFraudReport.reporter.lastLoginAt).toLocaleDateString() : 
                          'Recently active'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reported Person Information */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                    <h3 className="text-lg font-bold text-orange-800">Complete Reported User Profile</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedFraudReport.campaign?.creator?.kycStatus === 'verified' ? 'secondary' : 'destructive'}>
                      {selectedFraudReport.campaign?.creator?.kycStatus === 'verified' ? 'Verified User' : 'Unverified'}
                    </Badge>
                    {selectedFraudReport.campaign?.creator?.socialScore < 25 && (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        High Risk User
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Basic Information */}
                <div className="mb-6">
                  <h4 className="text-md font-bold text-orange-700 mb-3 flex items-center">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {selectedFraudReport.campaign?.creator?.firstName} {selectedFraudReport.campaign?.creator?.lastName}
                      </p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                      <p className="text-sm text-gray-700 mt-1 break-all">{selectedFraudReport.campaign?.creator?.email}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">User ID</Label>
                      <p className="text-xs font-mono bg-orange-50 rounded px-2 py-1 mt-1 text-orange-800">
                        {selectedFraudReport.campaign?.creatorId || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Professional Information */}
                <div className="mb-6">
                  <h4 className="text-md font-bold text-orange-700 mb-3 flex items-center">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Professional Details
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Profession</Label>
                      <p className="text-sm text-gray-700 mt-1">{selectedFraudReport.campaign?.creator?.profession || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Organization</Label>
                      <p className="text-sm text-gray-700 mt-1">{selectedFraudReport.campaign?.creator?.organizationName || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                      <p className="text-sm text-gray-700 mt-1">{selectedFraudReport.campaign?.creator?.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border col-span-2">
                      <Label className="text-sm font-medium text-gray-600">Address</Label>
                      <p className="text-sm text-gray-700 mt-1">{selectedFraudReport.campaign?.creator?.address || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">LinkedIn</Label>
                      {selectedFraudReport.campaign?.creator?.linkedinProfile ? (
                        <a 
                          href={selectedFraudReport.campaign.creator.linkedinProfile} 
                          target="_blank" 
                          className="text-xs text-blue-600 hover:underline mt-1 block"
                        >
                          View Profile
                        </a>
                      ) : (
                        <p className="text-sm text-gray-700 mt-1">Not provided</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Account Status & Scores */}
                <div className="mb-6">
                  <h4 className="text-md font-bold text-orange-700 mb-3 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Account Status & Trust Indicators
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Account Age</Label>
                      <p className="text-sm text-gray-700 mt-1">
                        {selectedFraudReport.campaign?.creator?.createdAt ? 
                          Math.floor((Date.now() - new Date(selectedFraudReport.campaign.creator.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + ' days' 
                          : 'Unknown'}
                      </p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Social Score</Label>
                      <div className="flex items-center mt-1">
                        <span className="text-lg font-bold text-orange-600">{selectedFraudReport.campaign?.creator?.socialScore || 0}</span>
                        <span className="text-sm text-gray-500 ml-1">points</span>
                        <div className={`ml-2 w-2 h-2 rounded-full ${
                          selectedFraudReport.campaign?.creator?.socialScore >= 100 ? 'bg-green-500' :
                          selectedFraudReport.campaign?.creator?.socialScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} title="Trust indicator"></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Credit Score</Label>
                      <p className="text-lg font-bold text-green-600 mt-1">{selectedFraudReport.campaign?.creator?.creditScore || 0}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Creator Rating</Label>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < (selectedFraudReport.campaign?.creator?.creatorRating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-600 ml-1">
                            {selectedFraudReport.campaign?.creator?.creatorRating || 0}/5
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Financial Profile */}
                <div className="mb-6">
                  <h4 className="text-md font-bold text-orange-700 mb-3 flex items-center">
                    <Wallet className="w-4 h-4 mr-2" />
                    Financial Profile
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">PHP Balance</Label>
                      <p className="text-lg font-bold text-purple-600 mt-1">₱{parseFloat(selectedFraudReport.campaign?.creator?.phpBalance || '0').toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Tips Balance</Label>
                      <p className="text-lg font-bold text-green-600 mt-1">₱{parseFloat(selectedFraudReport.campaign?.creator?.tipsBalance || '0').toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Contributions Balance</Label>
                      <p className="text-lg font-bold text-blue-600 mt-1">₱{parseFloat(selectedFraudReport.campaign?.creator?.contributionsBalance || '0').toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Total Raised</Label>
                      <p className="text-sm font-semibold text-green-700 mt-1">₱{parseFloat(selectedFraudReport.campaign?.currentAmount || '0').toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                {/* Platform Activity */}
                <div>
                  <h4 className="text-md font-bold text-orange-700 mb-3 flex items-center">
                    <Flag className="w-4 h-4 mr-2" />
                    Campaign & Platform Activity
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Total Campaigns</Label>
                      <p className="text-sm text-gray-700 mt-1">{selectedFraudReport.campaign?.creator?.campaignsCreated || 1} campaigns</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Success Rate</Label>
                      <p className="text-sm font-semibold text-green-600 mt-1">
                        {selectedFraudReport.campaign?.creator?.successfulCampaigns || 0}/{selectedFraudReport.campaign?.creator?.campaignsCreated || 1}
                      </p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Total Contributors</Label>
                      <p className="text-sm text-gray-700 mt-1">{selectedFraudReport.campaign?.totalContributors || 0} supporters</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border">
                      <Label className="text-sm font-medium text-gray-600">Profile Complete</Label>
                      <Badge variant={selectedFraudReport.campaign?.creator?.isProfileComplete ? 'secondary' : 'outline'} className="mt-1 text-xs">
                        {selectedFraudReport.campaign?.creator?.isProfileComplete ? 'Complete' : 'Incomplete'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Information */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Flag className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-bold text-green-800">Campaign Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-md p-3 border">
                    <Label className="text-sm font-medium text-gray-600">Campaign Title</Label>
                    <p className="text-base font-semibold text-gray-900 mt-1">{selectedFraudReport.campaign?.title || 'Loading...'}</p>
                  </div>
                  <div className="bg-white rounded-md p-3 border">
                    <Label className="text-sm font-medium text-gray-600">Campaign Status</Label>
                    <Badge variant={selectedFraudReport.campaign?.status === 'active' ? 'secondary' : 'outline'} className="mt-2">
                      {selectedFraudReport.campaign?.status || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="bg-white rounded-md p-3 border">
                    <Label className="text-sm font-medium text-gray-600">Goal Amount</Label>
                    <p className="text-lg font-bold text-green-600 mt-1">₱{parseFloat(selectedFraudReport.campaign?.goalAmount || '0').toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-md p-3 border">
                    <Label className="text-sm font-medium text-gray-600">Current Amount</Label>
                    <p className="text-lg font-bold text-green-600 mt-1">₱{parseFloat(selectedFraudReport.campaign?.currentAmount || '0').toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Report Description */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <MessageSquare className="w-5 h-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-bold text-gray-800">Reporter's Detailed Description</h3>
                </div>
                <div className="bg-white border rounded-md p-4">
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{selectedFraudReport.description}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Report submitted on {new Date(selectedFraudReport.createdAt).toLocaleDateString()} at {new Date(selectedFraudReport.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>


              {/* Admin Notes (if any) */}
              {selectedFraudReport.adminNotes && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Shield className="w-5 h-5 text-purple-600 mr-2" />
                    <h3 className="text-lg font-bold text-purple-800">Admin Review</h3>
                  </div>
                  <div className="bg-white border rounded-md p-4">
                    <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{selectedFraudReport.adminNotes}</p>
                    {selectedFraudReport.reviewedAt && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          <strong>Reviewed:</strong> {new Date(selectedFraudReport.reviewedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons - Fixed Layout */}
            <div className="bg-white border-t-2 border-gray-200 p-6 mt-6">
              {/* Warning Message */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center space-x-2 text-sm text-gray-600 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span>Review carefully before taking action</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline" 
                  size="lg"
                  onClick={() => setShowFraudReportDetails(false)}
                  className="px-6"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close Review
                </Button>
                
                {selectedFraudReport.status === 'pending' && (
                  <>
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={async () => {
                        try {
                          await fetch(`/api/admin/fraud-reports/${selectedFraudReport.id}/reject`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ adminNotes: 'Report rejected after detailed review - insufficient evidence or potential false report' })
                          });
                          queryClient.invalidateQueries({ queryKey: ['/api/admin/fraud-reports'] });
                          setShowFraudReportDetails(false);
                          toast({
                            title: 'Report Rejected',
                            description: 'Fraud report has been rejected and dismissed.',
                            variant: 'destructive'
                          });
                        } catch (error) {
                          toast({
                            title: 'Error',
                            description: 'Failed to reject report',
                            variant: 'destructive'
                          });
                        }
                      }}
                      className="px-6"
                    >
                      <XCircle className="w-5 h-5 mr-2" />
                      Reject Report
                    </Button>
                    <Button
                      size="lg"
                      onClick={async () => {
                        try {
                          await fetch(`/api/admin/fraud-reports/${selectedFraudReport.id}/validate`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ adminNotes: 'Report validated after thorough review - legitimate fraud detected' })
                          });
                          queryClient.invalidateQueries({ queryKey: ['/api/admin/fraud-reports'] });
                          setShowFraudReportDetails(false);
                          toast({
                            title: 'Report Validated',
                            description: 'Fraud report confirmed. Reporter awarded social score points and appropriate action will be taken.',
                          });
                        } catch (error) {
                          toast({
                            title: 'Error',
                            description: 'Failed to validate report',
                            variant: 'destructive'
                          });
                        }
                      }}
                      className="px-6 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Validate Report
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
