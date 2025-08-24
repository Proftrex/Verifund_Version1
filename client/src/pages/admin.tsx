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
import AccessPanel from "@/components/AccessPanel";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* My Works Section */}
        {activeTab === 'my-works' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">My Works</h2>
              <p className="text-muted-foreground">Reports and requests you have claimed for review</p>
            </div>
          </div>

          {/* Analytics Summary */}
          <MyWorksAnalytics />

          <Tabs defaultValue="all-works" className="space-y-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="kyc" className="flex items-center space-x-1 text-xs">
                <CheckCircle className="w-3 h-3" />
                <span>KYC</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center space-x-1 text-xs">
                <FileText className="w-3 h-3" />
                <span>Documents</span>
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="flex items-center space-x-1 text-xs">
                <TrendingUp className="w-3 h-3" />
                <span>Campaigns</span>
              </TabsTrigger>
              <TabsTrigger value="volunteers" className="flex items-center space-x-1 text-xs">
                <Users className="w-3 h-3" />
                <span>Volunteers</span>
              </TabsTrigger>
              <TabsTrigger value="creators" className="flex items-center space-x-1 text-xs">
                <Star className="w-3 h-3" />
                <span>Creators</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center space-x-1 text-xs">
                <UserIcon className="w-3 h-3" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="all-works" className="flex items-center space-x-1 text-xs">
                <BarChart3 className="w-3 h-3" />
                <span>All Works</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="kyc">
              <MyWorksKycTab />
            </TabsContent>

            <TabsContent value="documents">
              <MyWorksDocumentsTab />
            </TabsContent>

            <TabsContent value="campaigns">
              <MyWorksCampaignsTab />
            </TabsContent>

            <TabsContent value="volunteers">
              <MyWorksVolunteersTab />
            </TabsContent>

            <TabsContent value="creators">
              <MyWorksCreatorsTab />
            </TabsContent>

            <TabsContent value="users">
              <MyWorksUsersTab />
            </TabsContent>

            <TabsContent value="all-works">
              <MyWorksAllTab />
            </TabsContent>
          </Tabs>
        </div>
        )}

        {/* Reports Section */}
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
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
                <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
                <TabsTrigger value="volunteers" data-testid="tab-volunteers">Volunteers</TabsTrigger>
                <TabsTrigger value="creators" data-testid="tab-creators">Creators</TabsTrigger>
                <TabsTrigger value="reported-users" data-testid="tab-reported-users">Users</TabsTrigger>
                <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
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

        </Tabs>
      </CardContent>
    </Card>
    )}

        {/* Financial Section */}
        {activeTab === 'financial' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-6 h-6 text-green-600" />
              <span>Financial Management</span>
            </CardTitle>
            <CardDescription>Monitor transactions and financial activities</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="blockchain" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="blockchain" data-testid="tab-blockchain">Blockchain</TabsTrigger>
                <TabsTrigger value="deposits" data-testid="tab-deposits">Deposits</TabsTrigger>
                <TabsTrigger value="withdrawals" data-testid="tab-withdrawals">Withdrawals</TabsTrigger>
                <TabsTrigger value="contributions-tips" data-testid="tab-contributions-tips">Contribution & Tips</TabsTrigger>
                <TabsTrigger value="claimed-tips" data-testid="tab-claimed-tips">Claimed Tips</TabsTrigger>
                <TabsTrigger value="claimed-contributions" data-testid="tab-claimed-contributions">Claimed Contributions</TabsTrigger>
              </TabsList>

              <TabsContent value="blockchain" className="mt-6">
                <AllTransactionHistoriesTab />
              </TabsContent>

              <TabsContent value="deposits" className="mt-6">
                <DepositsTab />
              </TabsContent>

              <TabsContent value="withdrawals" className="mt-6">
                <WithdrawalsTab />
              </TabsContent>

              <TabsContent value="contributions-tips" className="mt-6">
                <ContributionsTipsTab />
              </TabsContent>

              <TabsContent value="claimed-tips" className="mt-6">
                <ClaimedTipsTab />
              </TabsContent>

              <TabsContent value="claimed-contributions" className="mt-6">
                <ClaimedContributionsTab />
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
        )}

        {/* Access Panel Section */}
        {activeTab === 'access' && (
          <AccessPanel />
        )}

        {/* Support Tickets Section */}
        {activeTab === 'tickets' && (
          <AdminTicketsTab />
        )}

        {/* Campaign Management Section */}
        {activeTab === 'campaigns' && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Flag className="w-6 h-6 text-green-600" />
              <span>Campaign Management</span>
            </CardTitle>
            <CardDescription>
              Review and manage campaigns across all statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={campaignTab} onValueChange={setCampaignTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="requests">Campaign Requests</TabsTrigger>
                <TabsTrigger value="active">Active Campaigns</TabsTrigger>
                <TabsTrigger value="rejected">Rejected Campaigns</TabsTrigger>
                <TabsTrigger value="closed">Closed Campaigns</TabsTrigger>
                <TabsTrigger value="flagged">Flagged Campaigns</TabsTrigger>
                <TabsTrigger value="flagged-creators">Flagged Creators</TabsTrigger>
              </TabsList>

              <TabsContent value="requests" className="mt-6">
                {isLoadingPendingCampaigns ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading pending campaigns...</p>
                  </div>
                ) : adminPendingCampaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending campaigns at this time.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {adminPendingCampaigns.map((campaign: any) => (
                      <Card key={campaign.id} className="border-yellow-200 bg-yellow-50 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-2">{campaign.title}</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  By: {campaign.creator?.firstName} {campaign.creator?.lastName}
                                </p>
                                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                                  {campaign.description}
                                </p>
                                <div className="text-sm text-gray-600">
                                  <div><strong>Goal:</strong> ₱{parseFloat(campaign.goalAmount || '0').toLocaleString()}</div>
                                  <div><strong>Minimum:</strong> ₱{parseFloat(campaign.minimumAmount || '0').toLocaleString()}</div>
                                  <div><strong>Category:</strong> {campaign.category}</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => {
                                  // For now, show info that this will be implemented in My Works
                                  toast({ title: "Campaign Claim", description: "Campaign claiming will be handled through the Reports system." });
                                }}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                                data-testid={`button-claim-campaign-${campaign.id}`}
                              >
                                <Handshake className="w-4 h-4 mr-1" />
                                CLAIM
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCampaign(campaign);
                                  setShowCampaignViewer(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active" className="mt-6">
                {activeCampaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active campaigns at this time.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeCampaigns.map((campaign: any) => (
                      <Card key={campaign.id} className="border-green-200 bg-green-50 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-2">{campaign.title}</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  By: {campaign.creatorName}
                                </p>
                                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                                  {campaign.description}
                                </p>
                                <div className="text-sm text-gray-600">
                                  <div><strong>Goal:</strong> ₱{parseFloat(campaign.goalAmount || '0').toLocaleString()}</div>
                                  <div><strong>Raised:</strong> ₱{parseFloat(campaign.currentAmount || '0').toLocaleString()}</div>
                                  <div><strong>Category:</strong> {campaign.category}</div>
                                  <div><strong>Progress:</strong> {Math.round((parseFloat(campaign.currentAmount || '0') / parseFloat(campaign.goalAmount || '1')) * 100)}%</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => {
                                  // For now, show info that this will be implemented in My Works
                                  toast({ title: "Campaign Claim", description: "Campaign claiming will be handled through the Reports system." });
                                }}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                                data-testid={`button-claim-campaign-${campaign.id}`}
                              >
                                <Handshake className="w-4 h-4 mr-1" />
                                CLAIM
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCampaign(campaign);
                                  setShowCampaignViewer(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                {rejectedCampaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No rejected campaigns at this time.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {rejectedCampaigns.map((campaign: any) => (
                      <Card key={campaign.id} className="border-red-200 bg-red-50 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-2">{campaign.title}</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  By: {campaign.creatorName}
                                </p>
                                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                                  {campaign.description}
                                </p>
                                <div className="text-sm text-gray-600">
                                  <div><strong>Goal:</strong> ₱{parseFloat(campaign.goalAmount || '0').toLocaleString()}</div>
                                  <div><strong>Category:</strong> {campaign.category}</div>
                                  <div><strong>Status:</strong> <Badge variant="destructive">Rejected</Badge></div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => approveCampaignMutation.mutate(campaign.id)}
                                disabled={approveCampaignMutation.isPending}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Re-approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCampaign(campaign);
                                  setShowCampaignViewer(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="closed" className="mt-6">
                {closedCampaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No closed campaigns at this time.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {closedCampaigns.map((campaign: any) => (
                      <Card key={campaign.id} className="border-gray-200 bg-gray-50 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-2">{campaign.title}</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  By: {campaign.creatorName}
                                </p>
                                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                                  {campaign.description}
                                </p>
                                <div className="text-sm text-gray-600">
                                  <div><strong>Goal:</strong> ₱{parseFloat(campaign.goalAmount || '0').toLocaleString()}</div>
                                  <div><strong>Final Amount:</strong> ₱{parseFloat(campaign.currentAmount || '0').toLocaleString()}</div>
                                  <div><strong>Category:</strong> {campaign.category}</div>
                                  <div><strong>Success Rate:</strong> {Math.round((parseFloat(campaign.currentAmount || '0') / parseFloat(campaign.goalAmount || '1')) * 100)}%</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCampaign(campaign);
                                  setShowCampaignViewer(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="flagged" className="mt-6">
                {flaggedCampaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No flagged campaigns at this time.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {flaggedCampaigns.map((campaign: any) => (
                      <Card key={campaign.id} className="border-orange-200 bg-orange-50 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-2">{campaign.title}</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  By: {campaign.creatorName}
                                </p>
                                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                                  {campaign.description}
                                </p>
                                <div className="text-sm text-gray-600">
                                  <div><strong>Goal:</strong> ₱{parseFloat(campaign.goalAmount || '0').toLocaleString()}</div>
                                  <div><strong>Raised:</strong> ₱{parseFloat(campaign.currentAmount || '0').toLocaleString()}</div>
                                  <div><strong>Category:</strong> {campaign.category}</div>
                                  <div><strong>Status:</strong> <Badge variant="destructive">Flagged</Badge></div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => {
                                  // For now, show info that this will be implemented in My Works
                                  toast({ title: "Campaign Claim", description: "Campaign claiming will be handled through the Reports system." });
                                }}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                                data-testid={`button-claim-campaign-${campaign.id}`}
                              >
                                <Handshake className="w-4 h-4 mr-1" />
                                CLAIM
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCampaign(campaign);
                                  setShowCampaignViewer(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="flagged-creators" className="mt-6">
                {isLoadingFlaggedCreators ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading flagged creators...</p>
                  </div>
                ) : flaggedCreators.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No flagged creators at this time.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {flaggedCreators.map((creator: any) => (
                      <Card key={creator.id} className="border-red-200 bg-red-50 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center overflow-hidden">
                                  {creator.profileImageUrl ? (
                                    <img 
                                      src={creator.profileImageUrl} 
                                      alt={`${creator.firstName || ''} ${creator.lastName || ''} profile`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-red-200 flex items-center justify-center">
                                      <UserIcon className="w-6 h-6 text-red-600" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-lg">
                                    {creator.firstName} {creator.lastName}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    ID: {creator.userDisplayId || `ID-${creator.id.slice(0, 8)}`}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Email: {creator.email}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="destructive" className="ml-2">
                                Flagged
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-red-600">Flag Reason:</span>
                                <p className="text-gray-700 mt-1">{creator.flagReason}</p>
                              </div>
                              <div className="text-xs text-gray-500">
                                Flagged on: {new Date(creator.flaggedAt).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => unflagCreatorMutation.mutate(creator.id)}
                                disabled={unflagCreatorMutation.isPending}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Unflag
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCreatorForDetails(creator);
                                  setShowCreatorDetails(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        )}

        {/* KYC Management Section */}
        {activeTab === 'kyc' && (
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
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pendingKYC.map((user: any) => {
                          const kycDocuments = user.kycDocuments ? JSON.parse(user.kycDocuments) : {};
                          
                          return (
                            <Card key={user.id} className="border-orange-200 bg-orange-50 hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="space-y-4">
                                  {/* User Header - Compact */}
                                  <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-orange-300">
                                      {user.profileImageUrl ? (
                                        <img 
                                          src={user.profileImageUrl} 
                                          alt={`${user.firstName || ''} ${user.lastName || ''} profile`}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement!;
                                            parent.innerHTML = `<div class="w-full h-full bg-orange-200 flex items-center justify-center"><svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>`;
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-orange-200 flex items-center justify-center">
                                          <UserIcon className="w-6 h-6 text-orange-600" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-base truncate">
                                        {user.firstName} {user.lastName}
                                      </h4>
                                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                      <p className="text-xs text-blue-600 font-mono font-bold">
                                        {user.userDisplayId || `ID-${user.id.slice(0, 8)}`}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Status Badges */}
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Pending Review
                                    </Badge>
                                    {user.isProfileComplete && (
                                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
                                        Profile Complete
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Quick Info */}
                                  <div className="text-xs text-gray-600 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span>Phone:</span>
                                      <span className={user.phoneNumber ? "text-gray-800" : "text-red-500 italic"}>
                                        {user.phoneNumber || "Not provided"}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span>KYC Documents:</span>
                                      <span className="text-gray-800">
                                        {Object.keys(kycDocuments).length} files
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span>Joined:</span>
                                      <span className="text-gray-800">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex gap-2">
                                    {user.claimedBy ? (
                                      <div className="flex-1 bg-gray-100 border border-gray-300 rounded px-3 py-2 text-center">
                                        <div className="text-xs text-gray-500 font-medium">CLAIMED</div>
                                        <div className="text-xs text-gray-600 truncate" title={user.claimedByEmail}>
                                          by {user.claimedByEmail}
                                        </div>
                                      </div>
                                    ) : (
                                      <Button
                                        onClick={() => claimKycMutation.mutate(user.id)}
                                        disabled={claimKycMutation.isPending}
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                                        data-testid={`button-claim-kyc-${user.id}`}
                                      >
                                        <Handshake className="w-4 h-4 mr-1" />
                                        {claimKycMutation.isPending ? "CLAIMING..." : "CLAIM"}
                                      </Button>
                                    )}
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          data-testid={`button-view-details-${user.id}`}
                                        >
                                          <Eye className="w-4 h-4 mr-1" />
                                          Details
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                          <DialogTitle>Complete KYC Profile: {user.firstName} {user.lastName}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-6">
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
                                                  {user.userDisplayId || `ID-${user.id.slice(0, 8)}`}
                                                </p>
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

                                          {/* KYC Documents */}
                                          {Object.keys(kycDocuments).length > 0 && (
                                            <div className="bg-white rounded-lg p-4 border">
                                              <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                                <FileText className="w-4 h-4 mr-2" />
                                                Uploaded KYC Documents
                                              </h5>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {Object.entries(kycDocuments).map(([docType, docUrl]: [string, any]) => {
                                                  const isImage = typeof docUrl === 'string' && (docUrl.includes('.jpg') || docUrl.includes('.jpeg') || docUrl.includes('.png'));
                                                  return (
                                                    <div key={docType} className="border rounded p-3">
                                                      <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium">{docType.replace('_', ' ').toUpperCase()}</span>
                                                        <Badge variant="secondary" className="text-xs">
                                                          {docType.includes('id') ? 'ID Document' : 'Supporting Document'}
                                                        </Badge>
                                                      </div>
                                                      {isImage ? (
                                                        <div className="space-y-2">
                                                          <img 
                                                            src={docUrl} 
                                                            alt={docType}
                                                            className="w-full h-48 object-cover rounded border cursor-pointer hover:opacity-80"
                                                            onClick={() => window.open(docUrl, '_blank')}
                                                            onError={(e) => {
                                                              const target = e.target as HTMLImageElement;
                                                              target.style.display = 'none';
                                                              target.nextElementSibling!.textContent = 'Image failed to load - may be expired URL';
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
                                                        <div className="text-center py-4">
                                                          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                          <button
                                                            onClick={() => window.open(docUrl, '_blank')}
                                                            className="flex items-center px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 mx-auto"
                                                          >
                                                            <Download className="w-3 h-3 mr-1" />
                                                            Download Document
                                                          </button>
                                                        </div>
                                                      )}
                                                      <p className="text-xs text-gray-500 mt-2 break-all">{docUrl}</p>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}

                                          {/* KYC Processing Information */}
                                          {(user.processedByAdmin || user.processedAt || user.rejectionReason) && (
                                            <div className="bg-gray-50 rounded-lg p-4 border">
                                              <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                                                <Shield className="w-4 h-4 mr-2" />
                                                Processing Information
                                              </h5>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                {user.processedByAdmin && (
                                                  <div>
                                                    <span className="font-medium text-gray-600">Processed by Admin:</span>
                                                    <p className="text-gray-800">{user.processedByAdmin}</p>
                                                  </div>
                                                )}
                                                {user.processedAt && (
                                                  <div>
                                                    <span className="font-medium text-gray-600">Processed Date:</span>
                                                    <p className="text-gray-800">{new Date(user.processedAt).toLocaleString()}</p>
                                                  </div>
                                                )}
                                                {user.rejectionReason && (
                                                  <div className="md:col-span-2">
                                                    <span className="font-medium text-gray-600">Rejection Reason:</span>
                                                    <p className="text-red-600 bg-red-50 p-2 rounded mt-1">{user.rejectionReason}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </DialogContent>
                                    </Dialog>
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
                                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-green-300">
                                    {user.profileImageUrl ? (
                                      <img 
                                        src={user.profileImageUrl} 
                                        alt={`${user.firstName || ''} ${user.lastName || ''} profile`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const parent = target.parentElement!;
                                          parent.innerHTML = `<div class="w-full h-full bg-green-200 flex items-center justify-center"><svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>`;
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-green-200 flex items-center justify-center">
                                        <UserIcon className="w-6 h-6 text-green-600" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold truncate">{user.firstName} {user.lastName}</h4>
                                    <p className="text-sm font-mono text-blue-600 font-bold">{user.userDisplayId || `ID-${user.id.slice(0, 8)}`}</p>
                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                    <p className="text-xs text-muted-foreground">Verified: {new Date(user.updatedAt).toLocaleDateString()}</p>
                                    {user.processedByAdmin && (
                                      <p className="text-xs text-green-600">Verified by: {user.processedByAdmin}</p>
                                    )}
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
                                          Complete profile information for verified user {user.userDisplayId || `ID-${user.id.slice(0, 8)}`}
                                        </DialogDescription>
                                      </DialogHeader>
                                      
                                      <div className="space-y-6">
                                        {/* User Header */}
                                        <div className="flex items-center space-x-4 bg-green-50 p-4 rounded-lg border border-green-200">
                                          <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-green-300">
                                            {user.profileImageUrl ? (
                                              <img 
                                                src={user.profileImageUrl} 
                                                alt={`${user.firstName || ''} ${user.lastName || ''} profile`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.style.display = 'none';
                                                  const parent = target.parentElement!;
                                                  parent.innerHTML = `<div class="w-full h-full bg-green-200 flex items-center justify-center"><svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>`;
                                                }}
                                              />
                                            ) : (
                                              <div className="w-full h-full bg-green-200 flex items-center justify-center">
                                                <UserIcon className="w-8 h-8 text-green-600" />
                                              </div>
                                            )}
                                          </div>
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
                                  <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-red-300">
                                    {user.profileImageUrl ? (
                                      <img 
                                        src={user.profileImageUrl} 
                                        alt={`${user.firstName || ''} ${user.lastName || ''} profile`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const parent = target.parentElement!;
                                          parent.innerHTML = `<div class="w-full h-full bg-red-200 flex items-center justify-center"><svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>`;
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-red-200 flex items-center justify-center">
                                        <UserIcon className="w-6 h-6 text-red-600" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold truncate">{user.firstName} {user.lastName}</h4>
                                    <p className="text-sm font-mono text-blue-600 font-bold">{user.userDisplayId || `ID-${user.id.slice(0, 8)}`}</p>
                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                    <p className="text-xs text-muted-foreground">Rejected: {new Date(user.updatedAt).toLocaleDateString()}</p>
                                    {user.processedByAdmin && (
                                      <p className="text-xs text-red-600">Rejected by: {user.processedByAdmin}</p>
                                    )}
                                    {user.rejectionReason && (
                                      <p className="text-xs text-red-600">Reason: {user.rejectionReason}</p>
                                    )}
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
                                          Complete profile information for rejected user {user.userDisplayId || `ID-${user.id.slice(0, 8)}`}
                                        </DialogDescription>
                                      </DialogHeader>
                                      
                                      <div className="space-y-6">
                                        {/* User Header */}
                                        <div className="flex items-center space-x-4 bg-red-50 p-4 rounded-lg border border-red-200">
                                          <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-red-300">
                                            {user.profileImageUrl ? (
                                              <img 
                                                src={user.profileImageUrl} 
                                                alt={`${user.firstName || ''} ${user.lastName || ''} profile`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.style.display = 'none';
                                                  const parent = target.parentElement!;
                                                  parent.innerHTML = `<div class="w-full h-full bg-red-200 flex items-center justify-center"><svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>`;
                                                }}
                                              />
                                            ) : (
                                              <div className="w-full h-full bg-red-200 flex items-center justify-center">
                                                <UserIcon className="w-8 h-8 text-red-600" />
                                              </div>
                                            )}
                                          </div>
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
                                  <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-yellow-300">
                                    {user.profileImageUrl ? (
                                      <img 
                                        src={user.profileImageUrl} 
                                        alt={`${user.firstName || ''} ${user.lastName || ''} profile`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const parent = target.parentElement!;
                                          parent.innerHTML = `<div class="w-full h-full bg-yellow-200 flex items-center justify-center"><svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>`;
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-yellow-200 flex items-center justify-center">
                                        <UserIcon className="w-6 h-6 text-yellow-600" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold truncate">{user.firstName} {user.lastName}</h4>
                                    <p className="text-sm font-mono text-blue-600 font-bold">{user.userDisplayId || `ID-${user.id.slice(0, 8)}`}</p>
                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                    <p className="text-xs text-muted-foreground">Suspended: {new Date(user.updatedAt).toLocaleDateString()}</p>
                                    {user.processedByAdmin && (
                                      <p className="text-xs text-yellow-600">Suspended by: {user.processedByAdmin}</p>
                                    )}
                                    {user.suspensionReason && (
                                      <p className="text-xs text-yellow-600">Reason: {user.suspensionReason}</p>
                                    )}
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
                                          Complete profile information for suspended user {user.userDisplayId || `ID-${user.id.slice(0, 8)}`}
                                        </DialogDescription>
                                      </DialogHeader>
                                      
                                      <div className="space-y-6">
                                        {/* User Header */}
                                        <div className="flex items-center space-x-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                          <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-yellow-300">
                                            {user.profileImageUrl ? (
                                              <img 
                                                src={user.profileImageUrl} 
                                                alt={`${user.firstName || ''} ${user.lastName || ''} profile`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.style.display = 'none';
                                                  const parent = target.parentElement!;
                                                  parent.innerHTML = `<div class="w-full h-full bg-yellow-200 flex items-center justify-center"><svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>`;
                                                }}
                                              />
                                            ) : (
                                              <div className="w-full h-full bg-yellow-200 flex items-center justify-center">
                                                <UserIcon className="w-8 h-8 text-yellow-600" />
                                              </div>
                                            )}
                                          </div>
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
        )}


        {/* Volunteers Management Section */}
        {activeTab === 'volunteers' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-purple-600" />
              <span>Volunteer Management</span>
            </CardTitle>
            <CardDescription>
              Manage volunteer applications, opportunities, and flagged volunteers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="applications" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="applications" data-testid="tab-volunteer-applications">Applications</TabsTrigger>
                <TabsTrigger value="opportunities" data-testid="tab-volunteer-opportunities">Opportunities</TabsTrigger>
                <TabsTrigger value="flagged" data-testid="tab-flagged-volunteers">Flagged Volunteers</TabsTrigger>
              </TabsList>

              <TabsContent value="applications">
                <VolunteerApplicationsTab />
              </TabsContent>

              <TabsContent value="opportunities">
                <VolunteerOpportunitiesTab />
              </TabsContent>

              <TabsContent value="flagged">
                <FlaggedVolunteersTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        )}

      </div>


      {/* Campaign Details Modal */}
      <Dialog open={showCampaignViewer} onOpenChange={setShowCampaignViewer}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Flagged Campaign Details</DialogTitle>
            <DialogDescription>
              Review campaign information and creator profile for administrative decision making
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-6">
              {/* Campaign Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Flag className="w-5 h-5" />
                    <span>Campaign Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2 text-sm">
                      <div><strong>ID:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{selectedCampaign.id}</code></div>
                      <div><strong>Title:</strong> {selectedCampaign.title}</div>
                      <div><strong>Goal:</strong> ₱{parseFloat(selectedCampaign.goalAmount).toLocaleString()}</div>
                      <div><strong>Current:</strong> ₱{parseFloat(selectedCampaign.currentAmount || '0').toLocaleString()}</div>
                      <div><strong>Category:</strong> <Badge variant="secondary">{selectedCampaign.category}</Badge></div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><strong>Status:</strong> <Badge variant={selectedCampaign.status === 'active' ? 'default' : 'destructive'}>{selectedCampaign.status}</Badge></div>
                      <div><strong>Created:</strong> {new Date(selectedCampaign.createdAt).toLocaleDateString()}</div>
                      <div><strong>Duration:</strong> {selectedCampaign.duration} days</div>
                      <div><strong>Needs Volunteers:</strong> {selectedCampaign.needsVolunteers ? 'Yes' : 'No'}</div>
                      {selectedCampaign.needsVolunteers && (
                        <div><strong>Volunteer Slots:</strong> {selectedCampaign.volunteerSlotsFilledCount || 0}/{selectedCampaign.volunteerSlots || 0}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Creator Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserIcon className="w-5 h-5" />
                    <span>Creator Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {campaignCreatorProfile ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                            {campaignCreatorProfile.profileImageUrl ? (
                              <img 
                                src={campaignCreatorProfile.profileImageUrl} 
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <UserIcon className="w-8 h-8 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {campaignCreatorProfile.firstName} {campaignCreatorProfile.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Creator ID: {campaignCreatorProfile.userDisplayId || (campaignCreatorProfile.id ? `ID-${campaignCreatorProfile.id.slice(0, 8)}...${campaignCreatorProfile.id.slice(-4)}` : 'No ID')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <div><strong>Email:</strong> {campaignCreatorProfile.email}</div>
                          <div><strong>Phone:</strong> {campaignCreatorProfile.phoneNumber || <span className="text-gray-400 italic">Not provided</span>}</div>
                          <div><strong>Address:</strong> {campaignCreatorProfile.address || <span className="text-gray-400 italic">Not provided</span>}</div>
                          <div><strong>Member Since:</strong> {new Date(campaignCreatorProfile.createdAt).toLocaleDateString()}</div>
                          <div><strong>KYC Status:</strong> <Badge variant={campaignCreatorProfile.kycStatus === 'verified' ? 'default' : 'destructive'}>{campaignCreatorProfile.kycStatus}</Badge></div>
                          <div><strong>Account Status:</strong> <Badge variant={campaignCreatorProfile.isSuspended ? 'destructive' : 'default'}>{campaignCreatorProfile.isSuspended ? 'Suspended' : 'Active'}</Badge></div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Professional Information */}
                        <div>
                          <h4 className="font-medium text-blue-600 mb-2">Professional Information</h4>
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="space-y-2 text-sm">
                              <div><strong>Profession:</strong> {campaignCreatorProfile.profession || <span className="text-gray-400 italic">Not provided</span>}</div>
                              <div><strong>Organization:</strong> {campaignCreatorProfile.organizationName || <span className="text-gray-400 italic">Not provided</span>}</div>
                              <div><strong>Organization Type:</strong> {campaignCreatorProfile.organizationType || <span className="text-gray-400 italic">Not provided</span>}</div>
                              <div><strong>Education:</strong> {campaignCreatorProfile.education || <span className="text-gray-400 italic">Not provided</span>}</div>
                              {campaignCreatorProfile.linkedinProfile && (
                                <div><strong>LinkedIn:</strong> <a href={campaignCreatorProfile.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Profile</a></div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Account & Scores */}
                        <div>
                          <h4 className="font-medium text-green-600 mb-2">Account Summary</h4>
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="space-y-2 text-sm">
                              <div><strong>PHP Balance:</strong> ₱{parseFloat(campaignCreatorProfile.phpBalance || '0').toLocaleString()}</div>
                              <div><strong>Social Score:</strong> {campaignCreatorProfile.socialScore || 0} points</div>
                              <div><strong>Reliability Score:</strong> {campaignCreatorProfile.reliabilityScore || '0.00'}/5.00 ({campaignCreatorProfile.reliabilityRatingsCount || 0} ratings)</div>
                              <div><strong>Credibility Score:</strong> {campaignCreatorProfile.credibilityScore || '100'}%</div>
                              <div><strong>Account Status:</strong> <Badge variant="outline">{campaignCreatorProfile.accountStatus || 'active'}</Badge></div>
                            </div>
                          </div>
                        </div>

                        {/* Flag/Suspension Status */}
                        {(campaignCreatorProfile.isFlagged || campaignCreatorProfile.isSuspended) && (
                          <div>
                            <h4 className="font-medium text-red-600 mb-2">Account Issues</h4>
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                              <div className="space-y-2 text-sm">
                                {campaignCreatorProfile.isFlagged && (
                                  <>
                                    <div><strong>Flagged:</strong> <Badge variant="destructive">Yes</Badge></div>
                                    <div><strong>Flag Reason:</strong> {campaignCreatorProfile.flagReason}</div>
                                    <div><strong>Flagged Date:</strong> {new Date(campaignCreatorProfile.flaggedAt).toLocaleDateString()}</div>
                                  </>
                                )}
                                {campaignCreatorProfile.isSuspended && (
                                  <>
                                    <div><strong>Suspended:</strong> <Badge variant="destructive">Yes</Badge></div>
                                    <div><strong>Suspension Reason:</strong> {campaignCreatorProfile.suspensionReason}</div>
                                    <div><strong>Suspended Date:</strong> {new Date(campaignCreatorProfile.suspendedAt).toLocaleDateString()}</div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div><strong>Name:</strong> {selectedCampaign.creatorName}</div>
                      <div><strong>Email:</strong> {selectedCampaign.creatorEmail}</div>
                      <div><strong>KYC Status:</strong> <Badge variant={selectedCampaign.creatorKycStatus === 'verified' ? 'default' : 'destructive'}>{selectedCampaign.creatorKycStatus}</Badge></div>
                      <p className="text-muted-foreground italic">Loading detailed creator profile...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Campaign Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg">
                    {selectedCampaign.description}
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              {(selectedCampaign.street || selectedCampaign.city || selectedCampaign.province) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>Campaign Location</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {selectedCampaign.street && <div><strong>Street:</strong> {selectedCampaign.street}</div>}
                      {selectedCampaign.barangay && <div><strong>Barangay:</strong> {selectedCampaign.barangay}</div>}
                      {selectedCampaign.city && <div><strong>City:</strong> {selectedCampaign.city}</div>}
                      {selectedCampaign.province && <div><strong>Province:</strong> {selectedCampaign.province}</div>}
                      {selectedCampaign.region && <div><strong>Region:</strong> {selectedCampaign.region}</div>}
                      {selectedCampaign.zipcode && <div><strong>Zip Code:</strong> {selectedCampaign.zipcode}</div>}
                      {selectedCampaign.landmark && <div><strong>Landmark:</strong> {selectedCampaign.landmark}</div>}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Creator Ratings Section for Flagged Campaigns */}
              {campaignCreatorProfile && creatorRatings && creatorRatings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="w-5 h-5" />
                      <span>Creator Ratings & Reviews</span>
                      <Badge variant="outline">{creatorRatings.length} reviews</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {creatorRatings.map((rating: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < rating.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                              <span className="font-medium">{rating.rating}/5</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(rating.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {rating.comment && (
                            <p className="text-sm text-gray-700 mb-2">{rating.comment}</p>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Campaign: {rating.campaignTitle || 'Unknown Campaign'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowCreatorDetails(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => unflagCreatorMutation.mutate(selectedCreatorForDetails.id)}
                  disabled={unflagCreatorMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Unflag Creator
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Volunteer Tab Components
function VolunteerApplicationsTab() {
  const { data: applications, isLoading } = useQuery({
    queryKey: ['/api/admin/volunteer-applications'],
    enabled: true,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Volunteer Applications</CardTitle>
          <CardDescription>Latest volunteer application activity across all campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading applications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Volunteer Applications</CardTitle>
          <CardDescription>Latest volunteer application activity across all campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No volunteer applications found.</p>
            <p className="text-sm text-muted-foreground mt-2">Applications will appear here when users apply for volunteer opportunities.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Volunteer Applications</CardTitle>
        <CardDescription>Latest volunteer application activity across all campaigns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applications.map((app: any) => (
            <div key={app.id} className="border rounded-lg p-4 space-y-3" data-testid={`application-${app.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={app.volunteer?.profileImageUrl} />
                    <AvatarFallback>{app.volunteer?.firstName?.[0]}{app.volunteer?.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{app.volunteer?.firstName} {app.volunteer?.lastName}</p>
                    <p className="text-sm text-muted-foreground">{app.volunteer?.email}</p>
                  </div>
                </div>
                <Badge variant={
                  app.status === 'approved' ? 'default' : 
                  app.status === 'rejected' ? 'destructive' : 'secondary'
                } data-testid={`status-${app.id}`}>
                  {app.status}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Campaign:</p>
                <p className="text-sm">{app.campaign?.title}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Intent:</p>
                <p className="text-sm">{app.intent}</p>
              </div>
              
              {app.message && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Message:</p>
                  <p className="text-sm">{app.message}</p>
                </div>
              )}
              
              {app.telegramDisplayName && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telegram:</p>
                  <p className="text-sm">@{app.telegramUsername} ({app.telegramDisplayName})</p>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Applied: {new Date(app.createdAt).toLocaleDateString()}
                </p>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" data-testid={`view-application-${app.id}`}>
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function VolunteerOpportunitiesTab() {
  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['/api/admin/volunteer-opportunities'],
    enabled: true,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Volunteer Opportunities</CardTitle>
          <CardDescription>Current campaigns seeking volunteers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading opportunities...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!opportunities || opportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Volunteer Opportunities</CardTitle>
          <CardDescription>Current campaigns seeking volunteers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No volunteer opportunities found.</p>
            <p className="text-sm text-muted-foreground mt-2">Opportunities will appear here when campaigns need volunteers.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Volunteer Opportunities</CardTitle>
        <CardDescription>Current campaigns seeking volunteers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.map((opp: any) => (
            <div key={opp.id} className="border rounded-lg p-4 space-y-3" data-testid={`opportunity-${opp.campaignId}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{opp.title}</h4>
                  <p className="text-sm text-muted-foreground">{opp.category}</p>
                </div>
                <Badge variant={opp.status === 'active' ? 'default' : 'secondary'} data-testid={`opportunity-status-${opp.campaignId}`}>
                  {opp.status}
                </Badge>
              </div>
              
              <p className="text-sm">{opp.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Location:</p>
                  <p>{opp.location}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Slots:</p>
                  <p>{opp.slotsFilled}/{opp.slotsNeeded}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={opp.creator?.profileImageUrl} />
                    <AvatarFallback>{opp.creator?.firstName?.[0]}{opp.creator?.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {opp.creator?.firstName} {opp.creator?.lastName}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" data-testid={`view-opportunity-${opp.campaignId}`}>
                    View Campaign
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FlaggedVolunteersTab() {
  const { data: flaggedVolunteers, isLoading } = useQuery({
    queryKey: ['/api/reported-volunteers'],
    enabled: true,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flagged Volunteers</CardTitle>
          <CardDescription>Reported volunteers requiring review and evidence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading flagged volunteers...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!flaggedVolunteers || flaggedVolunteers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flagged Volunteers</CardTitle>
          <CardDescription>Reported volunteers requiring review and evidence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No flagged volunteers at this time.</p>
            <p className="text-sm text-muted-foreground mt-2">Reports will appear here when volunteers are flagged by the community.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flagged Volunteers</CardTitle>
        <CardDescription>Reported volunteers requiring review and evidence</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {flaggedVolunteers.map((report: any) => (
            <div key={report.id} className="border rounded-lg p-4 space-y-3" data-testid={`flagged-volunteer-${report.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={report.reportedUser?.profileImageUrl} />
                    <AvatarFallback>{report.reportedUser?.firstName?.[0]}{report.reportedUser?.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{report.reportedUser?.firstName} {report.reportedUser?.lastName}</p>
                    <p className="text-sm text-muted-foreground">{report.reportedUser?.email}</p>
                  </div>
                </div>
                <Badge variant="destructive" data-testid={`report-status-${report.id}`}>
                  {report.status || 'Under Review'}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Report Type:</p>
                <p className="text-sm">{report.reportType}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description:</p>
                <p className="text-sm">{report.description}</p>
              </div>
              
              {report.evidence && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Evidence:</p>
                  <p className="text-sm text-blue-600 underline cursor-pointer">{report.evidence.length} file(s) attached</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Reporter:</p>
                  <p>{report.reporter?.firstName} {report.reporter?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{report.reporter?.email}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Reported:</p>
                  <p>{new Date(report.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" data-testid={`view-report-${report.id}`}>
                    Review Evidence
                  </Button>
                  <Button size="sm" variant="destructive" data-testid={`action-report-${report.id}`}>
                    Take Action
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Case #{report.id.slice(-8)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
