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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
  Users,
  Star
} from "lucide-react";
import { format } from "date-fns";
import UserVerifiedBadge from "@/components/UserVerifiedBadge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isUnauthorizedError } from "@/lib/authUtils";
import { WithdrawalModal } from "@/components/withdrawal-modal";
import { ObjectUploader } from "@/components/ObjectUploader";

const claimTipFormSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && num <= 999999;
    },
    "Amount must be a positive number (max 999,999)"
  ),
});

const claimContributionFormSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && num <= 999999;
    },
    "Amount must be a positive number (max 999,999)"
  ),
});

export default function MyProfile() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClaimTipsModalOpen, setIsClaimTipsModalOpen] = useState(false);
  const [isClaimContributionsModalOpen, setIsClaimContributionsModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Tip claiming form setup
  const claimTipForm = useForm<z.infer<typeof claimTipFormSchema>>({
    resolver: zodResolver(claimTipFormSchema),
    defaultValues: {
      amount: "",
    },
  });

  // Contribution claiming form setup
  const claimContributionForm = useForm<z.infer<typeof claimContributionFormSchema>>({
    resolver: zodResolver(claimContributionFormSchema),
    defaultValues: {
      amount: "",
    },
  });

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
    enabled: Boolean(isAuthenticated && (user as any)?.id),
  }) as { data: { averageRating: number; totalRatings: number } | undefined };

  const claimTipsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof claimTipFormSchema>) => {
      return await apiRequest("POST", "/api/users/claim-tips", {
        amount: parseFloat(data.amount)
      });
    },
    onSuccess: (data: any) => {
      const claimedAmount = parseFloat(data.claimedAmount || '0');
      toast({
        title: "Tips Claimed Successfully!",
        description: `₱${claimedAmount.toLocaleString()} has been transferred to your PHP wallet.`,
      });
      setIsClaimTipsModalOpen(false);
      claimTipForm.reset();
      
      // Refresh user data to show updated balances
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error Claiming Tips",
        description: error.message || "Failed to claim tips. Please try again.",
        variant: "destructive",
      });
    },
  });

  const claimContributionsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/wallet/claim-contributions", {});
    },
    onSuccess: (data: any) => {
      const claimedAmount = parseFloat(data.amount || '0');
      toast({
        title: "Contributions Claimed Successfully!",
        description: `₱${claimedAmount.toLocaleString()} has been transferred to your PHP wallet.`,
      });
      setIsClaimContributionsModalOpen(false);
      claimContributionForm.reset();
      
      // Refresh user data to show updated balances
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/user"] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error Claiming Contributions",
        description: error.message || "Failed to claim contributions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const profileImageMutation = useMutation({
    mutationFn: async (data: { profileImageUrl: string }) => {
      return await apiRequest("PUT", "/api/profile/image", data);
    },
    onSuccess: () => {
      // Refresh user data to show updated profile image
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
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
      console.error('Profile image update error:', error);
    },
  });

  // Tip claiming handler
  const onClaimTip = (data: z.infer<typeof claimTipFormSchema>) => {
    claimTipsMutation.mutate(data);
  };

  // Contribution claiming handler
  const onClaimContribution = () => {
    claimContributionsMutation.mutate();
  };

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
                  <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center mx-auto relative group">
                    {(user as any)?.profileImageUrl ? (
                      <img 
                        src={(user as any).profileImageUrl} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-medium text-gray-600">
                        {(user as any)?.firstName?.charAt(0) || 'U'}
                      </span>
                    )}
                    {/* Upload overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880} // 5MB
                        onGetUploadParameters={async () => {
                          const response = await apiRequest('/api/objects/upload', {
                            method: 'POST',
                          });
                          return {
                            method: 'PUT' as const,
                            url: response.url,
                          };
                        }}
                        onComplete={async (result) => {
                          if (result.successful && result.successful.length > 0) {
                            const uploadURL = result.successful[0].uploadURL;
                            try {
                              await profileImageMutation.mutateAsync({ profileImageUrl: uploadURL });
                              toast({
                                title: "Profile Picture Updated",
                                description: "Your profile picture has been updated successfully.",
                              });
                            } catch (error) {
                              console.error('Error updating profile image:', error);
                              toast({
                                title: "Update Failed",
                                description: "Failed to update profile picture. Please try again.",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                        buttonClassName="bg-transparent border-none p-0 h-auto hover:bg-transparent"
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </ObjectUploader>
                    </div>
                  </div>
                  {(user as any)?.kycStatus === "verified" && (
                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-2 border-white shadow-lg">
                      <Shield className="w-4 h-4 text-white fill-current" />
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
                  <div className="flex items-center space-x-2 text-xs">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{(user as any)?.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-mono text-xs">
                      User ID: {(user as any)?.userDisplayId || (user as any)?.id?.slice(0, 8) + '...'}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText((user as any)?.userDisplayId || (user as any)?.id || '');
                        toast({
                          title: "User ID Copied",
                          description: "Your user ID has been copied to clipboard",
                        });
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                      title="Click to copy full User ID"
                      data-testid="button-copy-user-id"
                    >
                      Copy
                    </button>
                  </div>
                  {(user as any)?.profession && (
                    <div className="flex items-center space-x-2 text-xs">
                      <Briefcase className="w-4 h-4 text-gray-500" />
                      <span>{(user as any).profession}</span>
                    </div>
                  )}
                  {(user as any)?.location && (
                    <div className="flex items-center space-x-2 text-xs">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{(user as any).location}</span>
                    </div>
                  )}
                  {(user as any)?.phoneNumber && (
                    <div className="flex items-center space-x-2 text-xs">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{(user as any).phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-xs">
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
                <p className="text-xs text-muted-foreground">
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
                      <p className="text-xs text-blue-700">Document quality rating</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600" data-testid="text-credit-score">
                      {creditScoreData?.averageScore ? `${Math.round(creditScoreData.averageScore)}%` : '0%'}
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
                      <p className="text-xs text-green-700">Community safety points</p>
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
                      <p className="text-xs text-yellow-700">Community star rating</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 justify-end">
                      <div className="text-2xl font-bold text-yellow-600" data-testid="text-creator-rating">
                        {averageRatingData?.averageRating && averageRatingData.averageRating > 0 
                          ? averageRatingData.averageRating.toFixed(1) 
                          : '0'}
                      </div>
                      {averageRatingData?.averageRating && averageRatingData.averageRating > 0 ? (
                        <Award className="w-5 h-5 text-yellow-500 fill-current" />
                      ) : null}
                    </div>
                    <div className="text-xs text-yellow-600">
                      {averageRatingData?.totalRatings ? `${averageRatingData.totalRatings} ratings` : '0 ratings'}
                    </div>
                  </div>
                </div>

                {/* Reliability Score */}
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-purple-900">Reliability Score</h3>
                      <p className="text-xs text-purple-700">Volunteer safety rating</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 justify-end">
                      <div className="text-2xl font-bold text-purple-600" data-testid="text-reliability-score">
                        {(user as any)?.reliabilityScore && parseFloat((user as any).reliabilityScore.toString()) > 0 
                          ? parseFloat((user as any).reliabilityScore.toString()).toFixed(1) 
                          : '0.0'}
                      </div>
                    </div>
                    <div className="text-xs text-purple-600">
                      {(user as any)?.reliabilityRatingsCount ? `${(user as any).reliabilityRatingsCount} ratings` : '0 ratings'}
                    </div>
                  </div>
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
                        <p className="text-xs text-gray-600">Upload a clear photo of yourself</p>
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
                        <p className="text-xs text-gray-600">Complete your professional details</p>
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
                        <p className="text-xs text-gray-600">Submit valid ID and proof of address</p>
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
                      ₱{parseFloat((user as any)?.phpBalance || "0").toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">PHP Wallet</div>
                    <div className="text-xs text-gray-500 mb-2">Your available money for withdrawal</div>
                    <Button 
                      size="sm" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => setIsWithdrawalModalOpen(true)}
                      data-testid="button-withdraw"
                    >
                      WITHDRAW
                    </Button>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ₱{parseFloat((user as any)?.tipsBalance || "0").toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Tips Balance</div>
                    <div className="text-xs text-gray-500 mb-2">Tips received from supporters</div>
                    <Dialog open={isClaimTipsModalOpen} onOpenChange={setIsClaimTipsModalOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="w-full bg-yellow-600 hover:bg-yellow-700"
                          disabled={parseFloat((user as any)?.tipsBalance || '0') <= 0}
                          data-testid="button-claim-tips"
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          CLAIM
                        </Button>
                      </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Claim Your Tips</DialogTitle>
                            <p className="text-sm text-muted-foreground">
                              Specify the amount of tips you want to claim
                            </p>
                          </DialogHeader>
                          <Form {...claimTipForm}>
                            <form onSubmit={claimTipForm.handleSubmit(onClaimTip)} className="space-y-4">
                              <FormField
                                control={claimTipForm.control}
                                name="amount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Amount to Claim (₱)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="Enter tip amount to claim"
                                        type="number"
                                        min="1"
                                        {...field}
                                        data-testid="input-claim-tip-amount"
                                      />
                                    </FormControl>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Available to claim: ₱{parseFloat((user as any)?.tipsBalance || '0').toLocaleString()}<br/>
                                      Tips will be transferred to your PHP wallet
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex gap-2 pt-4">
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  className="flex-1"
                                  onClick={() => setIsClaimTipsModalOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit"
                                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                                  disabled={claimTipsMutation.isPending}
                                  data-testid="button-confirm-claim-tips"
                                >
                                  {claimTipsMutation.isPending ? "Claiming..." : "Claim Tips"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                    </Dialog>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      ₱{parseFloat((user as any)?.contributionsBalance || "0").toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Contributions Balance</div>
                    <div className="text-xs text-gray-500 mb-2">Money from contributions you can get back</div>
                    <Dialog open={isClaimContributionsModalOpen} onOpenChange={setIsClaimContributionsModalOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          disabled={parseFloat((user as any)?.contributionsBalance || '0') <= 0}
                          data-testid="button-claim-contributions"
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          CLAIM
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Claim Your Contributions</DialogTitle>
                          <p className="text-sm text-muted-foreground">
                            Transfer your contribution balance to your PHP wallet
                          </p>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-purple-900">Available Balance:</span>
                              <span className="text-lg font-bold text-purple-600">
                                ₱{parseFloat((user as any)?.contributionsBalance || '0').toLocaleString()}
                              </span>
                            </div>
                            <div className="text-xs text-purple-700">
                              • 1% claiming fee will be deducted (minimum ₱1)<br/>
                              • Net amount will be transferred to your PHP wallet
                            </div>
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button 
                              type="button"
                              variant="outline" 
                              className="flex-1"
                              onClick={() => setIsClaimContributionsModalOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={onClaimContribution}
                              className="flex-1 bg-purple-600 hover:bg-purple-700"
                              disabled={claimContributionsMutation.isPending || parseFloat((user as any)?.contributionsBalance || '0') <= 0}
                              data-testid="button-confirm-claim-contributions"
                            >
                              {claimContributionsMutation.isPending ? "Claiming..." : "Claim All"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
                  Click on any transaction to view detailed information
                </p>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto space-y-3">
                  {userTransactions && (userTransactions as any[]).length > 0 ? (
                    (userTransactions as any[]).map((transaction: any) => {
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
                          'transfer': 'Transfer'
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
                              selectedTransaction.type === 'withdrawal' ? 'bg-blue-100' :
                              selectedTransaction.type === 'contribution' ? 'bg-purple-100' :
                              'bg-gray-100'
                            }`}>
                              {selectedTransaction.type === 'deposit' && <TrendingUp className="w-6 h-6 text-green-600" />}
                              {selectedTransaction.type === 'withdrawal' && <TrendingDown className="w-6 h-6 text-blue-600" />}
                              {selectedTransaction.type === 'contribution' && <Heart className="w-6 h-6 text-purple-600" />}
                              {!['deposit', 'withdrawal', 'contribution'].includes(selectedTransaction.type) && <Box className="w-6 h-6 text-gray-600" />}
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold capitalize">
                                {selectedTransaction.type.replace('_', ' ')}
                              </h3>
                              <p className="text-muted-foreground">
                                {selectedTransaction.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              ₱{parseFloat(selectedTransaction.amount || '0').toLocaleString()}
                            </div>
                            <Badge 
                              variant={
                                selectedTransaction.status === 'completed' ? 'default' : 
                                selectedTransaction.status === 'failed' ? 'destructive' : 
                                'secondary'
                              }
                              className="mt-2"
                            >
                              {selectedTransaction.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Transaction Details Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-lg border-b pb-2">Transaction Information</h4>
                            
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground font-medium">Transaction ID:</span>
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                  {selectedTransaction.id}
                                </span>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground font-medium">Type:</span>
                                <span className="capitalize font-medium">{selectedTransaction.type.replace('_', ' ')}</span>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground font-medium">Amount:</span>
                                <span className="font-semibold">₱{parseFloat(selectedTransaction.amount || '0').toLocaleString()}</span>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground font-medium">Currency:</span>
                                <span className="font-medium">{selectedTransaction.currency || 'PHP'}</span>
                              </div>
                              
                              {selectedTransaction.feeAmount && parseFloat(selectedTransaction.feeAmount) > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground font-medium">Fees:</span>
                                  <span className="font-medium">₱{parseFloat(selectedTransaction.feeAmount).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="font-semibold text-lg border-b pb-2">Technical Details</h4>
                            
                            <div className="space-y-3">
                              {selectedTransaction.transactionHash && (
                                <div>
                                  <span className="text-muted-foreground font-medium block mb-1">Transaction Hash:</span>
                                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                                    {selectedTransaction.transactionHash}
                                  </span>
                                </div>
                              )}
                              
                              {selectedTransaction.blockNumber && (
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground font-medium">Block Number:</span>
                                  <span className="font-mono">{selectedTransaction.blockNumber}</span>
                                </div>
                              )}
                              
                              {selectedTransaction.paymentProvider && (
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground font-medium">Payment Method:</span>
                                  <span className="capitalize font-medium">{selectedTransaction.paymentProvider}</span>
                                </div>
                              )}
                              
                              {selectedTransaction.exchangeRate && (
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground font-medium">Exchange Rate:</span>
                                  <span className="font-medium">₱{parseFloat(selectedTransaction.exchangeRate).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg border-b pb-2">Timeline</h4>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-600" />
                                <span className="font-medium">Created</span>
                              </div>
                              <span className="text-sm">
                                {format(new Date(selectedTransaction.createdAt), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                            </div>
                            
                            {selectedTransaction.updatedAt && selectedTransaction.updatedAt !== selectedTransaction.createdAt && (
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="font-medium">Last Updated</span>
                                </div>
                                <span className="text-sm">
                                  {format(new Date(selectedTransaction.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                                </span>
                              </div>
                            )}
                            
                            {/* Status indicator */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                {selectedTransaction.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                                {selectedTransaction.status === 'pending' && <Clock className="w-4 h-4 text-yellow-600" />}
                                {selectedTransaction.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-600" />}
                                <span className="font-medium">Status</span>
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
                          </div>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal 
        isOpen={isWithdrawalModalOpen} 
        onClose={() => setIsWithdrawalModalOpen(false)} 
      />
    </div>
  );
}