import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  UserX
} from "lucide-react";
import type { User } from "@shared/schema";

// VeriFund Main Page Component - Section 1
function VeriFundMainPage() {
  const { user } = useAuth();
  
  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/analytics'],
    retry: false,
  });

  return (
    <div className="space-y-6">
      {/* VeriFund Logo Header */}
      <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="flex items-center justify-center mb-4">
          <Crown className="h-12 w-12 text-blue-600 mr-3" />
          <h1 className="text-4xl font-bold text-blue-900">VeriFund</h1>
        </div>
        <p className="text-lg text-blue-700">Admin Control Center</p>
      </div>

      {/* Profile, Analytics, Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={(user as any)?.profileImageUrl || ''} />
                <AvatarFallback>{(user as any)?.firstName?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{(user as any)?.firstName} {(user as any)?.lastName}</h3>
                <p className="text-sm text-muted-foreground">{(user as any)?.email}</p>
                <Badge variant="secondary" className="mt-1">
                  {(user as any)?.isAdmin ? 'Admin' : 'Support'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Platform Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Campaigns</span>
                <Badge variant="outline">{analytics?.campaignsCount || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Pending KYC</span>
                <Badge variant="outline">{analytics?.pendingKYC || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Total Users</span>
                <Badge variant="outline">{analytics?.totalUsers || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Admin Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Top KYC Reviewer</span>
              </div>
              <div className="flex items-center gap-3">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Most Reports Resolved</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm">Most Campaigns Reviewed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// My Works Section Component - Section 2
function MyWorksSection() {
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

  return (
    <div className="space-y-6">
      {/* My Works Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">KYC Claimed</p>
                <p className="text-2xl font-bold">{analytics?.kyc || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Reports Claimed</p>
                <p className="text-2xl font-bold">{analytics?.documents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Campaigns</p>
                <p className="text-2xl font-bold">{analytics?.campaigns || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Financial</p>
                <p className="text-2xl font-bold">{analytics?.financial || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claimed Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Claimed KYC Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {claimedKyc.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No claimed KYC requests</p>
            ) : (
              <div className="space-y-2">
                {claimedKyc.slice(0, 5).map((kyc: any) => (
                  <div key={kyc.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{kyc.firstName} {kyc.lastName}</span>
                    <Badge variant="outline">{kyc.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Claimed Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {claimedReports.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No claimed reports</p>
            ) : (
              <div className="space-y-2">
                {claimedReports.slice(0, 5).map((report: any) => (
                  <div key={report.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{report.reportType}</span>
                    <Badge variant="outline">{report.status}</Badge>
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

// KYC Section Component - Section 3
function KYCSection() {
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">KYC Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending ({pendingKyc.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingKyc.slice(0, 3).map((user: any) => (
              <div key={user.id} className="flex justify-between items-center py-2">
                <span className="text-sm">{user.firstName} {user.lastName}</span>
                <Button size="sm" variant="outline">Review</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Verified ({verifiedKyc.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {verifiedKyc.slice(0, 3).map((user: any) => (
              <div key={user.id} className="flex justify-between items-center py-2">
                <span className="text-sm">{user.firstName} {user.lastName}</span>
                <Badge variant="success">Verified</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Rejected ({rejectedKyc.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rejectedKyc.slice(0, 3).map((user: any) => (
              <div key={user.id} className="flex justify-between items-center py-2">
                <span className="text-sm">{user.firstName} {user.lastName}</span>
                <Badge variant="destructive">Rejected</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-gray-500" />
              Suspended ({suspendedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {suspendedUsers.slice(0, 3).map((user: any) => (
              <div key={user.id} className="flex justify-between items-center py-2">
                <span className="text-sm">{user.firstName} {user.lastName}</span>
                <Badge variant="secondary">Suspended</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Placeholder components for other sections (4-11)
function CampaignsSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Campaign Management</h2>
      <p className="text-muted-foreground">Manage campaigns (pending, active, rejected, closed, completed)</p>
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Campaign management features will be implemented next</p>
        </CardContent>
      </Card>
    </div>
  );
}

function VolunteersSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Volunteer Management</h2>
      <p className="text-muted-foreground">Manage volunteer opportunities and applications</p>
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Volunteer management features will be implemented next</p>
        </CardContent>
      </Card>
    </div>
  );
}

function FinancialSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Financial Management</h2>
      <p className="text-muted-foreground">Handle deposits, withdrawals, contributions, and tips</p>
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Financial management features will be implemented next</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Reports Management</h2>
      <p className="text-muted-foreground">All reported items with search functionality</p>
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Reports management features will be implemented next</p>
        </CardContent>
      </Card>
    </div>
  );
}

function TicketsSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Support Tickets</h2>
      <p className="text-muted-foreground">Email tickets from trexiaamable@gmail.com</p>
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Support tickets management will be implemented next</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StoriesSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Stories Management</h2>
      <p className="text-muted-foreground">Publish articles and manage writers</p>
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Stories management features will be implemented next</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AccessSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Access Management</h2>
      <p className="text-muted-foreground">Admin/support list and performance tracking</p>
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Access management features will be implemented next</p>
        </CardContent>
      </Card>
    </div>
  );
}

function InviteSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Invite Management</h2>
      <p className="text-muted-foreground">Send support invitations</p>
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Invite management features will be implemented next</p>
        </CardContent>
      </Card>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-11">
            <TabsTrigger value="main" data-testid="tab-main">VeriFund</TabsTrigger>
            <TabsTrigger value="my-works" data-testid="tab-my-works">My Works</TabsTrigger>
            <TabsTrigger value="kyc" data-testid="tab-kyc">KYC</TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="volunteers" data-testid="tab-volunteers">Volunteers</TabsTrigger>
            <TabsTrigger value="financial" data-testid="tab-financial">Financial</TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
            <TabsTrigger value="tickets" data-testid="tab-tickets">Tickets</TabsTrigger>
            <TabsTrigger value="stories" data-testid="tab-stories">Stories</TabsTrigger>
            <TabsTrigger value="access" data-testid="tab-access">Access</TabsTrigger>
            <TabsTrigger value="invite" data-testid="tab-invite">Invite</TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="mt-6">
            <VeriFundMainPage />
          </TabsContent>

          <TabsContent value="my-works" className="mt-6">
            <MyWorksSection />
          </TabsContent>

          <TabsContent value="kyc" className="mt-6">
            <KYCSection />
          </TabsContent>

          <TabsContent value="campaigns" className="mt-6">
            <CampaignsSection />
          </TabsContent>

          <TabsContent value="volunteers" className="mt-6">
            <VolunteersSection />
          </TabsContent>

          <TabsContent value="financial" className="mt-6">
            <FinancialSection />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportsSection />
          </TabsContent>

          <TabsContent value="tickets" className="mt-6">
            <TicketsSection />
          </TabsContent>

          <TabsContent value="stories" className="mt-6">
            <StoriesSection />
          </TabsContent>

          <TabsContent value="access" className="mt-6">
            <AccessSection />
          </TabsContent>

          <TabsContent value="invite" className="mt-6">
            <InviteSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}