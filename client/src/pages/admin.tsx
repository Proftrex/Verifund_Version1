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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Reported Volunteers Section Component
function ReportedVolunteersSection() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch reported volunteers (admin only)
  const { data: reportedVolunteers = [], isLoading } = useQuery({
    queryKey: ["/api/reported-volunteers"],
    queryFn: () => fetch("/api/reported-volunteers").then(res => res.json()),
  });

  const filteredReports = reportedVolunteers.filter((report: any) =>
    report.volunteer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.volunteer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading reported volunteers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by volunteer name or report reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-reports"
          />
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-8">
          <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No reported volunteers found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report: any) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={report.volunteer?.profileImageUrl} />
                      <AvatarFallback>
                        {report.volunteer?.firstName?.[0]}{report.volunteer?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold" data-testid={`text-reported-volunteer-${report.id}`}>
                        {report.volunteer?.firstName} {report.volunteer?.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Reported by: {report.reporter?.firstName} {report.reporter?.lastName}
                      </p>
                      <Badge variant="destructive" className="mt-1">
                        {report.reason}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-2">
                      {report.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {report.description && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm" data-testid={`text-report-description-${report.id}`}>
                      {report.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

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
                Platform Dashboard
              </h1>
              <p className="text-lg text-muted-foreground">
                View platform statistics and insights
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="insights" data-testid="tab-insights">Insights</TabsTrigger>
            <TabsTrigger value="kyc" data-testid="tab-kyc">KYC</TabsTrigger>
            <TabsTrigger value="volunteers" data-testid="tab-volunteers">Volunteers</TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
            <TabsTrigger value="financial" data-testid="tab-financial">Financial</TabsTrigger>
          </TabsList>

          {/* Insights Tab */}
          <TabsContent value="insights">
            {/* Admin Panel Introduction */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <span>Welcome to VeriFund Platform</span>
                </CardTitle>
                <CardDescription>
                  Platform insights and statistics overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                      Platform Overview
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                        <span>View platform health and user activities</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                        <span>Browse campaigns and platform statistics</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                        <span>Monitor user verification status</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                        <span>View platform reports and insights</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                        <span>Track financial operations and transactions</span>
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
                          <strong>Data Privacy:</strong> All user information is confidential and displayed for viewing purposes only.
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
                  <span>Platform Overview</span>
                </CardTitle>
                <CardDescription>View platform performance and key metrics</CardDescription>
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


          {/* KYC Status Tab */}
          <TabsContent value="kyc">
            <Card>
              <CardHeader>
                <CardTitle>User Verification Status</CardTitle>
                <CardDescription>View user KYC verification status (read-only)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">KYC verification management has been disabled.</p>
                  <p className="text-sm text-muted-foreground mt-2">Admin controls have been removed from this section.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Volunteers Tab */}
          <TabsContent value="volunteers">
            <Card>
              <CardHeader>
                <CardTitle>Volunteer Information</CardTitle>
                <CardDescription>View volunteer information and statistics (read-only)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Volunteer management has been disabled.</p>
                  <p className="text-sm text-muted-foreground mt-2">Admin controls have been removed from this section.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Platform Reports</CardTitle>
                <CardDescription>View platform reporting information (read-only)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileSearch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Platform reporting and management has been disabled.</p>
                  <p className="text-sm text-muted-foreground mt-2">Admin controls have been removed from this section.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Overview Tab */}
          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
                <CardDescription>View financial information (read-only)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Financial management has been disabled.</p>
                  <p className="text-sm text-muted-foreground mt-2">Admin controls have been removed from this section.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Page Message */}
          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle>Support Management</CardTitle>
                <CardDescription>Support functionality has been moved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Support management is now available as a separate page.</p>
                  <p className="text-sm text-muted-foreground mt-2">Please use the Support link in the navigation menu.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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

              {/* Additional Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Additional Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Created:</strong> {new Date(selectedTransaction.createdAt).toLocaleString()}</div>
                  {selectedTransaction.updatedAt && selectedTransaction.updatedAt !== selectedTransaction.createdAt && (
                    <div><strong>Updated:</strong> {new Date(selectedTransaction.updatedAt).toLocaleString()}</div>
                  )}
                  {selectedTransaction.description && (
                    <div><strong>Description:</strong> <p className="mt-1 p-2 bg-gray-50 rounded text-xs">{selectedTransaction.description}</p></div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
