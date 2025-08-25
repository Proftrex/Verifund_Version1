import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  UserX,
  Heart,
  BarChart
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
      <div className="text-center py-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
        <div className="flex items-center justify-center mb-4">
          <Crown className="h-12 w-12 text-green-600 mr-3" />
          <h1 className="text-4xl font-bold text-green-700">VeriFund</h1>
        </div>
        <p className="text-lg text-green-600">Admin & Support Profiles</p>
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

// Campaign Management Section - Section 4
function CampaignsSection() {
  const { data: pendingCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/pending'],
    retry: false,
  });

  const { data: activeCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/active'],
    retry: false,
  });

  const { data: rejectedCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/rejected'],
    retry: false,
  });

  const { data: closedCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/closed'],
    retry: false,
  });

  const { data: completedCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/completed'],
    retry: false,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Campaign Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending ({pendingCampaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingCampaigns.slice(0, 3).map((campaign: any) => (
              <div key={campaign.id} className="flex justify-between items-center py-2">
                <span className="text-sm">{campaign.title?.substring(0, 30)}...</span>
                <Button size="sm" variant="outline">Review</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Active ({activeCampaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeCampaigns.slice(0, 3).map((campaign: any) => (
              <div key={campaign.id} className="flex justify-between items-center py-2">
                <span className="text-sm">{campaign.title?.substring(0, 30)}...</span>
                <Badge variant="default">Live</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Rejected ({rejectedCampaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rejectedCampaigns.slice(0, 3).map((campaign: any) => (
              <div key={campaign.id} className="flex justify-between items-center py-2">
                <span className="text-sm">{campaign.title?.substring(0, 30)}...</span>
                <Badge variant="destructive">Rejected</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-gray-500" />
              Closed ({closedCampaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {closedCampaigns.slice(0, 3).map((campaign: any) => (
              <div key={campaign.id} className="flex justify-between items-center py-2">
                <span className="text-sm">{campaign.title?.substring(0, 30)}...</span>
                <Badge variant="secondary">Closed</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              Completed ({completedCampaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedCampaigns.slice(0, 3).map((campaign: any) => (
              <div key={campaign.id} className="flex justify-between items-center py-2">
                <span className="text-sm">{campaign.title?.substring(0, 30)}...</span>
                <Badge variant="success">Success</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Volunteer Management Section - Section 5
function VolunteersSection() {
  const { data: opportunities = [] } = useQuery({
    queryKey: ['/api/admin/volunteer/opportunities'],
    retry: false,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['/api/admin/volunteer/applications'],
    retry: false,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Volunteer Management</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Volunteer Opportunities ({opportunities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {opportunities.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No volunteer opportunities</p>
            ) : (
              <div className="space-y-2">
                {opportunities.slice(0, 5).map((opp: any) => (
                  <div key={opp.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium">{opp.title}</span>
                      <p className="text-xs text-muted-foreground">{opp.slotsNeeded} slots needed</p>
                    </div>
                    <Badge variant="outline">{opp.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Volunteer Applications ({applications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No volunteer applications</p>
            ) : (
              <div className="space-y-2">
                {applications.slice(0, 5).map((app: any) => (
                  <div key={app.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium">{app.volunteerFirstName} {app.volunteerLastName}</span>
                      <p className="text-xs text-muted-foreground">{app.campaignTitle}</p>
                    </div>
                    <Badge variant="outline">{app.status}</Badge>
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