import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  User, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Edit,
  Wallet,
  Target,
  TrendingUp,
  Award,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Camera,
  History,
  Heart,
  Box,
  TrendingDown,
  Gift,
  Users
} from "lucide-react";
import { format } from "date-fns";

export default function MyProfile() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClaimTipsModalOpen, setIsClaimTipsModalOpen] = useState(false);

  const { data: userTransactions = [] } = useQuery({
    queryKey: ["/api/transactions/user"],
    enabled: isAuthenticated,
  }) as { data: any[] };

  const { data: userCampaigns = [] } = useQuery({
    queryKey: ["/api/user/campaigns"],
    enabled: isAuthenticated,
  }) as { data: any[] };

  const { data: userContributions = [] } = useQuery({
    queryKey: ["/api/user/contributions"],
    enabled: isAuthenticated,
  }) as { data: any[] };

  // Fetch user scores
  const { data: creditScoreData } = useQuery({
    queryKey: ["/api/auth/user/credit-score"],
    enabled: isAuthenticated,
  }) as { data: { averageScore: number } | undefined };

  const { data: averageRatingData } = useQuery({
    queryKey: ["/api/users", (user as any)?.id, "creator-rating"],
    enabled: isAuthenticated && (user as any)?.id,
  }) as { data: { averageRating: number; totalRatings: number } | undefined };

  const claimTipsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/users/claim-tips", {});
    },
    onSuccess: (data: any) => {
      toast({
        title: "Tips Claimed Successfully!",
        description: `${data.claimedAmount} PUSO has been transferred to your main wallet.`,
      });
      setIsClaimTipsModalOpen(false);
      
      // Refresh user data to show updated balances
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Claiming Tips",
        description: error.message || "Failed to claim tips. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Please sign in to view your profile.</p>
            <Button onClick={() => window.location.href = "/api/login"}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getKycStatusBadge = () => {
    const status = (user as any)?.kycStatus;
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Not Started
          </Badge>
        );
    }
  };

  // Calculate user statistics
  const totalContributed = (userTransactions as any[]).reduce((sum: number, contrib: any) => sum + parseFloat(contrib.amount || "0"), 0);
  const totalRaised = (userCampaigns as any[]).reduce((sum: number, campaign: any) => sum + parseFloat(campaign.currentAmount || "0"), 0);
  const successfulCampaigns = (userCampaigns as any[]).filter((campaign: any) => campaign.status === "active" && parseFloat(campaign.currentAmount || "0") >= parseFloat(campaign.goalAmount || "1")).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information and track your VeriFund journey</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="relative mx-auto mb-4">
                  <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center mx-auto">
                    {(user as any)?.profileImageUrl ? (
                      <img 
                        src={`/public-objects${(user as any).profileImageUrl.replace('/objects', '')}`} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-medium text-gray-600">
                        {(user as any)?.firstName?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  {(user as any)?.kycStatus === "verified" && (
                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                      <CheckCircle className="w-4 h-4 text-white" fill="currentColor" />
                    </div>
                  )}
                </div>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <span>{(user as any)?.firstName} {(user as any)?.lastName}</span>
                </CardTitle>
                <div className="flex justify-center mt-2">
                  {getKycStatusBadge()}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{(user as any)?.email}</span>
                  </div>
                  {(user as any)?.profession && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Briefcase className="w-4 h-4 text-gray-500" />
                      <span>{(user as any).profession}</span>
                    </div>
                  )}
                  {(user as any)?.location && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{(user as any).location}</span>
                    </div>
                  )}
                  {(user as any)?.phoneNumber && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{(user as any).phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>Joined {format(new Date((user as any)?.createdAt || Date.now()), "MMMM yyyy")}</span>
                  </div>
                </div>
                
                {(user as any)?.kycStatus !== "verified" && (
                  <Button 
                    className="w-full"
                    onClick={() => window.location.href = "/profile-verification"}
                  >
                    Complete Verification
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* User Scores Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>My Scores</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your performance metrics and community ratings
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Credit Score */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900">Credit Score</h3>
                      <p className="text-sm text-blue-700">Document quality rating</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600" data-testid="text-credit-score">
                      {creditScoreData?.averageScore ? `${Math.round(creditScoreData.averageScore)}%` : 'N/A'}
                    </div>
                    <div className="text-xs text-blue-600">Average</div>
                  </div>
                </div>

                {/* Social Score */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-900">Social Score</h3>
                      <p className="text-sm text-green-700">Community safety points</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600" data-testid="text-social-score">
                      {(user as any)?.socialScore || 0}
                    </div>
                    <div className="text-xs text-green-600">Points</div>
                  </div>
                </div>

                {/* Average Star Rating */}
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-yellow-900">Creator Rating</h3>
                      <p className="text-sm text-yellow-700">Community star rating</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 justify-end">
                      <div className="text-2xl font-bold text-yellow-600" data-testid="text-creator-rating">
                        {averageRatingData?.averageRating ? averageRatingData.averageRating.toFixed(1) : 'N/A'}
                      </div>
                      {averageRatingData?.averageRating && (
                        <Award className="w-5 h-5 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <div className="text-xs text-yellow-600">
                      {averageRatingData?.totalRatings ? `${averageRatingData.totalRatings} ratings` : 'No ratings yet'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>Wallet Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      ₱{parseFloat((user as any)?.pusoBalance || "0").toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">PUSO Balance</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {parseFloat((user as any)?.tipsBalance || "0").toLocaleString()} PUSO
                    </div>
                    {parseFloat((user as any)?.tipsBalance || '0') > 0 && (
                      <Dialog open={isClaimTipsModalOpen} onOpenChange={setIsClaimTipsModalOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="mt-2 w-full bg-yellow-600 hover:bg-yellow-700"
                            data-testid="button-claim-tips"
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            Claim Tips to PUSO Wallet
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Claim Your Tips</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                              <div className="text-center">
                                <Gift className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                                <div className="text-lg font-semibold text-yellow-800">
                                  {parseFloat((user as any)?.tipsBalance || '0').toLocaleString()} PUSO
                                </div>
                                <div className="text-sm text-yellow-700">Available Tips to Claim</div>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              <p>When you claim tips:</p>
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Tips will be transferred to your main PUSO wallet</li>
                                <li>You can then use PUSO for contributions or withdrawals</li>
                                <li>Tips balance will be reset to 0 PUSO</li>
                              </ul>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => setIsClaimTipsModalOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                                onClick={() => claimTipsMutation.mutate()}
                                disabled={claimTipsMutation.isPending}
                                data-testid="button-confirm-claim-tips"
                              >
                                {claimTipsMutation.isPending ? "Claiming..." : "Claim Tips"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    <div className="text-sm text-gray-600">Tips Balance</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      ₱{parseFloat((user as any)?.contributionsBalance || "0").toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Contributions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics & Milestones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Campaigns Created</span>
                    <span className="font-semibold">{(userCampaigns as any[]).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Raised</span>
                    <span className="font-semibold">₱{totalRaised.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Contributed</span>
                    <span className="font-semibold">₱{totalContributed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Successful Campaigns</span>
                    <span className="font-semibold">{successfulCampaigns}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Transactions</span>
                    <span className="font-semibold">{(userTransactions as any[]).length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Milestones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className={`flex items-center space-x-2 p-2 rounded ${(user as any)?.kycStatus === "verified" ? "bg-green-50" : "bg-gray-50"}`}>
                    <CheckCircle className={`w-4 h-4 ${(user as any)?.kycStatus === "verified" ? "text-green-600" : "text-gray-400"}`} />
                    <span className={`text-sm ${(user as any)?.kycStatus === "verified" ? "text-green-800" : "text-gray-600"}`}>
                      Identity Verified
                    </span>
                  </div>
                  <div className={`flex items-center space-x-2 p-2 rounded ${(userCampaigns as any[]).length > 0 ? "bg-green-50" : "bg-gray-50"}`}>
                    <Target className={`w-4 h-4 ${(userCampaigns as any[]).length > 0 ? "text-green-600" : "text-gray-400"}`} />
                    <span className={`text-sm ${(userCampaigns as any[]).length > 0 ? "text-green-800" : "text-gray-600"}`}>
                      First Campaign Created
                    </span>
                  </div>
                  <div className={`flex items-center space-x-2 p-2 rounded ${(userTransactions as any[]).length > 0 ? "bg-green-50" : "bg-gray-50"}`}>
                    <Wallet className={`w-4 h-4 ${(userTransactions as any[]).length > 0 ? "text-green-600" : "text-gray-400"}`} />
                    <span className={`text-sm ${(userTransactions as any[]).length > 0 ? "text-green-800" : "text-gray-600"}`}>
                      First Contribution Made
                    </span>
                  </div>
                  <div className={`flex items-center space-x-2 p-2 rounded ${successfulCampaigns > 0 ? "bg-green-50" : "bg-gray-50"}`}>
                    <Award className={`w-4 h-4 ${successfulCampaigns > 0 ? "text-green-600" : "text-gray-400"}`} />
                    <span className={`text-sm ${successfulCampaigns > 0 ? "text-green-800" : "text-gray-600"}`}>
                      Successful Campaign
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="w-5 h-5" />
                  <span>Transaction History</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete record of all your transactions with detailed information
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userTransactions && (userTransactions as any[]).length > 0 ? (
                    (userTransactions as any[]).map((transaction: any) => (
                      <div 
                        key={transaction.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        data-testid={`transaction-detail-${transaction.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === 'deposit' ? 'bg-green-100' :
                              transaction.type === 'withdrawal' ? 'bg-blue-100' :
                              transaction.type === 'contribution' ? 'bg-purple-100' :
                              'bg-gray-100'
                            }`}>
                              {transaction.type === 'deposit' && <TrendingUp className="w-5 h-5 text-green-600" />}
                              {transaction.type === 'withdrawal' && <TrendingDown className="w-5 h-5 text-blue-600" />}
                              {transaction.type === 'contribution' && <Heart className="w-5 h-5 text-purple-600" />}
                              {!['deposit', 'withdrawal', 'contribution'].includes(transaction.type) && <Box className="w-5 h-5 text-gray-600" />}
                            </div>
                            <div>
                              <h4 className="font-semibold capitalize">
                                {transaction.type.replace('_', ' ')}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {transaction.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-lg">
                                ₱{parseFloat(transaction.amount || '0').toLocaleString()}
                              </span>
                              <Badge 
                                variant={
                                  transaction.status === 'completed' ? 'default' : 
                                  transaction.status === 'failed' ? 'destructive' : 
                                  'secondary'
                                }
                                className="ml-2"
                              >
                                {transaction.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {/* Detailed Information */}
                        <div className="grid md:grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground font-medium">Transaction ID:</span>
                              <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                                {transaction.id}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground font-medium">Date & Time:</span>
                              <span>{new Date(transaction.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground font-medium">Type:</span>
                              <span className="capitalize">{transaction.type.replace('_', ' ')}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {transaction.exchangeRate && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground font-medium">Exchange Rate:</span>
                                <span>₱{parseFloat(transaction.exchangeRate).toLocaleString()} PHP/PUSO</span>
                              </div>
                            )}
                            {transaction.feeAmount && parseFloat(transaction.feeAmount) > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground font-medium">Fees:</span>
                                <span>₱{parseFloat(transaction.feeAmount).toLocaleString()}</span>
                              </div>
                            )}
                            {transaction.transactionHash && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground font-medium">Hash:</span>
                                <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                                  {transaction.transactionHash.slice(0, 16)}...
                                </span>
                              </div>
                            )}
                            {transaction.paymentProvider && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground font-medium">Payment Method:</span>
                                <span className="capitalize">{transaction.paymentProvider}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress/Status Details */}
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-4 text-muted-foreground">
                            <span>Created: {format(new Date(transaction.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                            {transaction.updatedAt && transaction.updatedAt !== transaction.createdAt && (
                              <span>Updated: {format(new Date(transaction.updatedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                            )}
                          </div>
                          {transaction.status === 'completed' && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              <span>Completed</span>
                            </div>
                          )}
                          {transaction.status === 'pending' && (
                            <div className="flex items-center space-x-1 text-yellow-600">
                              <Clock className="w-3 h-3" />
                              <span>Processing</span>
                            </div>
                          )}
                          {transaction.status === 'failed' && (
                            <div className="flex items-center space-x-1 text-red-600">
                              <AlertCircle className="w-3 h-3" />
                              <span>Failed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
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

            {/* KYC Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>KYC Verification Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(user as any)?.profileImageUrl ? "bg-green-100" : "bg-gray-100"}`}>
                        {(user as any)?.profileImageUrl ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Camera className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Profile Picture</p>
                        <p className="text-sm text-gray-600">Upload a clear photo of yourself</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {(user as any)?.profileImageUrl ? (
                        <Badge className="bg-green-100 text-green-800">Complete</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(user as any)?.profession ? "bg-green-100" : "bg-gray-100"}`}>
                        {(user as any)?.profession ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Professional Information</p>
                        <p className="text-sm text-gray-600">Complete your professional details</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {(user as any)?.profession ? (
                        <Badge className="bg-green-100 text-green-800">Complete</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(user as any)?.kycStatus === "verified" ? "bg-green-100" : "bg-gray-100"}`}>
                        {(user as any)?.kycStatus === "verified" ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Shield className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Identity Verification</p>
                        <p className="text-sm text-gray-600">Submit valid ID and proof of address</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getKycStatusBadge()}
                    </div>
                  </div>

                  {(user as any)?.kycStatus !== "verified" && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 mb-3">
                        <strong>Complete your verification to unlock all features:</strong>
                      </p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Create fundraising campaigns</li>
                        <li>• Withdraw funds to your bank account</li>
                        <li>• Access premium analytics</li>
                        <li>• Build trust with contributors</li>
                      </ul>
                      <Button 
                        className="mt-3"
                        onClick={() => window.location.href = "/profile-verification"}
                      >
                        Complete Verification
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}