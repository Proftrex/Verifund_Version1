import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  TrendingUp, 
  DollarSign,
  FileText,
  Shield,
  UserPlus,
  Flag,
  MessageSquare,
  BookOpen,
  Settings,
  Target,
  Star,
  Award,
  BarChart3,
  Crown,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  UserX,
  Heart,
  BarChart
} from "lucide-react";
import type { User } from "@shared/schema";

// VeriFund Main Page Component - Admin Dashboard
function VeriFundMainPage() {
  const { user } = useAuth();
  
  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/analytics'],
    retry: false,
  });

  return (
    <div className="space-y-6">
      {/* Top Section: Profile Info (Left) + Milestones & Analytics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Panel - Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Picture & Tag */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={(user as any)?.profileImageUrl} />
                <AvatarFallback className="text-lg">
                  {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{(user as any)?.firstName} {(user as any)?.lastName}</h3>
                <Badge variant={(user as any)?.isAdmin ? "default" : "secondary"} className="mt-1">
                  {(user as any)?.isAdmin ? "Admin" : "Support"}
                </Badge>
              </div>
            </div>
            
            {/* Profile Details */}
            <div className="space-y-3 pt-4 border-t">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div><span className="font-medium text-gray-600">Start Date:</span> {new Date().toLocaleDateString()}</div>
                <div><span className="font-medium text-gray-600">Birthday:</span> Not specified</div>
                <div><span className="font-medium text-gray-600">Address:</span> Not specified</div>
                <div><span className="font-medium text-gray-600">Contact:</span> Not specified</div>
                <div><span className="font-medium text-gray-600">Email:</span> {(user as any)?.email}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Milestones + Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Milestones & Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Milestones Section */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Milestones</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>First KYC Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>First Creator Report Created</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span>First Campaign Approved</span>
                </div>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-3">Analytics</h4>
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <span className="text-gray-600">Verified Users</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">Volunteer Reports</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">Creator Reports</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">User Reports</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">Suspended Accounts</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">Fraud Reports</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-gray-600">Deposits</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">Withdrawals</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">Contributions & Tips</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">Claimed Contributions</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">Claimed Tips</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: 3 Leaderboard Panels Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KYC Evaluations Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              🏆 Most KYC Evaluations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1,2,3,4,5,6,7,8,9,10].map((rank) => (
                <div key={rank} className="flex justify-between items-center text-sm py-1">
                  <span className="text-gray-600">#{rank} Staff Member {rank}</span>
                  <span className="font-medium">{100 - rank * 5}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reports Accommodated Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              📋 Most Reports Accommodated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1,2,3,4,5,6,7,8,9,10].map((rank) => (
                <div key={rank} className="flex justify-between items-center text-sm py-1">
                  <span className="text-gray-600">#{rank} Staff Member {rank}</span>
                  <span className="font-medium">{80 - rank * 3}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fastest Resolve Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              ⚡ Fastest to Resolve Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1,2,3,4,5,6,7,8,9,10].map((rank) => (
                <div key={rank} className="flex justify-between items-center text-sm py-1">
                  <span className="text-gray-600">#{rank} Staff Member {rank}</span>
                  <span className="font-medium">{rank * 2}h avg</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// My Works Section Component - Section 2
function MyWorksSection() {
  const [activeTab, setActiveTab] = useState("pending-kyc");
  
  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/my-works/analytics'],
    retry: false,
  });

  const { data: claimedKyc = [] } = useQuery({
    queryKey: ['/api/admin/my-works/kyc-claimed'],
    retry: false,
  });

  const { data: claimedReports = [] } = useQuery({
    queryKey: ['/api/admin/my-works/reports-claimed'],
    retry: false,
  });

  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">My Works</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Track and manage all your claimed assignments including KYC verifications, reports reviews, 
          and various administrative tasks. Monitor your productivity and claimed workload.
        </p>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">KYC</p>
            <p className="text-xl font-bold">{analytics?.kyc || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Document Reports</p>
            <p className="text-xl font-bold">{analytics?.documents || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Creator Reports</p>
            <p className="text-xl font-bold">{analytics?.campaigns || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Volunteer Reports</p>
            <p className="text-xl font-bold">{analytics?.volunteers || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Flag className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">User Reports</p>
            <p className="text-xl font-bold">{analytics?.userReports || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Transaction Reports</p>
            <p className="text-xl font-bold">{analytics?.financial || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Section for Claimed Items */}
      <Card>
        <CardHeader>
          <CardTitle>Claimed Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="pending-kyc">Pending KYC</TabsTrigger>
              <TabsTrigger value="document-reports">Document Reports</TabsTrigger>
              <TabsTrigger value="creator-reports">Creator Reports</TabsTrigger>
              <TabsTrigger value="volunteer-reports">Volunteer Reports</TabsTrigger>
              <TabsTrigger value="user-reports">User Reports</TabsTrigger>
              <TabsTrigger value="transaction-reports">Transaction Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="pending-kyc" className="mt-4">
              <div className="space-y-3">
                {claimedKyc.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pending KYC requests claimed</p>
                ) : (
                  claimedKyc.map((kyc: any) => (
                    <div key={kyc.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{kyc.firstName} {kyc.lastName}</h4>
                          <p className="text-sm text-gray-600">User ID: {kyc.userDisplayId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{kyc.status}</Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleExpanded(kyc.id)}
                          >
                            {expandedItems.includes(kyc.id) ? "Hide Details" : "View Details"}
                          </Button>
                        </div>
                      </div>
                      {expandedItems.includes(kyc.id) && (
                        <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                          <p><strong>Email:</strong> {kyc.email}</p>
                          <p><strong>Status:</strong> {kyc.status}</p>
                          <p><strong>Submitted:</strong> {new Date(kyc.createdAt).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="document-reports" className="mt-4">
              <div className="space-y-3">
                {claimedReports.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No document reports claimed</p>
                ) : (
                  claimedReports.map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Document Report #{report.id.slice(0, 8)}</h4>
                          <p className="text-sm text-gray-600">Type: {report.reportType || 'Document'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{report.status}</Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleExpanded(report.id)}
                          >
                            {expandedItems.includes(report.id) ? "Hide Details" : "View Details"}
                          </Button>
                        </div>
                      </div>
                      {expandedItems.includes(report.id) && (
                        <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                          <p><strong>Description:</strong> Document verification report</p>
                          <p><strong>Priority:</strong> Normal</p>
                          <p><strong>Created:</strong> {new Date().toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="creator-reports" className="mt-4">
              <div className="space-y-3">
                <p className="text-center text-gray-500 py-8">No creator reports claimed</p>
              </div>
            </TabsContent>

            <TabsContent value="volunteer-reports" className="mt-4">
              <div className="space-y-3">
                <p className="text-center text-gray-500 py-8">No volunteer reports claimed</p>
              </div>
            </TabsContent>

            <TabsContent value="user-reports" className="mt-4">
              <div className="space-y-3">
                <p className="text-center text-gray-500 py-8">No user reports claimed</p>
              </div>
            </TabsContent>

            <TabsContent value="transaction-reports" className="mt-4">
              <div className="space-y-3">
                <p className="text-center text-gray-500 py-8">No transaction reports claimed</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// KYC Management Section - Section 3
function KYCSection() {
  const [activeKycTab, setActiveKycTab] = useState("basic");
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: basicUsers = [] } = useQuery({
    queryKey: ['/api/admin/users/basic'],
    retry: false,
  });

  const { data: pendingKyc = [] } = useQuery({
    queryKey: ['/api/admin/kyc/pending'],
    retry: false,
  });

  const { data: verifiedKyc = [] } = useQuery({
    queryKey: ['/api/admin/kyc/verified'],
    retry: false,
  });

  const { data: rejectedKyc = [] } = useQuery({
    queryKey: ['/api/admin/kyc/rejected'],
    retry: false,
  });

  const { data: suspendedUsers = [] } = useQuery({
    queryKey: ['/api/admin/users/suspended'],
    retry: false,
  });

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const renderUserProfile = (user: any) => (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div>
          <h4 className="font-semibold mb-3">Profile Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.profileImageUrl} />
                <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <p><strong>User ID:</strong> {user.userDisplayId || user.id}</p>
            <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
            <p><strong>Address:</strong> {user.address || 'Not provided'}</p>
            <p><strong>Date of Birth:</strong> {user.dateOfBirth || 'Not provided'}</p>
            <p><strong>Registration Date:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            <p><strong>KYC Status:</strong> <Badge variant={user.kycStatus === 'verified' ? 'default' : 'outline'}>{user.kycStatus || 'pending'}</Badge></p>
          </div>
        </div>

        {/* Platform Scores */}
        <div>
          <h4 className="font-semibold mb-3">Platform Scores</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Creator Rating:</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="font-medium">{user.creatorRating || '0.0'}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Credit Score:</span>
              <Badge variant="outline">{user.creditScore || '0'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Reliability Score:</span>
              <Badge variant="outline">{user.reliabilityScore || '0'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Social Score:</span>
              <Badge variant="outline">{user.socialScore || '0'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Contributions:</span>
              <span className="font-medium">₱{user.totalContributions || '0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Documents */}
      <div>
        <h4 className="font-semibold mb-3">KYC Documents</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Government ID</p>
            {user.governmentIdUrl ? (
              <img src={user.governmentIdUrl} alt="Government ID" className="w-full h-32 object-cover rounded" />
            ) : (
              <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                No document uploaded
              </div>
            )}
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Proof of Address</p>
            {user.proofOfAddressUrl ? (
              <img src={user.proofOfAddressUrl} alt="Proof of Address" className="w-full h-32 object-cover rounded" />
            ) : (
              <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                No document uploaded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div>
        <h4 className="font-semibold mb-3">Activity Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <p className="font-medium">{user.campaignsCreated || 0}</p>
            <p className="text-gray-600">Campaigns Created</p>
          </div>
          <div className="text-center">
            <p className="font-medium">{user.contributionsMade || 0}</p>
            <p className="text-gray-600">Contributions Made</p>
          </div>
          <div className="text-center">
            <p className="font-medium">{user.volunteersJoined || 0}</p>
            <p className="text-gray-600">Volunteer Activities</p>
          </div>
          <div className="text-center">
            <p className="font-medium">{user.reportsSubmitted || 0}</p>
            <p className="text-gray-600">Reports Submitted</p>
          </div>
        </div>
      </div>
    </div>
  );

  const handleClaimKyc = async (userId: string) => {
    try {
      // Add claim logic here
      toast({
        title: "KYC Request Claimed",
        description: "You have successfully claimed this KYC request for review.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim KYC request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderUserList = (users: any[], showKycStatus = true, showClaimButton = false) => (
    <div className="space-y-3">
      {users.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No users found</p>
      ) : (
        users.map((user: any) => (
          <div key={user.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profileImageUrl} />
                  <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{user.firstName} {user.lastName}</h4>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {showKycStatus && (
                  <Badge variant={user.kycStatus === 'verified' ? 'default' : user.kycStatus === 'rejected' ? 'destructive' : 'outline'}>
                    {user.kycStatus || 'pending'}
                  </Badge>
                )}
                {showClaimButton && (
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleClaimKyc(user.id)}
                  >
                    CLAIM
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleUserExpanded(user.id)}
                >
                  {expandedUsers.includes(user.id) ? "Hide Details" : "VIEW USER DETAILS"}
                </Button>
              </div>
            </div>
            {expandedUsers.includes(user.id) && renderUserProfile(user)}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">KYC Management</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeKycTab} onValueChange={setActiveKycTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic ({basicUsers.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingKyc.length})</TabsTrigger>
              <TabsTrigger value="verified">Verified ({verifiedKyc.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedKyc.length})</TabsTrigger>
              <TabsTrigger value="suspended">Suspended ({suspendedUsers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-4">
              {renderUserList(basicUsers)}
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              {renderUserList(pendingKyc, true, true)}
            </TabsContent>

            <TabsContent value="verified" className="mt-4">
              {renderUserList(verifiedKyc)}
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              {renderUserList(rejectedKyc)}
            </TabsContent>

            <TabsContent value="suspended" className="mt-4">
              {renderUserList(suspendedUsers, false)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Campaign Management Section - Section 4
function CampaignsSection() {
  const [activeCampaignTab, setActiveCampaignTab] = useState("requests");
  const [expandedCampaigns, setExpandedCampaigns] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: pendingCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/pending'],
    retry: false,
  });

  const { data: activeCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/active'],
    retry: false,
  });

  const { data: inProgressCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/in-progress'],
    retry: false,
  });

  const { data: completedCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/completed'],
    retry: false,
  });

  const { data: closedCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/closed'],
    retry: false,
  });

  const toggleCampaignExpanded = (campaignId: string) => {
    setExpandedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const handleClaimCampaign = async (campaignId: string) => {
    try {
      // Add claim logic here
      toast({
        title: "Campaign Claimed",
        description: "You have successfully claimed this campaign for review.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderCreatorDetails = (creator: any) => (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h5 className="font-semibold mb-3">Creator Profile</h5>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={creator?.profileImageUrl} />
              <AvatarFallback>{creator?.firstName?.[0]}{creator?.lastName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{creator?.firstName} {creator?.lastName}</p>
              <p className="text-gray-600">{creator?.email}</p>
            </div>
          </div>
          <p><strong>User ID:</strong> {creator?.userDisplayId || creator?.id}</p>
          <p><strong>Phone:</strong> {creator?.phone || 'Not provided'}</p>
          <p><strong>KYC Status:</strong> <Badge variant={creator?.kycStatus === 'verified' ? 'default' : 'outline'}>{creator?.kycStatus || 'pending'}</Badge></p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Creator Rating:</strong> 
            <span className="flex items-center gap-1 ml-2">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              {creator?.creatorRating || '0.0'}
            </span>
          </p>
          <p><strong>Credit Score:</strong> {creator?.creditScore || '0'}</p>
          <p><strong>Campaigns Created:</strong> {creator?.campaignsCreated || 0}</p>
          <p><strong>Total Raised:</strong> ₱{creator?.totalRaised || '0'}</p>
        </div>
      </div>
    </div>
  );

  const renderCampaignDetails = (campaign: any) => (
    <div className="mt-4 p-4 bg-green-50 rounded-lg">
      <h5 className="font-semibold mb-3">Campaign Details</h5>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <p><strong>Title:</strong> {campaign.title}</p>
          <p><strong>Category:</strong> <Badge variant="outline">{campaign.category || 'General'}</Badge></p>
          <p><strong>Goal Amount:</strong> ₱{campaign.goalAmount?.toLocaleString() || '0'}</p>
          <p><strong>Current Amount:</strong> ₱{campaign.currentAmount?.toLocaleString() || '0'}</p>
          <p><strong>Created:</strong> {new Date(campaign.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Status:</strong> <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>{campaign.status}</Badge></p>
          <p><strong>Contributors:</strong> {campaign.contributorsCount || 0}</p>
          <p><strong>End Date:</strong> {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'No end date'}</p>
          <p><strong>Progress:</strong> {campaign.goalAmount ? Math.round((campaign.currentAmount / campaign.goalAmount) * 100) : 0}%</p>
        </div>
      </div>
      <div className="mt-3">
        <p><strong>Description:</strong></p>
        <p className="text-sm text-gray-600 mt-1">{campaign.description?.substring(0, 200)}...</p>
      </div>
    </div>
  );

  const renderCampaignList = (campaigns: any[], showClaimButton = false) => (
    <div className="space-y-3">
      {campaigns.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No campaigns found</p>
      ) : (
        campaigns.map((campaign: any) => (
          <div key={campaign.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium mb-1">{campaign.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{campaign.description?.substring(0, 100)}...</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>Goal: ₱{campaign.goalAmount?.toLocaleString() || '0'}</span>
                  <span>Current: ₱{campaign.currentAmount?.toLocaleString() || '0'}</span>
                  <Badge variant="outline">{campaign.category || 'General'}</Badge>
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                {showClaimButton && (
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleClaimCampaign(campaign.id)}
                  >
                    CLAIM
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toggleCampaignExpanded(`creator-${campaign.id}`)}
                  >
                    {expandedCampaigns.includes(`creator-${campaign.id}`) ? "Hide Creator" : "View Creator Details"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toggleCampaignExpanded(`campaign-${campaign.id}`)}
                  >
                    {expandedCampaigns.includes(`campaign-${campaign.id}`) ? "Hide Campaign" : "View Campaign Details"}
                  </Button>
                </div>
              </div>
            </div>
            {expandedCampaigns.includes(`creator-${campaign.id}`) && renderCreatorDetails(campaign.creator)}
            {expandedCampaigns.includes(`campaign-${campaign.id}`) && renderCampaignDetails(campaign)}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Campaign Management</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Campaign Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCampaignTab} onValueChange={setActiveCampaignTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="requests">Campaign Requests ({pendingCampaigns.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeCampaigns.length})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({inProgressCampaigns.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedCampaigns.length})</TabsTrigger>
              <TabsTrigger value="closed">Closed ({closedCampaigns.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-4">
              {renderCampaignList(pendingCampaigns, true)}
            </TabsContent>

            <TabsContent value="active" className="mt-4">
              {renderCampaignList(activeCampaigns)}
            </TabsContent>

            <TabsContent value="in-progress" className="mt-4">
              {renderCampaignList(inProgressCampaigns)}
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              {renderCampaignList(completedCampaigns)}
            </TabsContent>

            <TabsContent value="closed" className="mt-4">
              {renderCampaignList(closedCampaigns)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Volunteer Management Section - Section 5
function VolunteersSection() {
  const [activeVolunteerTab, setActiveVolunteerTab] = useState("opportunities");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const { data: opportunities = [] } = useQuery({
    queryKey: ['/api/admin/volunteer/opportunities'],
    retry: false,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['/api/admin/volunteer/applications'],
    retry: false,
  });

  const { data: favoriteOpportunities = [] } = useQuery({
    queryKey: ['/api/admin/volunteer/favorites'],
    retry: false,
  });

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderVolunteerOpportunityDetails = (opportunity: any) => (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h5 className="font-semibold mb-3">Volunteer Opportunity Details</h5>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <p><strong>Title:</strong> {opportunity.title}</p>
          <p><strong>Campaign:</strong> {opportunity.campaignTitle || 'N/A'}</p>
          <p><strong>Description:</strong> {opportunity.description?.substring(0, 150)}...</p>
          <p><strong>Location:</strong> {opportunity.location || 'Remote'}</p>
          <p><strong>Duration:</strong> {opportunity.duration || 'Flexible'}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Slots Needed:</strong> {opportunity.slotsNeeded || 0}</p>
          <p><strong>Slots Filled:</strong> {opportunity.slotsFilled || 0}</p>
          <p><strong>Status:</strong> <Badge variant="outline">{opportunity.status}</Badge></p>
          <p><strong>Start Date:</strong> {opportunity.startDate ? new Date(opportunity.startDate).toLocaleDateString() : 'TBD'}</p>
          <p><strong>End Date:</strong> {opportunity.endDate ? new Date(opportunity.endDate).toLocaleDateString() : 'TBD'}</p>
        </div>
      </div>
      <div className="mt-3">
        <p><strong>Requirements:</strong></p>
        <p className="text-sm text-gray-600 mt-1">{opportunity.requirements || 'No specific requirements listed'}</p>
      </div>
      <div className="mt-3">
        <p><strong>Creator Information:</strong></p>
        <div className="flex items-center gap-3 mt-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={opportunity.creator?.profileImageUrl} />
            <AvatarFallback>{opportunity.creator?.firstName?.[0]}{opportunity.creator?.lastName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{opportunity.creator?.firstName} {opportunity.creator?.lastName}</p>
            <p className="text-xs text-gray-600">{opportunity.creator?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOpportunitiesList = (opportunities: any[]) => (
    <div className="space-y-3">
      {opportunities.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No volunteer opportunities found</p>
      ) : (
        opportunities.map((opportunity: any) => (
          <div key={opportunity.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium mb-1">{opportunity.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{opportunity.description?.substring(0, 100)}...</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>Slots: {opportunity.slotsFilled || 0}/{opportunity.slotsNeeded || 0}</span>
                  <span>Location: {opportunity.location || 'Remote'}</span>
                  <Badge variant="outline">{opportunity.status}</Badge>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleItemExpanded(`opp-${opportunity.id}`)}
                >
                  {expandedItems.includes(`opp-${opportunity.id}`) ? "Hide Details" : "View Volunteer Opportunity Details"}
                </Button>
              </div>
            </div>
            {expandedItems.includes(`opp-${opportunity.id}`) && renderVolunteerOpportunityDetails(opportunity)}
          </div>
        ))
      )}
    </div>
  );

  const renderApplicationsList = (applications: any[]) => (
    <div className="space-y-3">
      {applications.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No volunteer applications found</p>
      ) : (
        applications.map((application: any) => (
          <div key={application.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={application.volunteer?.profileImageUrl} />
                    <AvatarFallback>{application.volunteer?.firstName?.[0]}{application.volunteer?.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{application.volunteerFirstName} {application.volunteerLastName}</h4>
                    <p className="text-sm text-gray-600">{application.volunteer?.email}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">Applied for: {application.campaignTitle || application.opportunityTitle}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>Applied: {new Date(application.createdAt).toLocaleDateString()}</span>
                  <Badge variant={
                    application.status === 'approved' ? 'default' : 
                    application.status === 'rejected' ? 'destructive' : 'outline'
                  }>
                    {application.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleItemExpanded(`app-${application.id}`)}
                >
                  {expandedItems.includes(`app-${application.id}`) ? "Hide Details" : "View Volunteer Opportunity Details"}
                </Button>
              </div>
            </div>
            {expandedItems.includes(`app-${application.id}`) && renderVolunteerOpportunityDetails(application.opportunity || application)}
          </div>
        ))
      )}
    </div>
  );

  const renderFavoritesList = (favorites: any[]) => (
    <div className="space-y-3">
      {favorites.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No popular volunteer opportunities found</p>
      ) : (
        favorites.map((favorite: any) => (
          <div key={favorite.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium mb-1">{favorite.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{favorite.description?.substring(0, 100)}...</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-green-600">
                    🔥 {favorite.applicationCount || 0} applications
                  </span>
                  <span>Slots: {favorite.slotsFilled || 0}/{favorite.slotsNeeded || 0}</span>
                  <Badge variant="outline">{favorite.status}</Badge>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleItemExpanded(`fav-${favorite.id}`)}
                >
                  {expandedItems.includes(`fav-${favorite.id}`) ? "Hide Details" : "View Volunteer Opportunity Details"}
                </Button>
              </div>
            </div>
            {expandedItems.includes(`fav-${favorite.id}`) && renderVolunteerOpportunityDetails(favorite)}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Volunteer Management</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Volunteer Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeVolunteerTab} onValueChange={setActiveVolunteerTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="opportunities">Opportunities ({opportunities.length})</TabsTrigger>
              <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
              <TabsTrigger value="favorites">Favorites ({favoriteOpportunities.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="opportunities" className="mt-4">
              {renderOpportunitiesList(opportunities)}
            </TabsContent>

            <TabsContent value="applications" className="mt-4">
              {renderApplicationsList(applications)}
            </TabsContent>

            <TabsContent value="favorites" className="mt-4">
              {renderFavoritesList(favoriteOpportunities)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Financial Management Section - Section 6
function FinancialSection() {
  const { data: deposits = [] } = useQuery({
    queryKey: ['/api/admin/financial/deposits'],
    retry: false,
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['/api/admin/financial/withdrawals'],
    retry: false,
  });

  const { data: contributions = [] } = useQuery({
    queryKey: ['/api/admin/financial/contributions'],
    retry: false,
  });

  const { data: tips = [] } = useQuery({
    queryKey: ['/api/admin/financial/tips'],
    retry: false,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Financial Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Deposits ({deposits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deposits.slice(0, 3).map((deposit: any) => (
              <div key={deposit.id} className="flex justify-between items-center py-2">
                <span className="text-sm">₱{deposit.amount}</span>
                <Badge variant="outline">{deposit.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-500" />
              Withdrawals ({withdrawals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.slice(0, 3).map((withdrawal: any) => (
              <div key={withdrawal.id} className="flex justify-between items-center py-2">
                <span className="text-sm">₱{withdrawal.amount}</span>
                <Badge variant="outline">{withdrawal.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-blue-500" />
              Contributions ({contributions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contributions.slice(0, 3).map((contribution: any) => (
              <div key={contribution.id} className="flex justify-between items-center py-2">
                <span className="text-sm">₱{contribution.amount}</span>
                <Badge variant="default">Active</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Tips ({tips.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tips.slice(0, 3).map((tip: any) => (
              <div key={tip.id} className="flex justify-between items-center py-2">
                <span className="text-sm">₱{tip.amount}</span>
                <Badge variant="secondary">Received</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Reports Management Section - Section 7
function ReportsSection() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: reports = [] } = useQuery({
    queryKey: ['/api/admin/reports/all'],
    retry: false,
  });

  const filteredReports = reports.filter((report: any) =>
    report.reportType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.relatedType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reports Management</h2>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No reports found matching your search</p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report: any) => (
            <Card key={report.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-red-500" />
                      <span className="font-medium">{report.reportType}</span>
                      <Badge variant="outline">{report.relatedType}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                    <p className="text-xs text-muted-foreground">Reported: {new Date(report.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={report.status === 'pending' ? 'destructive' : 'default'}>
                      {report.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Support Tickets Section - Section 8
function TicketsSection() {
  const { data: emailTickets = [] } = useQuery({
    queryKey: ['/api/admin/tickets/email'],
    retry: false,
  });

  const { data: supportTickets = [] } = useQuery({
    queryKey: ['/api/admin/tickets/support'],
    retry: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Support Tickets</h2>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-muted-foreground">trexiaamable@gmail.com</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              Email Tickets ({emailTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emailTickets.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No email tickets</p>
            ) : (
              <div className="space-y-3">
                {emailTickets.slice(0, 5).map((ticket: any) => (
                  <div key={ticket.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{ticket.subject}</span>
                      <Badge variant="outline">{ticket.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{ticket.senderEmail}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {new Date(ticket.emailReceivedAt).toLocaleDateString()}
                      </span>
                      <Button size="sm" variant="outline">Claim</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              Support Tickets ({supportTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {supportTickets.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No support tickets</p>
            ) : (
              <div className="space-y-3">
                {supportTickets.slice(0, 5).map((ticket: any) => (
                  <div key={ticket.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{ticket.subject}</span>
                      <Badge variant="outline">{ticket.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{ticket.category}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                      <Button size="sm" variant="outline">Assign</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Stories Management Section - Section 9
function StoriesSection() {
  const { data: stories = [] } = useQuery({
    queryKey: ['/api/admin/stories'],
    retry: false,
  });

  const { data: writers = [] } = useQuery({
    queryKey: ['/api/admin/writers'],
    retry: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Stories Management</h2>
        <Button className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Publish New Article
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Published Stories ({stories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stories.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No published stories</p>
            ) : (
              <div className="space-y-3">
                {stories.slice(0, 5).map((story: any) => (
                  <div key={story.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{story.title}</span>
                      <Badge variant={story.status === 'published' ? 'default' : 'secondary'}>
                        {story.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">By: {story.authorName}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {new Date(story.publishedAt || story.createdAt).toLocaleDateString()}
                      </span>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Writers ({writers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {writers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No writers registered</p>
            ) : (
              <div className="space-y-3">
                {writers.slice(0, 5).map((writer: any) => (
                  <div key={writer.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{writer.firstName} {writer.lastName}</span>
                      <Badge variant="outline">{writer.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{writer.email}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {writer.storiesCount || 0} stories
                      </span>
                      <Button size="sm" variant="outline">Manage</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Access Management Section - Section 10
function AccessSection() {
  const { data: adminUsers = [] } = useQuery({
    queryKey: ['/api/admin/access/admins'],
    retry: false,
  });

  const { data: supportUsers = [] } = useQuery({
    queryKey: ['/api/admin/access/support'],
    retry: false,
  });

  const { data: performanceData = [] } = useQuery({
    queryKey: ['/api/admin/access/performance'],
    retry: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Access Management</h2>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Admin
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Administrators ({adminUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {adminUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No administrators</p>
            ) : (
              <div className="space-y-3">
                {adminUsers.slice(0, 5).map((admin: any) => (
                  <div key={admin.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium">{admin.firstName} {admin.lastName}</span>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                    <Badge variant="destructive">Admin</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Support Staff ({supportUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {supportUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No support staff</p>
            ) : (
              <div className="space-y-3">
                {supportUsers.slice(0, 5).map((support: any) => (
                  <div key={support.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium">{support.firstName} {support.lastName}</span>
                      <p className="text-xs text-muted-foreground">{support.email}</p>
                    </div>
                    <Badge variant="secondary">Support</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-green-500" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No performance data</p>
            ) : (
              <div className="space-y-3">
                {performanceData.slice(0, 5).map((perf: any) => (
                  <div key={perf.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium">{perf.staffName}</span>
                      <p className="text-xs text-muted-foreground">{perf.tasksCompleted} tasks</p>
                    </div>
                    <Badge variant="outline">{perf.rating}/5</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Invite System Section - Section 11
function InviteSection() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("support");
  
  const { data: sentInvites = [] } = useQuery({
    queryKey: ['/api/admin/invites/sent'],
    retry: false,
  });

  const { data: pendingInvites = [] } = useQuery({
    queryKey: ['/api/admin/invites/pending'],
    retry: false,
  });

  const sendInvite = () => {
    // API call to send invite would go here
    console.log(`Sending invite to ${email} as ${role}`);
    setEmail("");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Invite System</h2>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Send New Invitation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="support">Support Staff</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <Button onClick={sendInvite} disabled={!email}>
              <UserPlus className="h-4 w-4 mr-2" />
              Send Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Invitations ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingInvites.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending invitations</p>
            ) : (
              <div className="space-y-3">
                {pendingInvites.slice(0, 5).map((invite: any) => (
                  <div key={invite.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{invite.email}</span>
                      <Badge variant="outline">{invite.role}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Sent: {new Date(invite.sentAt).toLocaleDateString()}
                      </span>
                      <Button size="sm" variant="outline">Resend</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Sent Invitations ({sentInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sentInvites.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No sent invitations</p>
            ) : (
              <div className="space-y-3">
                {sentInvites.slice(0, 5).map((invite: any) => (
                  <div key={invite.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{invite.email}</span>
                      <Badge variant="default">{invite.role}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {invite.acceptedAt ? `Accepted: ${new Date(invite.acceptedAt).toLocaleDateString()}` : 'Pending'}
                      </span>
                      <Badge variant={invite.acceptedAt ? 'default' : 'secondary'}>
                        {invite.acceptedAt ? 'Accepted' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main Admin Component
export default function Admin() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("main");

  // Handle unauthorized access
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
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Extract tab from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated || (!(user as any)?.isAdmin && !(user as any)?.isSupport)) {
    return null;
  }

  const navigationItems = [
    { id: "main", label: "VeriFund", icon: Crown },
    { id: "my-works", label: "My Works", icon: FileText },
    { id: "kyc", label: "KYC", icon: Shield },
    { id: "campaigns", label: "Campaigns", icon: Target },
    { id: "volunteers", label: "Volunteers", icon: Users },
    { id: "financial", label: "Financial", icon: DollarSign },
    { id: "reports", label: "Reports", icon: Flag },
    { id: "tickets", label: "Tickets", icon: MessageSquare },
    { id: "stories", label: "Stories", icon: BookOpen },
    { id: "access", label: "Access", icon: UserPlus },
    { id: "invite", label: "Invite", icon: Mail },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "main": return <VeriFundMainPage />;
      case "my-works": return <MyWorksSection />;
      case "kyc": return <KYCSection />;
      case "campaigns": return <CampaignsSection />;
      case "volunteers": return <VolunteersSection />;
      case "financial": return <FinancialSection />;
      case "reports": return <ReportsSection />;
      case "tickets": return <TicketsSection />;
      case "stories": return <StoriesSection />;
      case "access": return <AccessSection />;
      case "invite": return <InviteSection />;
      default: return <VeriFundMainPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Navigation Menu */}
            <div className="flex items-center space-x-8">
              <nav className="flex items-center space-x-6 overflow-x-auto">
                {navigationItems.map((item) => {
                  return (
                    <a
                      key={item.id}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(item.id);
                      }}
                      className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === item.id
                          ? "text-green-600 border-green-600"
                          : "text-gray-600 border-transparent hover:text-green-600 hover:border-green-300"
                      }`}
                      data-testid={`nav-${item.id}`}
                    >
                      {item.label}
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {(user as any)?.firstName} {(user as any)?.lastName}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          </div>

        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
}