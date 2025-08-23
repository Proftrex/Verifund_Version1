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
  Download,
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
  const [kycTab, setKycTab] = useState("requests");
  
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

  // KYC Data queries
  const { data: pendingKYC = [], isLoading: isLoadingPendingKYC } = useQuery({
    queryKey: ['/api/admin/kyc/pending'],
    enabled: (user as any)?.isAdmin,
    retry: false,
    staleTime: 0,
  });

  const { data: verifiedUsers = [], isLoading: isLoadingVerifiedUsers } = useQuery({
    queryKey: ['/api/admin/kyc/verified'],
    enabled: (user as any)?.isAdmin,
    retry: false,
    staleTime: 0,
  });

  const { data: rejectedKYC = [], isLoading: isLoadingRejectedKYC } = useQuery({
    queryKey: ['/api/admin/kyc/rejected'],
    enabled: (user as any)?.isAdmin,
    retry: false,
    staleTime: 0,
  });

  const { data: suspendedUsers = [], isLoading: isLoadingSuspendedUsers } = useQuery({
    queryKey: ['/api/admin/users/suspended'],
    enabled: (user as any)?.isAdmin,
    retry: false,
    staleTime: 0,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">




        {/* KYC Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <span>KYC Management</span>
            </CardTitle>
            <CardDescription>
              Manage user verification and account status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={kycTab} onValueChange={setKycTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="requests" data-testid="tab-kyc-requests">KYC Requests</TabsTrigger>
                <TabsTrigger value="verified" data-testid="tab-verified-users">Verified Users</TabsTrigger>
                <TabsTrigger value="rejected" data-testid="tab-rejected-kyc">Rejected KYC</TabsTrigger>
                <TabsTrigger value="suspended" data-testid="tab-suspended-users">Suspended Users</TabsTrigger>
              </TabsList>

              <TabsContent value="requests">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending KYC Requests ({pendingKYC.length})</CardTitle>
                    <CardDescription>Review and process user verification requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPendingKYC ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading pending KYC requests...</p>
                      </div>
                    ) : pendingKYC.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No pending KYC requests at this time.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingKYC.map((user: any) => {
                          const kycDocuments = user.kycDocuments ? JSON.parse(user.kycDocuments) : {};
                          
                          return (
                            <Card key={user.id} className="border-orange-200 bg-orange-50">
                              <CardContent className="p-6">
                                <div className="space-y-6">
                                  {/* User Header */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      {user.profileImageUrl ? (
                                        <img 
                                          src={user.profileImageUrl} 
                                          alt="Profile" 
                                          className="w-16 h-16 rounded-full object-cover border-2 border-orange-300"
                                        />
                                      ) : (
                                        <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center">
                                          <UserIcon className="w-8 h-8 text-orange-600" />
                                        </div>
                                      )}
                                      <div>
                                        <h4 className="font-semibold text-lg">{user.firstName} {user.lastName}</h4>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                        <p className="text-xs text-muted-foreground">Account Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Pending Review
                                          </Badge>
                                          {user.isProfileComplete && (
                                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                              Profile Complete
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Personal Information */}
                                  <div className="bg-white rounded-lg p-4 border">
                                    <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                      <UserIcon className="w-4 h-4 mr-2" />
                                      Personal Information
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <span className="font-medium text-gray-600">Full Name:</span>
                                        <p className="text-gray-800">
                                          {user.firstName || user.lastName ? 
                                            `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
                                            <span className="text-red-500 italic">Not provided</span>
                                          }
                                        </p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600">Email:</span>
                                        <p className="text-gray-800">{user.email}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600">Phone:</span>
                                        <p className="text-gray-800 flex items-center">
                                          {user.phoneNumber ? (
                                            <>
                                              <Phone className="w-3 h-3 mr-1" />
                                              {user.phoneNumber}
                                            </>
                                          ) : (
                                            <span className="text-red-500 italic">Not provided</span>
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600">User ID:</span>
                                        <p className="text-gray-800 font-mono text-sm font-bold text-blue-600">
                                          {user.userDisplayId || user.id}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Internal ID: {user.id}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Address Information */}
                                  <div className="bg-white rounded-lg p-4 border">
                                    <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                      <MapPin className="w-4 h-4 mr-2" />
                                      Address Information
                                    </h5>
                                    <div className="text-sm">
                                      <span className="font-medium text-gray-600">Address:</span>
                                      <p className="text-gray-800">
                                        {user.address ? user.address : <span className="text-red-500 italic">Not provided</span>}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Professional Information */}
                                  <div className="bg-white rounded-lg p-4 border">
                                    <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                      <Briefcase className="w-4 h-4 mr-2" />
                                      Professional Information
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <span className="font-medium text-gray-600">Profession:</span>
                                        <p className="text-gray-800">
                                          {user.profession ? user.profession : <span className="text-red-500 italic">Not provided</span>}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600">Education:</span>
                                        <p className="text-gray-800 flex items-center">
                                          {user.education ? (
                                            <>
                                              <GraduationCap className="w-3 h-3 mr-1" />
                                              {user.education}
                                            </>
                                          ) : (
                                            <span className="text-red-500 italic">Not provided</span>
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600">Organization:</span>
                                        <p className="text-gray-800 flex items-center">
                                          {user.organizationName ? (
                                            <>
                                              <Building className="w-3 h-3 mr-1" />
                                              {user.organizationName}
                                              {user.organizationType && (
                                                <Badge variant="secondary" className="ml-2 text-xs">
                                                  {user.organizationType}
                                                </Badge>
                                              )}
                                            </>
                                          ) : (
                                            <span className="text-red-500 italic">Not provided</span>
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600">LinkedIn:</span>
                                        {user.linkedinProfile ? (
                                          <a 
                                            href={user.linkedinProfile} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 flex items-center"
                                          >
                                            <Linkedin className="w-3 h-3 mr-1" />
                                            {user.linkedinProfile}
                                            <ExternalLink className="w-3 h-3 ml-1" />
                                          </a>
                                        ) : (
                                          <span className="text-red-500 italic">Not provided</span>
                                        )}
                                      </div>
                                      <div className="md:col-span-2">
                                        <span className="font-medium text-gray-600">Work Experience:</span>
                                        <p className="text-gray-800">
                                          {user.workExperience ? user.workExperience : <span className="text-red-500 italic">Not provided</span>}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Account Information */}
                                  <div className="bg-white rounded-lg p-4 border">
                                    <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                      <Wallet className="w-4 h-4 mr-2" />
                                      Account Information
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <span className="font-medium text-gray-600">Account Created:</span>
                                        <p className="text-gray-800 flex items-center">
                                          <Calendar className="w-3 h-3 mr-1" />
                                          {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600">Last Updated:</span>
                                        <p className="text-gray-800">{new Date(user.updatedAt).toLocaleDateString()}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600">PHP Balance:</span>
                                        <p className="text-gray-800">₱{parseFloat(user.phpBalance || "0").toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600">Profile Status:</span>
                                        <p className="text-gray-800">
                                          {user.isProfileComplete ? "Complete" : "Incomplete"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Documents Section */}
                                  {Object.keys(kycDocuments).length > 0 && (
                                    <div className="border-t pt-4">
                                      <h5 className="font-medium text-sm text-gray-700 mb-3">Uploaded Documents:</h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {kycDocuments.valid_id && (
                                          <div className="bg-white rounded-lg p-3 border">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-sm font-medium text-gray-600">Valid ID</span>
                                              <Badge variant="secondary" className="text-xs">ID Document</Badge>
                                            </div>
                                            {kycDocuments.valid_id.includes('.jpg') || kycDocuments.valid_id.includes('.jpeg') || kycDocuments.valid_id.includes('.png') ? (
                                              <div className="space-y-2">
                                                <img 
                                                  src={kycDocuments.valid_id} 
                                                  alt="Valid ID" 
                                                  className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                                                  onClick={() => window.open(kycDocuments.valid_id, '_blank')}
                                                />
                                                <Button variant="outline" size="sm" className="w-full">
                                                  <Eye className="w-3 h-3 mr-1" />
                                                  View Full Size
                                                </Button>
                                              </div>
                                            ) : (
                                              <div className="text-center py-4">
                                                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <Button variant="outline" size="sm" onClick={() => window.open(kycDocuments.valid_id, '_blank')}>
                                                  <Download className="w-3 h-3 mr-1" />
                                                  Download Document
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {kycDocuments.proof_of_address && (
                                          <div className="bg-white rounded-lg p-3 border">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-sm font-medium text-gray-600">Proof of Address</span>
                                              <Badge variant="secondary" className="text-xs">Address Proof</Badge>
                                            </div>
                                            {kycDocuments.proof_of_address.includes('.jpg') || kycDocuments.proof_of_address.includes('.jpeg') || kycDocuments.proof_of_address.includes('.png') ? (
                                              <div className="space-y-2">
                                                <img 
                                                  src={kycDocuments.proof_of_address} 
                                                  alt="Proof of Address" 
                                                  className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                                                  onClick={() => window.open(kycDocuments.proof_of_address, '_blank')}
                                                />
                                                <Button variant="outline" size="sm" className="w-full">
                                                  <Eye className="w-3 h-3 mr-1" />
                                                  View Full Size
                                                </Button>
                                              </div>
                                            ) : (
                                              <div className="text-center py-4">
                                                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <Button variant="outline" size="sm" onClick={() => window.open(kycDocuments.proof_of_address, '_blank')}>
                                                  <Download className="w-3 h-3 mr-1" />
                                                  Download Document
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Action Buttons */}
                                  <div className="border-t pt-4 flex space-x-2">
                                    <Button variant="outline" size="sm" className="flex-1">
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Approve KYC
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1">
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject KYC
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Eye className="w-4 h-4 mr-1" />
                                      Full Review
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="verified">
                <Card>
                  <CardHeader>
                    <CardTitle>Verified Users ({verifiedUsers.length})</CardTitle>
                    <CardDescription>Users with completed KYC verification</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingVerifiedUsers ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading verified users...</p>
                      </div>
                    ) : verifiedUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <p className="text-muted-foreground">No verified users at this time.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {verifiedUsers.map((user: any) => (
                          <Card key={user.id} className="border-green-200 bg-green-50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-green-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{user.firstName} {user.lastName}</h4>
                                    <p className="text-sm font-mono text-blue-600 font-medium">{user.userDisplayId || user.id}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                    <p className="text-xs text-muted-foreground">Verified: {new Date(user.updatedAt).toLocaleDateString()}</p>
                                    {user.phpBalance && (
                                      <p className="text-xs text-green-600">Balance: ₱{parseFloat(user.phpBalance).toLocaleString()}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Eye className="w-4 h-4 mr-1" />
                                        View Profile
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center space-x-2">
                                          <CheckCircle className="w-5 h-5 text-green-600" />
                                          <span>Verified User Profile - {user.firstName} {user.lastName}</span>
                                        </DialogTitle>
                                        <DialogDescription>
                                          Complete profile information for verified user {user.userDisplayId || user.id}
                                        </DialogDescription>
                                      </DialogHeader>
                                      
                                      <div className="space-y-6">
                                        {/* User Header */}
                                        <div className="flex items-center space-x-4 bg-green-50 p-4 rounded-lg border border-green-200">
                                          {user.profileImageUrl ? (
                                            <img 
                                              src={user.profileImageUrl} 
                                              alt="Profile" 
                                              className="w-16 h-16 rounded-full object-cover border-2 border-green-300"
                                            />
                                          ) : (
                                            <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                                              <UserIcon className="w-8 h-8 text-green-600" />
                                            </div>
                                          )}
                                          <div>
                                            <h4 className="font-semibold text-lg">{user.firstName} {user.lastName}</h4>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                            <p className="text-xs text-muted-foreground">Account Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                                            <p className="text-xs text-muted-foreground">KYC Verified: {new Date(user.updatedAt).toLocaleDateString()} at {new Date(user.updatedAt).toLocaleTimeString()}</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Verified
                                              </Badge>
                                              {user.isProfileComplete && (
                                                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                                                  Profile Complete
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Personal Information */}
                                        <div className="bg-white rounded-lg p-4 border">
                                          <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                            <UserIcon className="w-4 h-4 mr-2" />
                                            Personal Information
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <span className="font-medium text-gray-600">Full Name:</span>
                                              <p className="text-gray-800">
                                                {user.firstName || user.lastName ? 
                                                  `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
                                                  <span className="text-red-500 italic">Not provided</span>
                                                }
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Email:</span>
                                              <p className="text-gray-800">{user.email}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Phone:</span>
                                              <p className="text-gray-800 flex items-center">
                                                {user.phoneNumber ? (
                                                  <>
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {user.phoneNumber}
                                                  </>
                                                ) : (
                                                  <span className="text-red-500 italic">Not provided</span>
                                                )}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">User ID:</span>
                                              <p className="text-gray-800 font-mono text-sm font-bold text-blue-600">
                                                {user.userDisplayId || user.id}
                                              </p>
                                              <p className="text-xs text-gray-500 mt-1">Internal ID: {user.id}</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Address Information */}
                                        <div className="bg-white rounded-lg p-4 border">
                                          <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            Address Information
                                          </h5>
                                          <div className="text-sm">
                                            <span className="font-medium text-gray-600">Address:</span>
                                            <p className="text-gray-800">
                                              {user.address ? user.address : <span className="text-red-500 italic">Not provided</span>}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Professional Information */}
                                        <div className="bg-white rounded-lg p-4 border">
                                          <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                            <Briefcase className="w-4 h-4 mr-2" />
                                            Professional Information
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <span className="font-medium text-gray-600">Profession:</span>
                                              <p className="text-gray-800">
                                                {user.profession ? user.profession : <span className="text-red-500 italic">Not provided</span>}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Education:</span>
                                              <p className="text-gray-800 flex items-center">
                                                {user.education ? (
                                                  <>
                                                    <GraduationCap className="w-3 h-3 mr-1" />
                                                    {user.education}
                                                  </>
                                                ) : (
                                                  <span className="text-red-500 italic">Not provided</span>
                                                )}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Organization:</span>
                                              <p className="text-gray-800 flex items-center">
                                                {user.organizationName ? (
                                                  <>
                                                    <Building className="w-3 h-3 mr-1" />
                                                    {user.organizationName}
                                                    {user.organizationType && (
                                                      <Badge variant="secondary" className="ml-2 text-xs">
                                                        {user.organizationType}
                                                      </Badge>
                                                    )}
                                                  </>
                                                ) : (
                                                  <span className="text-red-500 italic">Not provided</span>
                                                )}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">LinkedIn:</span>
                                              {user.linkedinProfile ? (
                                                <a 
                                                  href={user.linkedinProfile} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:text-blue-800 flex items-center"
                                                >
                                                  <Linkedin className="w-3 h-3 mr-1" />
                                                  {user.linkedinProfile}
                                                  <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                              ) : (
                                                <span className="text-red-500 italic">Not provided</span>
                                              )}
                                            </div>
                                            <div className="md:col-span-2">
                                              <span className="font-medium text-gray-600">Work Experience:</span>
                                              <p className="text-gray-800">
                                                {user.workExperience ? user.workExperience : <span className="text-red-500 italic">Not provided</span>}
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Account Information */}
                                        <div className="bg-white rounded-lg p-4 border">
                                          <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                            <Wallet className="w-4 h-4 mr-2" />
                                            Account Information
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <span className="font-medium text-gray-600">Account Created:</span>
                                              <p className="text-gray-800 flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(user.createdAt).toLocaleDateString()}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Last Updated:</span>
                                              <p className="text-gray-800">{new Date(user.updatedAt).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">PHP Balance:</span>
                                              <p className="text-gray-800">₱{parseFloat(user.phpBalance || "0").toLocaleString()}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Profile Status:</span>
                                              <p className="text-gray-800">
                                                {user.isProfileComplete ? "Complete" : "Incomplete"}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">KYC Status:</span>
                                              <p className="text-gray-800 text-green-600 font-medium">Verified</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Account Status:</span>
                                              <p className="text-gray-800">{user.accountStatus || 'Active'}</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Documents Section */}
                                        {(() => {
                                          const kycDocuments = user.kycDocuments ? JSON.parse(user.kycDocuments) : {};
                                          return (
                                            <div className="border-t pt-4">
                                              <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                                <FileText className="w-4 h-4 mr-2" />
                                                KYC Documents
                                              </h5>
                                              {Object.keys(kycDocuments).length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  {Object.entries(kycDocuments).map(([docType, docUrl]) => {
                                                    const isImage = typeof docUrl === 'string' && (docUrl.includes('.jpg') || docUrl.includes('.png') || docUrl.includes('.jpeg'));
                                                    return (
                                                      <div key={docType} className="border rounded-lg p-3 bg-gray-50">
                                                        <div className="flex items-center justify-between mb-2">
                                                          <h6 className="font-medium text-sm capitalize text-gray-700">
                                                            {docType.replace('_', ' ')}
                                                          </h6>
                                                          <Badge variant="secondary" className="text-xs">
                                                            {isImage ? 'Image' : 'Document'}
                                                          </Badge>
                                                        </div>
                                                        {isImage ? (
                                                          <div className="space-y-2">
                                                            <img 
                                                              src={docUrl} 
                                                              alt={docType}
                                                              className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                                                              onClick={() => window.open(docUrl, '_blank')}
                                                              onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                target.nextElementSibling!.textContent = 'Image failed to load';
                                                              }}
                                                            />
                                                            <p className="text-xs text-gray-500 hidden">Image failed to load</p>
                                                            <button
                                                              onClick={() => window.open(docUrl, '_blank')}
                                                              className="w-full flex items-center justify-center px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                                            >
                                                              <Eye className="w-3 h-3 mr-1" />
                                                              View Full Size
                                                            </button>
                                                          </div>
                                                        ) : (
                                                          <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600">{docType.replace('_', ' ')}</span>
                                                            <button
                                                              onClick={() => window.open(docUrl, '_blank')}
                                                              className="flex items-center px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                                            >
                                                              <Download className="w-3 h-3 mr-1" />
                                                              Download
                                                            </button>
                                                          </div>
                                                        )}
                                                        <p className="text-xs text-gray-500 mt-2 break-all">{docUrl}</p>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              ) : (
                                                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                                                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                  <p className="text-sm text-gray-500 font-medium">No KYC documents on file</p>
                                                  <p className="text-xs text-gray-500 mt-1">Documents may have been processed or removed after verification</p>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rejected">
                <Card>
                  <CardHeader>
                    <CardTitle>Rejected KYC Applications ({rejectedKYC.length})</CardTitle>
                    <CardDescription>Users whose KYC verification was rejected</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingRejectedKYC ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading rejected KYC applications...</p>
                      </div>
                    ) : rejectedKYC.length === 0 ? (
                      <div className="text-center py-8">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-muted-foreground">No rejected KYC applications at this time.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {rejectedKYC.map((user: any) => (
                          <Card key={user.id} className="border-red-200 bg-red-50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-red-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{user.firstName} {user.lastName}</h4>
                                    <p className="text-sm font-mono text-blue-600 font-medium">{user.userDisplayId || user.id}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                    <p className="text-xs text-muted-foreground">Rejected: {new Date(user.updatedAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Rejected
                                  </Badge>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Eye className="w-4 h-4 mr-1" />
                                        View User Details
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center space-x-2">
                                          <XCircle className="w-5 h-5 text-red-600" />
                                          <span>Rejected User Details - {user.firstName} {user.lastName}</span>
                                        </DialogTitle>
                                        <DialogDescription>
                                          Complete profile information for rejected user {user.userDisplayId || user.id}
                                        </DialogDescription>
                                      </DialogHeader>
                                      
                                      <div className="space-y-6">
                                        {/* User Header */}
                                        <div className="flex items-center space-x-4 bg-red-50 p-4 rounded-lg border border-red-200">
                                          {user.profileImageUrl ? (
                                            <img 
                                              src={user.profileImageUrl} 
                                              alt="Profile" 
                                              className="w-16 h-16 rounded-full object-cover border-2 border-red-300"
                                            />
                                          ) : (
                                            <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center">
                                              <UserIcon className="w-8 h-8 text-red-600" />
                                            </div>
                                          )}
                                          <div>
                                            <h4 className="font-semibold text-lg">{user.firstName} {user.lastName}</h4>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                            <p className="text-xs text-muted-foreground">Account Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                                            <p className="text-xs text-muted-foreground">KYC Rejected: {user.processedAt ? `${new Date(user.processedAt).toLocaleDateString()} at ${new Date(user.processedAt).toLocaleTimeString()}` : new Date(user.updatedAt).toLocaleDateString()}</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Rejected
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Rejection Information */}
                                        <div className="bg-red-100 rounded-lg p-4 border border-red-300">
                                          <h5 className="font-medium text-sm text-red-800 mb-3 flex items-center">
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Rejection Details
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <span className="font-medium text-red-700">Rejection Reason:</span>
                                              <p className="text-red-800">
                                                {user.rejectionReason || <span className="italic">No reason provided</span>}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-red-700">Processed By:</span>
                                              <p className="text-red-800">
                                                {user.processedByAdmin || <span className="italic">Unknown admin</span>}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-red-700">Processed Date:</span>
                                              <p className="text-red-800">
                                                {user.processedAt ? 
                                                  `${new Date(user.processedAt).toLocaleDateString()} at ${new Date(user.processedAt).toLocaleTimeString()}` : 
                                                  new Date(user.updatedAt).toLocaleDateString()
                                                }
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Personal Information */}
                                        <div className="bg-white rounded-lg p-4 border">
                                          <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                            <UserIcon className="w-4 h-4 mr-2" />
                                            Personal Information
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <span className="font-medium text-gray-600">Full Name:</span>
                                              <p className="text-gray-800">
                                                {user.firstName || user.lastName ? 
                                                  `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
                                                  <span className="text-red-500 italic">Not provided</span>
                                                }
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Email:</span>
                                              <p className="text-gray-800">{user.email}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Phone:</span>
                                              <p className="text-gray-800 flex items-center">
                                                {user.phoneNumber ? (
                                                  <>
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {user.phoneNumber}
                                                  </>
                                                ) : (
                                                  <span className="text-red-500 italic">Not provided</span>
                                                )}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">User ID:</span>
                                              <p className="text-gray-800 font-mono text-sm font-bold text-blue-600">
                                                {user.userDisplayId || user.id}
                                              </p>
                                              <p className="text-xs text-gray-500 mt-1">Internal ID: {user.id}</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Address Information */}
                                        <div className="bg-white rounded-lg p-4 border">
                                          <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            Address Information
                                          </h5>
                                          <div className="text-sm">
                                            <span className="font-medium text-gray-600">Address:</span>
                                            <p className="text-gray-800">
                                              {user.address ? user.address : <span className="text-red-500 italic">Not provided</span>}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Professional Information */}
                                        <div className="bg-white rounded-lg p-4 border">
                                          <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                            <Briefcase className="w-4 h-4 mr-2" />
                                            Professional Information
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <span className="font-medium text-gray-600">Profession:</span>
                                              <p className="text-gray-800">
                                                {user.profession ? user.profession : <span className="text-red-500 italic">Not provided</span>}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Education:</span>
                                              <p className="text-gray-800 flex items-center">
                                                {user.education ? (
                                                  <>
                                                    <GraduationCap className="w-3 h-3 mr-1" />
                                                    {user.education}
                                                  </>
                                                ) : (
                                                  <span className="text-red-500 italic">Not provided</span>
                                                )}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Organization:</span>
                                              <p className="text-gray-800 flex items-center">
                                                {user.organizationName ? (
                                                  <>
                                                    <Building className="w-3 h-3 mr-1" />
                                                    {user.organizationName}
                                                    {user.organizationType && (
                                                      <Badge variant="secondary" className="ml-2 text-xs">
                                                        {user.organizationType}
                                                      </Badge>
                                                    )}
                                                  </>
                                                ) : (
                                                  <span className="text-red-500 italic">Not provided</span>
                                                )}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">LinkedIn:</span>
                                              {user.linkedinProfile ? (
                                                <a 
                                                  href={user.linkedinProfile} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:text-blue-800 flex items-center"
                                                >
                                                  <Linkedin className="w-3 h-3 mr-1" />
                                                  {user.linkedinProfile}
                                                  <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                              ) : (
                                                <span className="text-red-500 italic">Not provided</span>
                                              )}
                                            </div>
                                            <div className="md:col-span-2">
                                              <span className="font-medium text-gray-600">Work Experience:</span>
                                              <p className="text-gray-800">
                                                {user.workExperience ? user.workExperience : <span className="text-red-500 italic">Not provided</span>}
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Account Information */}
                                        <div className="bg-white rounded-lg p-4 border">
                                          <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                            <Wallet className="w-4 h-4 mr-2" />
                                            Account Information
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <span className="font-medium text-gray-600">Account Created:</span>
                                              <p className="text-gray-800 flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(user.createdAt).toLocaleDateString()}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Last Updated:</span>
                                              <p className="text-gray-800">{new Date(user.updatedAt).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">PHP Balance:</span>
                                              <p className="text-gray-800">₱{parseFloat(user.phpBalance || "0").toLocaleString()}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Profile Status:</span>
                                              <p className="text-gray-800">
                                                {user.isProfileComplete ? "Complete" : "Incomplete"}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">KYC Status:</span>
                                              <p className="text-gray-800 text-red-600 font-medium">Rejected</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Account Status:</span>
                                              <p className="text-gray-800">{user.accountStatus || 'Active'}</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Documents Section */}
                                        {(() => {
                                          const kycDocuments = user.kycDocuments ? JSON.parse(user.kycDocuments) : {};
                                          return (
                                            <div className="border-t pt-4">
                                              <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                                <FileText className="w-4 h-4 mr-2" />
                                                KYC Documents
                                              </h5>
                                              {Object.keys(kycDocuments).length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  {Object.entries(kycDocuments).map(([docType, docUrl]) => {
                                                    const isImage = typeof docUrl === 'string' && (docUrl.includes('.jpg') || docUrl.includes('.png') || docUrl.includes('.jpeg'));
                                                    return (
                                                      <div key={docType} className="border rounded-lg p-3 bg-gray-50">
                                                        <div className="flex items-center justify-between mb-2">
                                                          <h6 className="font-medium text-sm capitalize text-gray-700">
                                                            {docType.replace('_', ' ')}
                                                          </h6>
                                                          <Badge variant="secondary" className="text-xs">
                                                            {isImage ? 'Image' : 'Document'}
                                                          </Badge>
                                                        </div>
                                                        {isImage ? (
                                                          <div className="space-y-2">
                                                            <img 
                                                              src={docUrl} 
                                                              alt={docType}
                                                              className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                                                              onClick={() => window.open(docUrl, '_blank')}
                                                              onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                target.nextElementSibling!.textContent = 'Image failed to load';
                                                              }}
                                                            />
                                                            <p className="text-xs text-gray-500 hidden">Image failed to load</p>
                                                            <button
                                                              onClick={() => window.open(docUrl, '_blank')}
                                                              className="w-full flex items-center justify-center px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                                            >
                                                              <Eye className="w-3 h-3 mr-1" />
                                                              View Full Size
                                                            </button>
                                                          </div>
                                                        ) : (
                                                          <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600">{docType.replace('_', ' ')}</span>
                                                            <button
                                                              onClick={() => window.open(docUrl, '_blank')}
                                                              className="flex items-center px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                                            >
                                                              <Download className="w-3 h-3 mr-1" />
                                                              Download
                                                            </button>
                                                          </div>
                                                        )}
                                                        <p className="text-xs text-gray-500 mt-2 break-all">{docUrl}</p>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              ) : (
                                                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                                                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                  <p className="text-sm text-gray-500 font-medium">No KYC documents on file</p>
                                                  <p className="text-xs text-gray-500 mt-1">Documents may have been removed after rejection</p>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="suspended">
                <Card>
                  <CardHeader>
                    <CardTitle>Suspended Users ({suspendedUsers.length})</CardTitle>
                    <CardDescription>Users with suspended accounts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSuspendedUsers ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading suspended users...</p>
                      </div>
                    ) : suspendedUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                        <p className="text-muted-foreground">No suspended users at this time.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {suspendedUsers.map((user: any) => (
                          <Card key={user.id} className="border-yellow-200 bg-yellow-50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-yellow-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{user.firstName} {user.lastName}</h4>
                                    <p className="text-sm font-mono text-blue-600 font-medium">{user.userDisplayId || user.id}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                    <p className="text-xs text-muted-foreground">Suspended: {new Date(user.updatedAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Suspended
                                  </Badge>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Eye className="w-4 h-4 mr-1" />
                                        View User Details
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center space-x-2">
                                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                          <span>Suspended User Details - {user.firstName} {user.lastName}</span>
                                        </DialogTitle>
                                        <DialogDescription>
                                          Complete profile information for suspended user {user.userDisplayId || user.id}
                                        </DialogDescription>
                                      </DialogHeader>
                                      
                                      <div className="space-y-6">
                                        {/* User Header */}
                                        <div className="flex items-center space-x-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                          {user.profileImageUrl ? (
                                            <img 
                                              src={user.profileImageUrl} 
                                              alt="Profile" 
                                              className="w-16 h-16 rounded-full object-cover border-2 border-yellow-300"
                                            />
                                          ) : (
                                            <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center">
                                              <UserIcon className="w-8 h-8 text-yellow-600" />
                                            </div>
                                          )}
                                          <div>
                                            <h4 className="font-semibold text-lg">{user.firstName} {user.lastName}</h4>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                            <p className="text-xs text-muted-foreground">Account Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                                            <p className="text-xs text-muted-foreground">Account Suspended: {user.suspendedAt ? `${new Date(user.suspendedAt).toLocaleDateString()} at ${new Date(user.suspendedAt).toLocaleTimeString()}` : new Date(user.updatedAt).toLocaleDateString()}</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                              <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                Suspended
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Suspension Information */}
                                        <div className="bg-yellow-100 rounded-lg p-4 border border-yellow-300">
                                          <h5 className="font-medium text-sm text-yellow-800 mb-3 flex items-center">
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            Suspension Details
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <span className="font-medium text-yellow-700">Suspension Reason:</span>
                                              <p className="text-yellow-800">
                                                {user.suspensionReason || <span className="italic">No reason provided</span>}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-yellow-700">Processed By:</span>
                                              <p className="text-yellow-800">
                                                {user.processedByAdmin || <span className="italic">Unknown admin</span>}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-yellow-700">Suspended Date:</span>
                                              <p className="text-yellow-800">
                                                {user.suspendedAt ? 
                                                  `${new Date(user.suspendedAt).toLocaleDateString()} at ${new Date(user.suspendedAt).toLocaleTimeString()}` : 
                                                  new Date(user.updatedAt).toLocaleDateString()
                                                }
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Personal Information */}
                                        <div className="bg-white rounded-lg p-4 border">
                                          <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                            <UserIcon className="w-4 h-4 mr-2" />
                                            Personal Information
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <span className="font-medium text-gray-600">Full Name:</span>
                                              <p className="text-gray-800">
                                                {user.firstName || user.lastName ? 
                                                  `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
                                                  <span className="text-red-500 italic">Not provided</span>
                                                }
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Email:</span>
                                              <p className="text-gray-800">{user.email}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Phone:</span>
                                              <p className="text-gray-800 flex items-center">
                                                {user.phoneNumber ? (
                                                  <>
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {user.phoneNumber}
                                                  </>
                                                ) : (
                                                  <span className="text-red-500 italic">Not provided</span>
                                                )}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">User ID:</span>
                                              <p className="text-gray-800 font-mono text-sm font-bold text-blue-600">
                                                {user.userDisplayId || user.id}
                                              </p>
                                              <p className="text-xs text-gray-500 mt-1">Internal ID: {user.id}</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Address Information */}
                                        <div className="bg-white rounded-lg p-4 border">
                                          <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            Address Information
                                          </h5>
                                          <div className="text-sm">
                                            <span className="font-medium text-gray-600">Address:</span>
                                            <p className="text-gray-800">
                                              {user.address ? user.address : <span className="text-red-500 italic">Not provided</span>}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Professional Information */}
                                        <div className="bg-white rounded-lg p-4 border">
                                          <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                            <Briefcase className="w-4 h-4 mr-2" />
                                            Professional Information
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <span className="font-medium text-gray-600">Profession:</span>
                                              <p className="text-gray-800">
                                                {user.profession ? user.profession : <span className="text-red-500 italic">Not provided</span>}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Education:</span>
                                              <p className="text-gray-800 flex items-center">
                                                {user.education ? (
                                                  <>
                                                    <GraduationCap className="w-3 h-3 mr-1" />
                                                    {user.education}
                                                  </>
                                                ) : (
                                                  <span className="text-red-500 italic">Not provided</span>
                                                )}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Organization:</span>
                                              <p className="text-gray-800 flex items-center">
                                                {user.organizationName ? (
                                                  <>
                                                    <Building className="w-3 h-3 mr-1" />
                                                    {user.organizationName}
                                                    {user.organizationType && (
                                                      <Badge variant="secondary" className="ml-2 text-xs">
                                                        {user.organizationType}
                                                      </Badge>
                                                    )}
                                                  </>
                                                ) : (
                                                  <span className="text-red-500 italic">Not provided</span>
                                                )}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">LinkedIn:</span>
                                              {user.linkedinProfile ? (
                                                <a 
                                                  href={user.linkedinProfile} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:text-blue-800 flex items-center"
                                                >
                                                  <Linkedin className="w-3 h-3 mr-1" />
                                                  {user.linkedinProfile}
                                                  <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                              ) : (
                                                <span className="text-red-500 italic">Not provided</span>
                                              )}
                                            </div>
                                            <div className="md:col-span-2">
                                              <span className="font-medium text-gray-600">Work Experience:</span>
                                              <p className="text-gray-800">
                                                {user.workExperience ? user.workExperience : <span className="text-red-500 italic">Not provided</span>}
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Account Information */}
                                        <div className="bg-white rounded-lg p-4 border">
                                          <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                            <Wallet className="w-4 h-4 mr-2" />
                                            Account Information
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <span className="font-medium text-gray-600">Account Created:</span>
                                              <p className="text-gray-800 flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(user.createdAt).toLocaleDateString()}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Last Updated:</span>
                                              <p className="text-gray-800">{new Date(user.updatedAt).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">PHP Balance:</span>
                                              <p className="text-gray-800">₱{parseFloat(user.phpBalance || "0").toLocaleString()}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Profile Status:</span>
                                              <p className="text-gray-800">
                                                {user.isProfileComplete ? "Complete" : "Incomplete"}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">KYC Status:</span>
                                              <p className="text-gray-800">{user.kycStatus || 'Pending'}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-600">Account Status:</span>
                                              <p className="text-yellow-600 font-medium">Suspended</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Documents Section */}
                                        {(() => {
                                          const kycDocuments = user.kycDocuments ? JSON.parse(user.kycDocuments) : {};
                                          return (
                                            <div className="border-t pt-4">
                                              <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                                <FileText className="w-4 h-4 mr-2" />
                                                KYC Documents
                                              </h5>
                                              {Object.keys(kycDocuments).length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  {Object.entries(kycDocuments).map(([docType, docUrl]) => {
                                                    const isImage = typeof docUrl === 'string' && (docUrl.includes('.jpg') || docUrl.includes('.png') || docUrl.includes('.jpeg'));
                                                    return (
                                                      <div key={docType} className="border rounded-lg p-3 bg-gray-50">
                                                        <div className="flex items-center justify-between mb-2">
                                                          <h6 className="font-medium text-sm capitalize text-gray-700">
                                                            {docType.replace('_', ' ')}
                                                          </h6>
                                                          <Badge variant="secondary" className="text-xs">
                                                            {isImage ? 'Image' : 'Document'}
                                                          </Badge>
                                                        </div>
                                                        {isImage ? (
                                                          <div className="space-y-2">
                                                            <img 
                                                              src={docUrl} 
                                                              alt={docType}
                                                              className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                                                              onClick={() => window.open(docUrl, '_blank')}
                                                              onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                target.nextElementSibling!.textContent = 'Image failed to load';
                                                              }}
                                                            />
                                                            <p className="text-xs text-gray-500 hidden">Image failed to load</p>
                                                            <button
                                                              onClick={() => window.open(docUrl, '_blank')}
                                                              className="w-full flex items-center justify-center px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                                            >
                                                              <Eye className="w-3 h-3 mr-1" />
                                                              View Full Size
                                                            </button>
                                                          </div>
                                                        ) : (
                                                          <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600">{docType.replace('_', ' ')}</span>
                                                            <button
                                                              onClick={() => window.open(docUrl, '_blank')}
                                                              className="flex items-center px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                                            >
                                                              <Download className="w-3 h-3 mr-1" />
                                                              Download
                                                            </button>
                                                          </div>
                                                        )}
                                                        <p className="text-xs text-gray-500 mt-2 break-all">{docUrl}</p>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              ) : (
                                                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                                                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                  <p className="text-sm text-gray-500 font-medium">No KYC documents on file</p>
                                                  <p className="text-xs text-gray-500 mt-1">Documents may not be available or were removed</p>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </div>

      {/* Campaign Details Modal */}
      <Dialog open={showCampaignViewer} onOpenChange={setShowCampaignViewer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Campaign Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>ID:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{selectedCampaign.id}</code></div>
                      <div><strong>Title:</strong> {selectedCampaign.title}</div>
                      <div><strong>Goal:</strong> ₱{parseFloat(selectedCampaign.goalAmount).toLocaleString()}</div>
                      <div><strong>Current:</strong> ₱{parseFloat(selectedCampaign.currentAmount || '0').toLocaleString()}</div>
                      <div><strong>Category:</strong> <Badge variant="secondary">{selectedCampaign.category}</Badge></div>
                      <div><strong>Status:</strong> <Badge variant={selectedCampaign.status === 'active' ? 'default' : 'destructive'}>{selectedCampaign.status}</Badge></div>
                      <div><strong>Created:</strong> {new Date(selectedCampaign.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Creator Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Name:</strong> {selectedCampaign.creatorName}</div>
                      <div><strong>Email:</strong> {selectedCampaign.creatorEmail}</div>
                      <div><strong>KYC Status:</strong> <Badge variant={selectedCampaign.creatorKycStatus === 'verified' ? 'default' : 'destructive'}>{selectedCampaign.creatorKycStatus}</Badge></div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg">
                  {selectedCampaign.description}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction Details Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Transaction Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Transaction ID:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{selectedTransaction.id}</code></div>
                    <div><strong>Type:</strong> <Badge variant="outline">{selectedTransaction.type}</Badge></div>
                    <div><strong>Amount:</strong> <span className="font-medium text-green-600">₱{parseFloat(selectedTransaction.amount).toLocaleString()}</span></div>
                    <div><strong>Status:</strong> <Badge variant={selectedTransaction.status === 'completed' ? 'default' : 'destructive'}>{selectedTransaction.status}</Badge></div>
                    <div><strong>Method:</strong> {selectedTransaction.method}</div>
                    {selectedTransaction.referenceId && (
                      <div><strong>Reference ID:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{selectedTransaction.referenceId}</code></div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>User ID:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{selectedTransaction.user?.id}</code></div>
                    <div><strong>KYC Status:</strong> <Badge variant="outline">{selectedTransaction.user?.kycStatus}</Badge></div>
                    {selectedTransaction.user?.phpBalance !== undefined && (
                      <div><strong>PHP Balance:</strong> {selectedTransaction.user?.phpBalance} PHP</div>
                    )}
                  </CardContent>
                </Card>
              </div>

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
