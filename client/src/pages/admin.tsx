import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import CreatorProfile from "@/components/CreatorProfile";
import { Button } from "@/components/ui/button";
import { 
  MyWorksAnalytics, 
  MyWorksKycTab, 
  MyWorksDocumentsTab, 
  MyWorksCampaignsTab, 
  MyWorksVolunteersTab, 
  MyWorksCreatorsTab, 
  MyWorksUsersTab, 
  MyWorksAllTab 
} from "@/components/MyWorksComponents";
import AdminTicketsTab from "@/components/AdminTicketsTab";
import { UniversalSearchButton } from "@/components/UniversalSearch";
import AccessPanel from "@/components/AccessPanel";
import StoriesTab from "../components/StoriesTab";
import { AdminStaffProfile } from "@/components/AdminStaffProfile";
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
  ArrowUp,
  Heart,
  Search,
  Target,
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
  Check,
  MessageSquare,
  MessageCircle,
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
  CheckCircle,
  Archive,
  Blocks,
  UserX,
  Filter,
  CheckSquare,
  BarChart3,
  Handshake,
  Timer,
  ClipboardCheck
} from "lucide-react";
import type { Campaign, User } from "@shared/schema";
import CampaignManagement from "@/components/CampaignManagement";
import KycManagement from "@/components/KycManagement";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Reported Volunteers Section Component
function ReportedVolunteersSection() {
  const [searchTerm, setSearchTerm] = useState("");

  // Disable this query as it's causing 401 errors
  // const { data: reportedVolunteers = [], isLoading } = useQuery({
  //   queryKey: ["/api/reported-volunteers"],
  //   queryFn: () => fetch("/api/reported-volunteers").then(res => res.json()),
  // });
  const reportedVolunteers = [];
  const isLoading = false;

  // Remove this query as it's not being used and causing 401 errors
  // const { data: flaggedCreators = [], isLoading: isLoadingFlaggedCreators } = useQuery({
  //   queryKey: ['/api/admin/flagged-creators'],
  //   enabled: (user as any)?.isAdmin,
  //   retry: false,
  //   staleTime: 0,
  // });
  
  // Add default values to prevent errors
  // const flaggedCreators = [];
  // const isLoadingFlaggedCreators = false;

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

// Financial Management Tab Components

function ContributionsTipsTab() {
  const { data: contributionsTips, isLoading } = useQuery({
    queryKey: ['/api/admin/financial/contributions-tips'],
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading contributions and tips...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-purple-600" />
          <span>Contribution & Tip Transactions</span>
        </CardTitle>
        <CardDescription>All contributions and tips made to campaigns and creators</CardDescription>
      </CardHeader>
      <CardContent>
        {!contributionsTips || contributionsTips.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Transactions</h3>
            <p className="text-muted-foreground">No contributions or tips found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="font-medium">Total Contributions</div>
                <div className="text-2xl font-bold text-purple-600">
                  ₱{contributionsTips.filter((t: any) => t.type === 'contribution')
                    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="font-medium">Total Tips</div>
                <div className="text-2xl font-bold text-orange-600">
                  ₱{contributionsTips.filter((t: any) => t.type === 'tip')
                    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {contributionsTips.map((item: any) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Badge variant={item.type === 'contribution' ? 'default' : 'secondary'}>
                        {item.type}
                      </Badge>
                      {item.isAnonymous && <Badge variant="outline" className="ml-2">Anonymous</Badge>}
                    </div>
                    <span className="font-bold">₱{parseFloat(item.amount).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Transaction ID:</strong> <span className="font-mono text-blue-600 text-xs">{item.id}</span></p>
                    <p><strong>From:</strong> {item.isAnonymous ? 'Anonymous' : item.contributor?.email}</p>
                    <p><strong>Campaign:</strong> {item.campaign?.title}</p>
                    {item.message && <p><strong>Message:</strong> {item.message}</p>}
                    <p><strong>Date:</strong> {new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClaimedTipsTab() {
  const { data: claimedTips, isLoading } = useQuery({
    queryKey: ['/api/admin/financial/claimed-tips'],
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading claimed tips...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wallet className="w-5 h-5 text-green-600" />
          <span>Claimed Tips</span>
        </CardTitle>
        <CardDescription>Tips that have been claimed by creators</CardDescription>
      </CardHeader>
      <CardContent>
        {!claimedTips || claimedTips.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Claimed Tips</h3>
            <p className="text-muted-foreground">No tips have been claimed yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg mb-6">
              <div className="font-medium">Total Claimed</div>
              <div className="text-2xl font-bold text-green-600">
                ₱{claimedTips.reduce((sum: number, t: any) => sum + parseFloat(t.transaction.amount || '0'), 0).toLocaleString()}
              </div>
            </div>
            
            <div className="space-y-3">
              {claimedTips.map((claim: any) => (
                <div key={claim.transaction.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="default">Claimed</Badge>
                    <span className="font-bold">₱{parseFloat(claim.transaction.amount).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Transaction ID:</strong> <span className="font-mono text-blue-600 text-xs">{claim.transaction.id}</span></p>
                    <p><strong>User:</strong> {claim.user?.email}</p>
                    <p><strong>Current Tips Balance:</strong> ₱{parseFloat(claim.user?.tipsBalance || '0').toLocaleString()}</p>
                    <p><strong>Date:</strong> {new Date(claim.transaction.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClaimedContributionsTab() {
  const { data: claimedContributions, isLoading } = useQuery({
    queryKey: ['/api/admin/financial/claimed-contributions'],
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading claimed contributions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <span>Claimed Contributions</span>
        </CardTitle>
        <CardDescription>Contributions that have been claimed by campaign creators</CardDescription>
      </CardHeader>
      <CardContent>
        {!claimedContributions || claimedContributions.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Claimed Contributions</h3>
            <p className="text-muted-foreground">No contributions have been claimed yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg mb-6">
              <div className="font-medium">Total Claimed</div>
              <div className="text-2xl font-bold text-blue-600">
                ₱{claimedContributions.reduce((sum: number, t: any) => sum + parseFloat(t.transaction.amount || '0'), 0).toLocaleString()}
              </div>
            </div>
            
            <div className="space-y-3">
              {claimedContributions.map((claim: any) => (
                <div key={claim.transaction.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="default">Claimed</Badge>
                    <span className="font-bold">₱{parseFloat(claim.transaction.amount).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Transaction ID:</strong> <span className="font-mono text-blue-600 text-xs">{claim.transaction.id}</span></p>
                    <p><strong>User:</strong> {claim.user?.email}</p>
                    <p><strong>Campaign:</strong> {claim.campaign?.title}</p>
                    <p><strong>Current Contributions Balance:</strong> ₱{parseFloat(claim.user?.contributionsBalance || '0').toLocaleString()}</p>
                    <p><strong>Date:</strong> {new Date(claim.transaction.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DepositsTab() {
  const { data: deposits, isLoading } = useQuery({
    queryKey: ['/api/admin/financial/deposits'],
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading deposits...</div>;
  }

  const depositTransactions = deposits || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ArrowDownLeft className="w-5 h-5 text-green-600" />
          <span>Deposits</span>
        </CardTitle>
        <CardDescription>All user deposits to the platform</CardDescription>
      </CardHeader>
      <CardContent>
        {depositTransactions.length === 0 ? (
          <div className="text-center py-8">
            <ArrowDownLeft className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Deposits Found</h3>
            <p className="text-muted-foreground">No deposit transactions have been made yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium">Total Deposits</div>
                <div className="text-2xl font-bold text-green-600">{depositTransactions.length}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium">Successful Deposits</div>
                <div className="text-2xl font-bold text-blue-600">
                  {depositTransactions.filter((d: any) => d.status === 'completed').length}
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="font-medium">Total Volume</div>
                <div className="text-2xl font-bold text-purple-600">
                  ₱{depositTransactions.reduce((sum: number, d: any) => sum + parseFloat(d.amount || '0'), 0).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {depositTransactions.map((deposit: any) => (
                <div key={deposit.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={deposit.status === 'completed' ? 'default' : deposit.status === 'pending' ? 'secondary' : 'destructive'}>
                      {deposit.status}
                    </Badge>
                    <span className="font-bold">₱{parseFloat(deposit.amount).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Transaction ID:</strong> <span className="font-mono text-blue-600 text-xs">{deposit.id}</span></p>
                    <p><strong>User:</strong> {deposit.user?.email}</p>
                    <p><strong>Payment Method:</strong> {deposit.paymentProvider || 'N/A'}</p>
                    <p><strong>Date:</strong> {new Date(deposit.createdAt).toLocaleString()}</p>
                    {deposit.description && <p><strong>Description:</strong> {deposit.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WithdrawalsTab() {
  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['/api/admin/financial/withdrawals'],
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading withdrawals...</div>;
  }

  const withdrawalTransactions = withdrawals || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ArrowUpRight className="w-5 h-5 text-red-600" />
          <span>Withdrawals</span>
        </CardTitle>
        <CardDescription>All user withdrawals from the platform</CardDescription>
      </CardHeader>
      <CardContent>
        {withdrawalTransactions.length === 0 ? (
          <div className="text-center py-8">
            <ArrowUpRight className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Withdrawals Found</h3>
            <p className="text-muted-foreground">No withdrawal transactions have been made yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="font-medium">Total Withdrawals</div>
                <div className="text-2xl font-bold text-red-600">{withdrawalTransactions.length}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium">Successful Withdrawals</div>
                <div className="text-2xl font-bold text-blue-600">
                  {withdrawalTransactions.filter((w: any) => w.status === 'completed').length}
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="font-medium">Total Volume</div>
                <div className="text-2xl font-bold text-purple-600">
                  ₱{withdrawalTransactions.reduce((sum: number, w: any) => sum + parseFloat(w.amount || '0'), 0).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {withdrawalTransactions.map((withdrawal: any) => (
                <div key={withdrawal.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={withdrawal.status === 'completed' ? 'default' : withdrawal.status === 'pending' ? 'secondary' : 'destructive'}>
                      {withdrawal.status}
                    </Badge>
                    <span className="font-bold">₱{parseFloat(withdrawal.amount).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Transaction ID:</strong> <span className="font-mono text-blue-600 text-xs">{withdrawal.id}</span></p>
                    <p><strong>User:</strong> {withdrawal.user?.email}</p>
                    <p><strong>Payment Method:</strong> {withdrawal.paymentProvider || 'N/A'}</p>
                    <p><strong>Date:</strong> {new Date(withdrawal.createdAt).toLocaleString()}</p>
                    {withdrawal.description && <p><strong>Description:</strong> {withdrawal.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AllTransactionHistoriesTab() {
  const { data: allTransactions, isLoading } = useQuery({
    queryKey: ['/api/admin/financial/all-histories'],
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading blockchain transactions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Blocks className="w-5 h-5 text-blue-600" />
          <span>Blockchain Transactions</span>
        </CardTitle>
        <CardDescription>All platform transactions recorded on the blockchain</CardDescription>
      </CardHeader>
      <CardContent>
        {!allTransactions || allTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Blocks className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Blockchain Transactions</h3>
            <p className="text-muted-foreground">No transactions found on the blockchain.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium">Total Transactions</div>
                <div className="text-2xl font-bold text-blue-600">{allTransactions.length}</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium">Confirmed</div>
                <div className="text-2xl font-bold text-green-600">
                  {allTransactions.filter((t: any) => t.status === 'completed').length}
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="font-medium">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {allTransactions.filter((t: any) => t.status === 'pending').length}
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="font-medium">Total Volume</div>
                <div className="text-2xl font-bold text-purple-600">
                  ₱{allTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allTransactions.map((txn: any) => (
                <div key={txn.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Badge variant={txn.status === 'completed' ? 'default' : txn.status === 'failed' ? 'destructive' : 'secondary'}>
                        {txn.status}
                      </Badge>
                      <span className="ml-2 font-medium">{txn.type}</span>
                    </div>
                    <span className="font-bold">₱{parseFloat(txn.amount).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Transaction ID:</strong> <span className="font-mono text-blue-600 text-xs">{txn.id}</span></p>
                    <p><strong>User:</strong> {txn.user?.email}</p>
                    <p><strong>Description:</strong> {txn.description}</p>
                    {txn.campaign && <p><strong>Campaign:</strong> {txn.campaign.title}</p>}
                    {txn.paymentProvider && <p><strong>Provider:</strong> {txn.paymentProvider}</p>}
                    {txn.transactionHash && (
                      <p><strong>Hash:</strong> <span className="font-mono text-xs">{txn.transactionHash}</span></p>
                    )}
                    {txn.blockNumber && (
                      <p><strong>Block:</strong> {txn.blockNumber}</p>
                    )}
                    {txn.feeAmount && <p><strong>Fee:</strong> ₱{parseFloat(txn.feeAmount).toLocaleString()}</p>}
                    <p><strong>Date:</strong> {new Date(txn.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Reports Tab Components
function DocumentReportsTab() {
  const { data: documentReports = [], isLoading: isLoadingDocumentReports } = useQuery({
    queryKey: ['/api/admin/reports/documents'],
    enabled: true,
    retry: false,
    staleTime: 0,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span>Document Reports</span>
        </CardTitle>
        <CardDescription>Reported document issues, KYC problems, and verification concerns</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingDocumentReports ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading document reports...</p>
          </div>
        ) : documentReports.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No document reports at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documentReports.map((report: any) => (
              <Card key={report.id} className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{report.reportType || 'Document Issue'}</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Category: {report.reportCategory} | Severity: {report.severity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Reported: {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">Document Issue</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CampaignReportsTab({ searchTerm, filter, sortBy, searchAndFilterReports }: { searchTerm: string, filter: string, sortBy: string, searchAndFilterReports: Function }) {
  const { data: campaignReports = [], isLoading: isLoadingCampaignReports } = useQuery({
    queryKey: ['/api/admin/reports/campaigns'],
    enabled: true,
    retry: false,
    staleTime: 0,
  });

  const filteredReports = searchAndFilterReports(campaignReports, searchTerm, filter, sortBy);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-red-600" />
          <span>Campaign Reports</span>
          {filteredReports.length !== campaignReports.length && (
            <Badge variant="secondary" className="ml-2">
              {filteredReports.length} of {campaignReports.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Reported campaigns, suspicious activities, and policy violations</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingCampaignReports ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading campaign reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-8">
            <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {campaignReports.length === 0 ? "No campaign reports at this time." : "No reports match your search criteria."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report: any) => (
              <Card key={report.id} className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{report.reportType || 'Campaign Issue'}</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Category: {report.reportCategory} | Severity: {report.severity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Reported: {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="destructive">Campaign Issue</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VolunteerReportsTab({ searchTerm, filter, sortBy, searchAndFilterReports }: { searchTerm: string, filter: string, sortBy: string, searchAndFilterReports: Function }) {
  const { data: volunteerReports = [], isLoading: isLoadingVolunteerReports } = useQuery({
    queryKey: ['/api/admin/reports/volunteers'],
    enabled: true,
    retry: false,
    staleTime: 0,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-600" />
          <span>Volunteer Reports</span>
        </CardTitle>
        <CardDescription>Reported volunteer behavior, policy violations, and misconduct</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingVolunteerReports ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading volunteer reports...</p>
          </div>
        ) : volunteerReports.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No volunteer reports at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {volunteerReports.map((report: any) => (
              <Card key={report.id} className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{report.reportType || 'Volunteer Issue'}</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Category: {report.reportCategory} | Severity: {report.severity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Reported: {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-orange-300">Volunteer Issue</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreatorReportsTab({ searchTerm, filter, sortBy, searchAndFilterReports }: { searchTerm: string, filter: string, sortBy: string, searchAndFilterReports: Function }) {
  const { data: creatorReports = [], isLoading: isLoadingCreatorReports } = useQuery({
    queryKey: ['/api/admin/reports/creators'],
    enabled: true,
    retry: false,
    staleTime: 0,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-purple-600" />
          <span>Creator Reports</span>
        </CardTitle>
        <CardDescription>Reported creators, fraud investigations, and account violations</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingCreatorReports ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading creator reports...</p>
          </div>
        ) : creatorReports.length === 0 ? (
          <div className="text-center py-8">
            <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No creator reports at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {creatorReports.map((report: any) => (
              <Card key={report.id} className="border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{report.reportType || 'Creator Issue'}</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Category: {report.reportCategory} | Severity: {report.severity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Reported: {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-purple-300">Creator Issue</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TransactionReportsTab({ searchTerm, filter, sortBy, searchAndFilterReports }: { searchTerm: string, filter: string, sortBy: string, searchAndFilterReports: Function }) {
  const { data: transactionReports = [], isLoading: isLoadingTransactionReports } = useQuery({
    queryKey: ['/api/admin/reports/transactions'],
    enabled: true,
    retry: false,
    staleTime: 0,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-green-600" />
          <span>Transaction Reports</span>
        </CardTitle>
        <CardDescription>Payment disputes, failed transactions, and financial irregularities</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingTransactionReports ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading transaction reports...</p>
          </div>
        ) : transactionReports.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No transaction reports at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactionReports.map((report: any) => (
              <Card key={report.id} className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{report.reportType || 'Transaction Issue'}</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Category: {report.reportCategory} | Severity: {report.severity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Reported: {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-green-300">Transaction Issue</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReportedUsersTab({ searchTerm, filter, sortBy, searchAndFilterReports }: { searchTerm: string, filter: string, sortBy: string, searchAndFilterReports: Function }) {
  const { data: reportedUsers = [], isLoading: isLoadingReportedUsers } = useQuery({
    queryKey: ['/api/admin/reports/users'],
    enabled: true,
    retry: false,
    staleTime: 0,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserX className="w-5 h-5 text-red-600" />
          <span>Users</span>
        </CardTitle>
        <CardDescription>Users reported for spamming, scamming, malicious links, inappropriate behavior, and community violations</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingReportedUsers ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading reported users...</p>
          </div>
        ) : reportedUsers.length === 0 ? (
          <div className="text-center py-8">
            <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No reported users at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reportedUsers.map((report: any) => (
              <Card key={report.id} className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          {report.reportedUser?.profileImageUrl ? (
                            <img 
                              src={report.reportedUser.profileImageUrl} 
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">
                            {report.reportedUser?.firstName} {report.reportedUser?.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">{report.reportedUser?.email}</p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <Badge 
                          variant={
                            report.reportType === 'spam' ? 'destructive' :
                            report.reportType === 'scam' ? 'destructive' :
                            report.reportType === 'malicious-links' ? 'destructive' :
                            report.reportType === 'inappropriate-language' ? 'secondary' :
                            'default'
                          }
                          className="mr-2"
                        >
                          {report.reportType === 'spam' ? '🚫 Spam' :
                           report.reportType === 'scam' ? '⚠️ Scam' :
                           report.reportType === 'malicious-links' ? '🔗 Malicious Links' :
                           report.reportType === 'inappropriate-language' ? '💬 Bad Language' :
                           report.reportType === 'harassment' ? '😡 Harassment' :
                           '📢 Community Violation'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Severity: {report.severity || 'Medium'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">
                        <span className="font-medium">Report:</span> {report.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">Reporter:</span> {report.reporterEmail}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(report.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">User ID:</span> {report.reportedUserId?.slice(0, 8)}...
                        </div>
                        <div>
                          <span className="font-medium">Status:</span> 
                          <Badge variant={report.status === 'resolved' ? 'default' : 'destructive'} className="ml-1 text-xs">
                            {report.status || 'Pending'}
                          </Badge>
                        </div>
                      </div>
                      
                      {report.evidence && report.evidence.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-100 rounded">
                          <h6 className="font-medium text-xs text-gray-700 mb-2">Evidence Provided:</h6>
                          <div className="space-y-1">
                            {report.evidence.slice(0, 3).map((evidence: string, index: number) => (
                              <p key={index} className="text-xs text-gray-600 truncate">
                                📎 {evidence}
                              </p>
                            ))}
                            {report.evidence.length > 3 && (
                              <p className="text-xs text-gray-500">+{report.evidence.length - 3} more files</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <Badge 
                        variant={
                          report.priority === 'high' ? 'destructive' : 
                          report.priority === 'medium' ? 'default' : 
                          'secondary'
                        }
                      >
                        {(report.priority || 'low').toUpperCase()} Priority
                      </Badge>
                      
                      <div className="flex flex-col space-y-1">
                        <Button size="sm" variant="outline" className="text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs">
                          <UserX className="w-3 h-3 mr-1" />
                          Take Action
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  // Get tab from URL params, default to insights with proper reactivity
  const [activeTab, setActiveTab] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab') || 'insights';
    // Map old 'support' tab to new 'access' tab
    return tab === "support" ? "access" : tab;
  });
  const [kycTab, setKycTab] = useState("requests");
  const [campaignTab, setCampaignTab] = useState("requests");
  
  // Reports search functionality
  const [reportsSearchTerm, setReportsSearchTerm] = useState("");
  const [reportsFilter, setReportsFilter] = useState("all");
  const [reportsSortBy, setReportsSortBy] = useState("date-desc");

  // Search and filter function for reports
  const searchAndFilterReports = (reports: any[], searchTerm: string, filter: string, sortBy: string) => {
    let filteredReports = [...reports];

    // Search functionality - comprehensive ID and text search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredReports = filteredReports.filter(report => {
        // Search in IDs
        const documentId = report.documentId?.toLowerCase().includes(searchLower);
        const campaignId = report.campaignId?.toLowerCase().includes(searchLower);
        const relatedId = report.relatedId?.toLowerCase().includes(searchLower);
        const reportId = report.id?.toLowerCase().includes(searchLower);
        const reporterId = report.reporterId?.toLowerCase().includes(searchLower);
        const reportedUserId = report.reportedUserId?.toLowerCase().includes(searchLower);
        
        // Search in text content
        const description = report.description?.toLowerCase().includes(searchLower);
        const reportType = report.reportType?.toLowerCase().includes(searchLower);
        const reportCategory = report.reportCategory?.toLowerCase().includes(searchLower);
        const reporterEmail = report.reporterEmail?.toLowerCase().includes(searchLower);
        const status = report.status?.toLowerCase().includes(searchLower);
        const severity = report.severity?.toLowerCase().includes(searchLower);
        
        // Search in related user data
        const userFirstName = report.reportedUser?.firstName?.toLowerCase().includes(searchLower);
        const userLastName = report.reportedUser?.lastName?.toLowerCase().includes(searchLower);
        const userEmail = report.reportedUser?.email?.toLowerCase().includes(searchLower);
        
        // Search in campaign data
        const campaignTitle = report.campaign?.title?.toLowerCase().includes(searchLower);
        const campaignCategory = report.campaign?.category?.toLowerCase().includes(searchLower);
        
        return documentId || campaignId || relatedId || reportId || reporterId || reportedUserId ||
               description || reportType || reportCategory || reporterEmail || status || severity ||
               userFirstName || userLastName || userEmail || campaignTitle || campaignCategory;
      });
    }

    // Filter functionality
    if (filter !== "all") {
      filteredReports = filteredReports.filter(report => {
        switch (filter) {
          case "high-priority":
            return report.priority === "high" || report.severity === "High";
          case "medium-priority":
            return report.priority === "medium" || report.severity === "Medium";
          case "pending":
            return report.status === "pending" || !report.status;
          case "resolved":
            return report.status === "resolved";
          case "spam":
            return report.reportType?.toLowerCase().includes("spam");
          case "scam":
            return report.reportType?.toLowerCase().includes("scam");
          case "malicious":
            return report.reportType?.toLowerCase().includes("malicious");
          case "harassment":
            return report.reportType?.toLowerCase().includes("harassment");
          case "financial":
            return report.reportCategory?.toLowerCase().includes("transaction") || 
                   report.reportType?.toLowerCase().includes("financial");
          case "today":
            return new Date(report.createdAt).toDateString() === new Date().toDateString();
          case "week":
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(report.createdAt) >= weekAgo;
          case "urgent":
            return report.severity === "High" && report.status === "pending";
          case "unassigned":
            return !report.assignedTo && report.status === "pending";
          case "flagged":
            return report.reportType?.toLowerCase().includes("flagged");
          default:
            return true;
        }
      });
    }

    // Sort functionality
    filteredReports.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "priority-high":
          const priorityOrder = { "high": 3, "medium": 2, "low": 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case "severity-high":
          const severityOrder = { "High": 3, "Medium": 2, "Low": 1 };
          return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
        case "reporter":
          return (a.reporterEmail || "").localeCompare(b.reporterEmail || "");
        case "type":
          return (a.reportType || "").localeCompare(b.reportType || "");
        default:
          return 0;
      }
    });

    return filteredReports;
  };
  
  // Update tab when URL search parameters change - enhanced detection
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const newTab = urlParams.get('tab') || 'insights';
      console.log('🔄 Navigation change detected:', { location, newTab, search: window.location.search, currentActiveTab: activeTab });
      if (newTab !== activeTab) {
        console.log('🎯 Setting active tab to:', newTab);
        setActiveTab(newTab);
      }
    };

    // Initial check on mount/location change
    handleUrlChange();
    
    // Listen for browser navigation (back/forward buttons)
    const handlePopState = () => {
      console.log('📍 Popstate event detected');
      handleUrlChange();
    };
    window.addEventListener('popstate', handlePopState);
    
    // Custom event listener for wouter navigation changes
    const handleWouterNavigation = () => {
      console.log('🚀 Wouter navigation detected');
      setTimeout(handleUrlChange, 0); // Delay to ensure URL is updated
    };
    
    // Listen for hash changes (backup)
    window.addEventListener('hashchange', handleUrlChange);
    
    // Listen for custom navigation events
    window.addEventListener('wouternavigation', handleWouterNavigation);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('wouternavigation', handleWouterNavigation);
    };
  }, [location, activeTab]); // Include activeTab to ensure we catch all changes

  // Enhanced debugging and URL monitoring
  useEffect(() => {
    console.log('🎯 Active tab state changed to:', activeTab);
    
    // Also monitor URL changes with an interval as backup
    const urlMonitor = setInterval(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTab = urlParams.get('tab') || 'insights';
      if (urlTab !== activeTab) {
        console.log('🚨 URL/State mismatch detected! URL tab:', urlTab, 'State tab:', activeTab);
        setActiveTab(urlTab);
      }
    }, 100);
    
    return () => clearInterval(urlMonitor);
  }, [activeTab]);
  // KYC-related states moved to KycManagement component
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [showCampaignViewer, setShowCampaignViewer] = useState(false);
  const [selectedCreatorForDetails, setSelectedCreatorForDetails] = useState<any>(null);
  const [showCreatorDetails, setShowCreatorDetails] = useState(false);
  const [campaignCreatorDetails, setCampaignCreatorDetails] = useState<any>(null);
  
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



  // Add missing pending campaigns variables with proper typing
  const adminPendingCampaigns = pendingCampaigns as any[];
  const isLoadingPendingCampaigns = false;

  // Add default values for flagged creators to prevent errors with proper typing
  const flaggedCreators = [] as any[];
  const isLoadingFlaggedCreators = false;

  const { data: allCampaigns = [] } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: () => fetch("/api/campaigns").then(res => res.json()),
    enabled: !!(user as any)?.isAdmin,
  }) as { data: any[] };

  // Fetch creator profile data with proper typing
  const { data: creatorProfile = {} } = useQuery({
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


  const unflagCreatorMutation = useMutation({
    mutationFn: async (creatorId: string) => {
      return await apiRequest("POST", `/api/admin/creators/${creatorId}/unflag`, {});
    },
    onSuccess: () => {
      toast({ title: "Creator Unflagged", description: "Creator has been successfully unflagged." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/flagged-creators"] });
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
      toast({ title: "Error", description: "Failed to unflag creator.", variant: "destructive" });
    },
  });

  // KYC approval mutation
  const approveKYCMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('POST', `/api/admin/kyc/${userId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/kyc/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/kyc/verified'] });
      toast({
        title: "KYC Approved",
        description: "User KYC has been successfully approved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve KYC",
        variant: "destructive",
      });
    }
  });

  // KYC rejection mutation  
  const rejectKYCMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return apiRequest('POST', `/api/admin/kyc/${userId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/kyc/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/kyc/rejected'] });
      toast({
        title: "KYC Rejected", 
        description: "User KYC has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject KYC",
        variant: "destructive",
      });
    }
  });

  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedUserForRejection, setSelectedUserForRejection] = useState<string | null>(null);


  // Claim mutations for different report types
  const claimKycMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/claim-kyc`, {});
    },
    onSuccess: (data, userId) => {
      toast({ title: "Success", description: "KYC request claimed successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/my-works/kyc"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/my-works/analytics"] });
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        // Already claimed by another admin
        toast({
          title: "Already Claimed",
          description: error.response.data.message || "This KYC request has already been claimed by another admin.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to claim KYC request.",
          variant: "destructive",
        });
      }
    },
  });


  const claimSupportRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("POST", `/api/admin/support-requests/${requestId}/claim`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Support request claimed successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/my-works"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/my-works/analytics"] });
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        toast({
          title: "Already Claimed",
          description: error.response.data.message || "This support request has already been claimed by another admin.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to claim support request.",
          variant: "destructive",
        });
      }
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

  if (!isAuthenticated || (!(user as any)?.isAdmin && !(user as any)?.isSupport)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-muted-foreground">Access denied. Admin or Support access required.</p>
          </div>
        </div>
      </div>
    );
  }

  const activeCampaigns = allCampaigns?.filter((c: Campaign) => c.status === "active") || [];
  const flaggedCampaigns = allCampaigns?.filter((c: Campaign) => c.status === "flagged") || [];
  const rejectedCampaigns = allCampaigns?.filter((c: Campaign) => c.status === "rejected") || [];
  const closedCampaigns = allCampaigns?.filter((c: Campaign) => c.status === "completed") || [];


  // KYC Data queries with proper typing
  const { data: pendingKYC = [], isLoading: isLoadingPendingKYC } = useQuery({
    queryKey: ['/api/admin/kyc/pending'],
    enabled: (user as any)?.isAdmin,
    retry: false,
    staleTime: 0,
  }) as { data: any[], isLoading: boolean };

  const { data: verifiedUsers = [], isLoading: isLoadingVerifiedUsers } = useQuery({
    queryKey: ['/api/admin/kyc/verified'],
    enabled: (user as any)?.isAdmin,
    retry: false,
    staleTime: 0,
  }) as { data: any[], isLoading: boolean };

  const { data: rejectedKYC = [], isLoading: isLoadingRejectedKYC } = useQuery({
    queryKey: ['/api/admin/kyc/rejected'],
    enabled: (user as any)?.isAdmin,
    retry: false,
    staleTime: 0,
  }) as { data: any[], isLoading: boolean };

  const { data: suspendedUsers = [], isLoading: isLoadingSuspendedUsers } = useQuery({
    queryKey: ['/api/admin/users/suspended'],
    enabled: (user as any)?.isAdmin,
    retry: false,
    staleTime: 0,
  }) as { data: any[], isLoading: boolean };


  // Remove this query as it's not being used and causing 401 errors
  // const { data: flaggedCreators = [], isLoading: isLoadingFlaggedCreators } = useQuery({
  //   queryKey: ['/api/admin/flagged-creators'],
  //   enabled: (user as any)?.isAdmin,
  //   retry: false,
  //   staleTime: 0,
  // });


  // Query for campaign creator details when viewing flagged campaign with proper typing
  const { data: campaignCreatorProfile = {} } = useQuery({
    queryKey: ['/api/creator', selectedCampaign?.creatorId, 'profile'],
    enabled: (user as any)?.isAdmin && !!selectedCampaign?.creatorId && showCampaignViewer,
    retry: false,
    staleTime: 0,
  }) as { data: any };

  // Query for creator ratings with proper typing
  const { data: creatorRatings = [] } = useQuery({
    queryKey: ['/api/creator-ratings', selectedCreatorForDetails?.id || (campaignCreatorProfile as any)?.id],
    enabled: (user as any)?.isAdmin && (!!selectedCreatorForDetails?.id || !!(campaignCreatorProfile as any)?.id),
    retry: false,
    staleTime: 0,
  }) as { data: any[] };


  // Fetch My Works analytics
  const { data: myWorksAnalytics } = useQuery({
    queryKey: ['/api/admin/my-works/analytics'],
    enabled: (user as any)?.isAdmin,
  });

  // Fetch claimed KYC requests and reports for My Works
  const { data: claimedKycRequests } = useQuery({
    queryKey: ['/api/admin/my-works/kyc-claimed'],
    enabled: (user as any)?.isAdmin && (activeTab === 'my-works' || !activeTab),
  });

  const { data: claimedReports } = useQuery({
    queryKey: ['/api/admin/my-works/reports-claimed'],
    enabled: (user as any)?.isAdmin && (activeTab === 'my-works' || !activeTab),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        
        {/* Admin Staff Profile - Show only for profile tab */}
        {activeTab === 'profile' && (
          <AdminStaffProfile />
        )}

        {/* MY WORKS Section - Show claimed KYC requests and reports */}
        {(activeTab === 'my-works' || !activeTab) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">My Works</h1>
              <div className="text-sm text-gray-500">
                Total Claims: {myWorksAnalytics?.totalClaims || 0}
              </div>
            </div>

            {/* My Works Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">KYC Verifications</p>
                      <p className="text-2xl font-bold text-gray-900">{myWorksAnalytics?.kyc || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Documents Reviewed</p>
                      <p className="text-2xl font-bold text-gray-900">{myWorksAnalytics?.documents || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Target className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Campaigns Reviewed</p>
                      <p className="text-2xl font-bold text-gray-900">{myWorksAnalytics?.campaigns || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Reports Handled</p>
                      <p className="text-2xl font-bold text-gray-900">{myWorksAnalytics?.reports || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Claimed Work Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Claimed KYC Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>Claimed KYC Requests</span>
                  </CardTitle>
                  <CardDescription>KYC verification requests you have claimed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {claimedKycRequests?.length > 0 ? (
                      claimedKycRequests.slice(0, 5).map((request: any) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{request.userDisplayId || request.email}</p>
                              <p className="text-xs text-gray-500">
                                Claimed: {new Date(request.claimedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'verified' ? 'bg-green-100 text-green-800' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No claimed KYC requests</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Claimed Reports */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <span>Claimed Reports</span>
                  </CardTitle>
                  <CardDescription>Reports you have claimed for review</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {claimedReports?.length > 0 ? (
                      claimedReports.slice(0, 5).map((report: any) => (
                        <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{report.reportType} Report</p>
                              <p className="text-xs text-gray-500">
                                Claimed: {new Date(report.claimedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No claimed reports</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {/* Reports Management Section - Show only for reports tab */}
        {activeTab === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-6 h-6 text-red-600" />
              <span>Reports Management</span>
            </CardTitle>
            <CardDescription>Review all types of reports across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Advanced Search Bar and Filters */}
            <div className="mb-6 space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by Document ID, Campaign ID, Creator ID, User ID, Transaction ID, Description, or Reporter..."
                  value={reportsSearchTerm}
                  onChange={(e) => setReportsSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  data-testid="input-search-reports"
                />
              </div>
              
              {/* Filter and Sort Controls */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={reportsFilter}
                    onChange={(e) => setReportsFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    data-testid="select-reports-filter"
                  >
                    <option value="all">All Reports</option>
                    <option value="high-priority">High Priority</option>
                    <option value="medium-priority">Medium Priority</option>
                    <option value="pending">Pending Status</option>
                    <option value="resolved">Resolved Status</option>
                    <option value="spam">Spam Reports</option>
                    <option value="scam">Scam Reports</option>
                    <option value="malicious">Malicious Links</option>
                    <option value="harassment">Harassment</option>
                    <option value="financial">Financial Issues</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <ArrowUp className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={reportsSortBy}
                    onChange={(e) => setReportsSortBy(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    data-testid="select-reports-sort"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="priority-high">High Priority First</option>
                    <option value="severity-high">High Severity First</option>
                    <option value="reporter">By Reporter</option>
                    <option value="type">By Type</option>
                  </select>
                </div>
                
                {reportsSearchTerm && (
                  <button
                    onClick={() => {
                      setReportsSearchTerm("");
                      setReportsFilter("all");
                      setReportsSortBy("date-desc");
                    }}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200 transition-colors"
                    data-testid="button-clear-search"
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
                
                <div className="text-sm text-muted-foreground">
                  {reportsSearchTerm && `Searching: "${reportsSearchTerm}"`}
                </div>
              </div>
              
              {/* Quick Filter Tags */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">Quick Filters:</span>
                {[
                  { label: 'Today', filter: 'today' },
                  { label: 'This Week', filter: 'week' },
                  { label: 'Urgent', filter: 'urgent' },
                  { label: 'Unassigned', filter: 'unassigned' },
                  { label: 'Flagged Users', filter: 'flagged' }
                ].map(({ label, filter }) => (
                  <button
                    key={filter}
                    onClick={() => setReportsFilter(filter)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      reportsFilter === filter 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    data-testid={`button-quick-filter-${filter}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              
              {/* Advanced Admin Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      // Export reports functionality
                      const currentDate = new Date().toISOString().split('T')[0];
                      toast({
                        title: "Export Started",
                        description: `Reports data will be downloaded as CSV file for ${currentDate}`
                      });
                    }}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    data-testid="button-export-reports"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Bulk actions functionality
                      toast({
                        title: "Bulk Actions",
                        description: "Select reports to perform bulk operations like resolve, assign, or delete"
                      });
                    }}
                    className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                    data-testid="button-bulk-actions"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Bulk Actions</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Analytics dashboard
                      toast({
                        title: "Reports Analytics",
                        description: "View detailed statistics and trends for platform reports"
                      });
                    }}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    data-testid="button-reports-analytics"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>

            <Tabs defaultValue="documents" className="space-y-4">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
                <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
                <TabsTrigger value="volunteers" data-testid="tab-volunteers">Volunteers</TabsTrigger>
                <TabsTrigger value="creators" data-testid="tab-creators">Creators</TabsTrigger>
                <TabsTrigger value="reported-users" data-testid="tab-reported-users">Users</TabsTrigger>
                <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
                <TabsTrigger value="stories" data-testid="tab-stories">Stories</TabsTrigger>
              </TabsList>


        <TabsContent value="documents" className="mt-6">
          <DocumentReportsTab 
            searchTerm={reportsSearchTerm}
            filter={reportsFilter}
            sortBy={reportsSortBy}
            searchAndFilterReports={searchAndFilterReports}
          />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <CampaignReportsTab 
            searchTerm={reportsSearchTerm}
            filter={reportsFilter}
            sortBy={reportsSortBy}
            searchAndFilterReports={searchAndFilterReports}
          />
        </TabsContent>

        <TabsContent value="volunteers" className="mt-6">
          <VolunteerReportsTab 
            searchTerm={reportsSearchTerm}
            filter={reportsFilter}
            sortBy={reportsSortBy}
            searchAndFilterReports={searchAndFilterReports}
          />
        </TabsContent>

        <TabsContent value="creators" className="mt-6">
          <CreatorReportsTab 
            searchTerm={reportsSearchTerm}
            filter={reportsFilter}
            sortBy={reportsSortBy}
            searchAndFilterReports={searchAndFilterReports}
          />
        </TabsContent>

        <TabsContent value="reported-users" className="mt-6">
          <ReportedUsersTab 
            searchTerm={reportsSearchTerm}
            filter={reportsFilter}
            sortBy={reportsSortBy}
            searchAndFilterReports={searchAndFilterReports}
          />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <TransactionReportsTab 
            searchTerm={reportsSearchTerm}
            filter={reportsFilter}
            sortBy={reportsSortBy}
            searchAndFilterReports={searchAndFilterReports}
          />
        </TabsContent>

        <TabsContent value="stories" className="mt-6">
          <StoriesTab />
        </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
        )}

      </div>
    </div>
  );
}
