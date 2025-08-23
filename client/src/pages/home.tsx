import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import CampaignCard from "@/components/campaign-card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Heart, Users, TrendingUp, Wallet, ArrowUpRight, ArrowDownLeft, Coins } from "lucide-react";
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
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Transactions</span>
                  <Badge variant="secondary">{userTransactions?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userTransactions && userTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {userTransactions.slice(0, 5).map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`transaction-${transaction.id}`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            transaction.type === 'deposit' ? 'bg-green-100 text-green-600' :
                            transaction.type === 'withdrawal' ? 'bg-blue-100 text-blue-600' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                            {transaction.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> :
                             transaction.type === 'withdrawal' ? <ArrowUpRight className="w-4 h-4" /> :
                             <TrendingUp className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">
                            ₱{parseFloat(transaction.amount).toLocaleString()}
                          </div>
                          <Badge 
                            variant={transaction.status === 'completed' ? 'default' : 
                                   transaction.status === 'pending' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm" className="text-xs">
                        View All Transactions
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-2">No transactions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Contributions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Contributions</span>
                  <Badge variant="secondary">{userContributions?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userContributions && userContributions.length > 0 ? (
                  <div className="space-y-3">
                    {userContributions.slice(0, 3).map((contribution: any) => (
                      <div key={contribution.id} className="p-3 border rounded-lg" data-testid={`contribution-summary-${contribution.id}`}>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium">₱{parseFloat(contribution.amount).toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(contribution.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-2">No contributions yet</p>
                    <Link href="/campaigns">
                      <Button size="sm" data-testid="button-start-contributing">Start Contributing</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
