import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import CampaignCard from "@/components/campaign-card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Heart, Users, TrendingUp, Wallet, ArrowUpRight, CheckCircle, Coins, History, TrendingDown, Box } from "lucide-react";
import { format } from "date-fns";
import { DepositModal } from "@/components/deposit-modal";
import { WithdrawalModal } from "@/components/withdrawal-modal";
import { Link } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Redirect to login if not authenticated
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
  }, [isAuthenticated, isLoading, toast]);

  // Redirect Admin/Support users to Admin Panel
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if ((user as any)?.isAdmin || (user as any)?.isSupport) {
        window.location.href = "/admin";
        return;
      }
    }
  }, [isAuthenticated, isLoading, user]);

  const { data: userCampaigns } = useQuery({
    queryKey: ["/api/user/campaigns"],
    retry: false,
  });

  const { data: userContributions } = useQuery({
    queryKey: ["/api/user/contributions"],
    retry: false,
  });

  const { data: userTransactions } = useQuery({
    queryKey: ["/api/transactions/user"],
    retry: false,
  });

  const { data: featuredCampaigns } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: () => fetch("/api/campaigns?status=active&limit=6").then(res => res.json()),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const totalContributed = userContributions?.reduce((sum: number, contribution: any) => 
    sum + parseFloat(contribution.amount), 0) || 0;

  const totalRaised = userCampaigns?.reduce((sum: number, campaign: any) => 
    sum + parseFloat(campaign.currentAmount), 0) || 0;


  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-welcome">
            Welcome back, {user?.firstName || "User"}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Track your impact and discover new ways to make a difference
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Contributed</p>
                  <p className="text-2xl font-bold text-secondary" data-testid="stat-contributed">
                    ₱{totalContributed.toLocaleString()}
                  </p>
                </div>
                <Heart className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Campaigns Created</p>
                  <p className="text-2xl font-bold text-primary" data-testid="stat-campaigns">
                    {userCampaigns?.length || 0}
                  </p>
                </div>
                <PlusCircle className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Raised</p>
                  <p className="text-2xl font-bold text-accent" data-testid="stat-raised">
                    ₱{totalRaised.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">PHP Wallet</p>
                  <p className="text-2xl font-bold text-primary" data-testid="stat-balance">
                    ₱{parseFloat(user?.phpBalance || "0").toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Main wallet • Available for withdrawal</p>
                </div>
                <Coins className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Wallets */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Tips Wallet */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Tips Wallet</p>
                  <p className="text-xl font-bold text-secondary" data-testid="stat-tips">
                    ₱{parseFloat(user?.tipsBalance || "0").toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Tips from supporters</p>
                </div>
                <Heart className="w-6 h-6 text-secondary" />
              </div>
            </CardContent>
          </Card>

          {/* Contributions Wallet */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Contributions Wallet</p>
                  <p className="text-xl font-bold text-accent" data-testid="stat-contributions">
                    ₱{parseFloat(user?.contributionsBalance || "0").toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Claimable contributions</p>
                </div>
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>


        {/* KYC Status removed - verification handled in navigation */}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Quick Actions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link href="/create-campaign">
                    <Button className="w-full justify-start" data-testid="button-create-campaign">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create New Campaign
                    </Button>
                  </Link>
                  <Link href="/browse-campaigns">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-browse-campaigns">
                      <Users className="w-4 h-4 mr-2" />
                      Campaign Opportunities
                    </Button>
                  </Link>
                  <DepositModal />
                  <WithdrawalModal />
                </div>
              </CardContent>
            </Card>

            {/* Featured Campaigns */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Featured Campaigns</h2>
                <Link href="/campaigns">
                  <Button variant="ghost" data-testid="button-view-all-campaigns">View All</Button>
                </Link>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {featuredCampaigns && featuredCampaigns.length > 0 ? (
                  featuredCampaigns.slice(0, 4).map((campaign: any) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12">
                    <p className="text-muted-foreground">No campaigns available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* My Campaigns */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>My Campaigns</span>
                  <Badge variant="secondary">{userCampaigns?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userCampaigns && userCampaigns.length > 0 ? (
                  <div className="space-y-3">
                    {userCampaigns.slice(0, 3).map((campaign: any) => (
                      <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                        <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" data-testid={`campaign-summary-${campaign.id}`}>
                          <h4 className="font-medium text-sm mb-1">{campaign.title}</h4>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>₱{parseFloat(campaign.currentAmount).toLocaleString()}</span>
                            <Badge variant="outline" className="text-xs">
                              {campaign.status}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {userCampaigns.length > 3 && (
                      <Link href="/campaigns?creator=me">
                        <Button variant="ghost" size="sm" className="w-full">
                          View All My Campaigns
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-2">No campaigns yet</p>
                    <Link href="/create-campaign">
                      <Button size="sm" data-testid="button-create-first-campaign">Create Your First Campaign</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="w-5 h-5" />
                  <span>Transaction History</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click on any transaction to view detailed information
                </p>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto space-y-3">
                  {userTransactions && userTransactions.length > 0 ? (
                    userTransactions.map((transaction: any) => {
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
                          'transfer': 'Transfer',
                          'payout': 'Payout',
                          'conversion': 'Currency Conversion'
                        };
                        return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      };

                      return (
                        <div 
                          key={transaction.id}
                          onClick={() => setSelectedTransaction(transaction)}
                          className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-all hover:shadow-md"
                          data-testid={`transaction-detail-${transaction.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                transaction.type === 'deposit' ? 'bg-green-100' :
                                transaction.type === 'withdrawal' || transaction.type === 'withdraw' ? 'bg-blue-100' :
                                transaction.type === 'contribution' ? 'bg-purple-100' :
                                transaction.type === 'tip' ? 'bg-orange-100' :
                                transaction.type.includes('claim') ? 'bg-yellow-100' :
                                'bg-gray-100'
                              }`}>
                                {transaction.type === 'deposit' && <TrendingUp className="w-3 h-3 text-green-600" />}
                                {(transaction.type === 'withdrawal' || transaction.type === 'withdraw') && <TrendingDown className="w-3 h-3 text-blue-600" />}
                                {transaction.type === 'contribution' && <Heart className="w-3 h-3 text-purple-600" />}
                                {transaction.type === 'tip' && <Heart className="w-3 h-3 text-orange-600" />}
                                {transaction.type.includes('claim') && <CheckCircle className="w-3 h-3 text-yellow-600" />}
                                {!['deposit', 'withdrawal', 'withdraw', 'contribution', 'tip'].includes(transaction.type) && !transaction.type.includes('claim') && <Box className="w-3 h-3 text-gray-600" />}
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  {getTransactionTypeLabel(transaction.type)}
                                </div>
                                <div className="font-semibold text-base text-gray-900">
                                  ₱{parseFloat(transaction.amount || '0').toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  ID: {transaction.id.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={
                                  transaction.status === 'completed' ? 'default' : 
                                  transaction.status === 'failed' ? 'destructive' : 
                                  'secondary'
                                }
                                className="text-xs"
                              >
                                {transaction.status}
                              </Badge>
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(new Date(transaction.createdAt), "MMM d, yyyy")}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Transaction History</h3>
                      <p className="text-muted-foreground">
                        Your transaction history will appear here once you make your first contribution or withdrawal.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Transaction Details Modal */}
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>Transaction Details</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedTransaction && (
              <div className="space-y-6">
                {/* Transaction Overview */}
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedTransaction.type === 'deposit' ? 'bg-green-100' :
                      selectedTransaction.type === 'withdrawal' || selectedTransaction.type === 'withdraw' ? 'bg-blue-100' :
                      selectedTransaction.type === 'contribution' ? 'bg-purple-100' :
                      selectedTransaction.type === 'tip' ? 'bg-orange-100' :
                      selectedTransaction.type && selectedTransaction.type.includes('claim') ? 'bg-yellow-100' :
                      'bg-gray-100'
                    }`}>
                      {selectedTransaction.type === 'deposit' && <TrendingUp className="w-6 h-6 text-green-600" />}
                      {(selectedTransaction.type === 'withdrawal' || selectedTransaction.type === 'withdraw') && <TrendingDown className="w-6 h-6 text-blue-600" />}
                      {selectedTransaction.type === 'contribution' && <Heart className="w-6 h-6 text-purple-600" />}
                      {selectedTransaction.type === 'tip' && <Heart className="w-6 h-6 text-orange-600" />}
                      {selectedTransaction.type && selectedTransaction.type.includes('claim') && <CheckCircle className="w-6 h-6 text-yellow-600" />}
                      {!['deposit', 'withdrawal', 'withdraw', 'contribution', 'tip'].includes(selectedTransaction.type || '') && !(selectedTransaction.type || '').includes('claim') && <Box className="w-6 h-6 text-gray-600" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {selectedTransaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <p className="text-2xl font-bold text-primary">
                        ₱{parseFloat(selectedTransaction.amount || '0').toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      selectedTransaction.status === 'completed' ? 'default' : 
                      selectedTransaction.status === 'failed' ? 'destructive' : 
                      'secondary'
                    }
                  >
                    {selectedTransaction.status}
                  </Badge>
                </div>

                {/* Transaction Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                    <p className="text-sm font-mono break-all">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Transaction Type</label>
                    <p className="text-sm">{selectedTransaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                    <p className="text-sm">{format(new Date(selectedTransaction.createdAt), "PPP 'at' p")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-sm">{selectedTransaction.status || 'Completed'}</p>
                  </div>
                  {selectedTransaction.fee && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fee</label>
                      <p className="text-sm">₱{parseFloat(selectedTransaction.fee).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedTransaction.campaignId && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Campaign ID</label>
                      <p className="text-sm font-mono break-all">{selectedTransaction.campaignId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
