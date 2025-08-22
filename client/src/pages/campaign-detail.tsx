import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Shield, 
  Users, 
  Calendar, 
  MapPin, 
  Box, 
  Heart, 
  Share2, 
  Flag,
  TrendingUp,
  Clock,
  DollarSign
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContributionSchema, insertTipSchema } from "@shared/schema";
import { z } from "zod";
import type { Campaign, Contribution, Transaction, Tip } from "@shared/schema";

const contributionFormSchema = insertContributionSchema.extend({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && num <= 999999;
    },
    "Amount must be a positive number (max 999,999)"
  ),
}).omit({ campaignId: true, contributorId: true });

const tipFormSchema = insertTipSchema.extend({
  amount: z.string().min(1, "Tip amount is required").refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && num <= 999999;
    },
    "Tip amount must be a positive number (max 999,999)"
  ),
}).omit({ campaignId: true, tipperId: true, creatorId: true });

const categoryColors = {
  emergency: "bg-red-100 text-red-800",
  education: "bg-blue-100 text-blue-800", 
  healthcare: "bg-green-100 text-green-800",
  community: "bg-purple-100 text-purple-800",
  environment: "bg-green-100 text-green-800",
};

const categoryImages = {
  emergency: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  education: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  healthcare: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  community: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  environment: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
};

export default function CampaignDetail() {
  const [match, params] = useRoute("/campaigns/:id");
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const form = useForm<z.infer<typeof contributionFormSchema>>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      amount: "",
      message: "",
      isAnonymous: false,
    },
  });

  if (!match || !params?.id) {
    return <div>Campaign not found</div>;
  }

  const campaignId = params.id;

  // Fetch campaign details
  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ["/api/campaigns", campaignId],
    queryFn: () => fetch(`/api/campaigns/${campaignId}`).then(res => res.json()),
  });

  // Fetch campaign contributions
  const { data: contributions } = useQuery({
    queryKey: ["/api/campaigns", campaignId, "contributions"],
    queryFn: () => fetch(`/api/campaigns/${campaignId}/contributions`).then(res => res.json()),
  });

  // Fetch campaign transactions
  const { data: transactions } = useQuery({
    queryKey: ["/api/campaigns", campaignId, "transactions"],
    queryFn: () => fetch(`/api/campaigns/${campaignId}/transactions`).then(res => res.json()),
  });

  const contributeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof contributionFormSchema>) => {
      console.log('💰 Making contribution API request:', data);
      console.log('📍 Campaign ID:', campaignId);
      console.log('👤 User:', user);
      return await apiRequest("POST", `/api/campaigns/${campaignId}/contribute`, data);
    },
    onSuccess: (response) => {
      console.log('✅ Contribution successful:', response);
      toast({
        title: "Contribution Successful! 🎉",
        description: `Thank you for contributing ${parseFloat(form.getValues().amount).toLocaleString()} PUSO to this campaign!`,
      });
      setIsContributeModalOpen(false);
      form.reset();
      
      // Refresh all campaign-related data
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "contributions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "transactions"] });
      
      // Also refresh user data to update balance
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      console.error('❌ Contribution failed:', error);
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
      // Handle specific error messages from the backend
      let errorMessage = "Something went wrong. Please try again.";
      try {
        const errorData = JSON.parse(error.message.split(': ')[1] || '{}');
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.log('Error parsing error message:', e);
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Contribution Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const tipForm = useForm<z.infer<typeof tipFormSchema>>({
    resolver: zodResolver(tipFormSchema),
    defaultValues: {
      amount: "",
      message: "",
      isAnonymous: false,
    },
  });

  const tipMutation = useMutation({
    mutationFn: async (data: z.infer<typeof tipFormSchema>) => {
      const tipAmount = parseFloat(data.amount);
      const currentBalance = parseFloat((user as any)?.pusoBalance || '0');
      
      if (currentBalance < tipAmount) {
        throw new Error('Insufficient PUSO balance');
      }
      
      return await apiRequest("POST", `/api/campaigns/${campaignId}/tip`, data);
    },
    onSuccess: (data: any) => {
      console.log('✅ Tip sent successfully:', data);
      toast({
        title: "Tip Sent Successfully!",
        description: `You sent ${tipForm.getValues('amount')} PUSO as a tip to the creator.`,
      });
      setIsTipModalOpen(false);
      tipForm.reset();
      
      // Refresh user data to show updated balance
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      console.error('❌ Error sending tip:', error);
      let errorMessage = 'Failed to send tip. Please try again.';
      
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
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Tip Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onTipSubmit = async (data: z.infer<typeof tipFormSchema>) => {
    console.log('🎯 Tip form submitted:', data);
    tipMutation.mutate(data);
  };

  const claimMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/campaigns/${campaignId}/claim`, {});
    },
    onSuccess: (data: any) => {
      console.log('✅ Claim successful:', data);
      const claimedAmount = data?.claimedAmount || data?.amount || parseFloat(campaign?.currentAmount || '0');
      toast({
        title: "Funds Claimed Successfully! 🎉",
        description: `${claimedAmount.toLocaleString()} PUSO has been transferred to your wallet.`,
      });
      setIsClaimModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/user"] });
    },
    onError: (error) => {
      console.error('❌ Claim failed:', error);
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
      
      // Handle specific error messages
      let errorMessage = "Failed to claim funds. Please try again.";
      try {
        if (error && typeof error === 'object' && 'message' in error) {
          const errorData = JSON.parse((error as any).message.split(': ')[1] || '{}');
          errorMessage = errorData.message || errorMessage;
        }
      } catch (e) {
        errorMessage = (error as any)?.message || errorMessage;
      }
      
      toast({
        title: "Claim Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof contributionFormSchema>) => {
    console.log('🚀 Form submitted with data:', data);
    console.log('🔍 Form validation state:', form.formState);
    console.log('🔍 Form errors:', form.formState.errors);
    
    // Simple validation
    const amount = parseFloat(data.amount);
    console.log('💰 Parsed amount:', amount);
    
    if (!amount || amount <= 0) {
      console.log('❌ Invalid amount');
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid contribution amount.",
        variant: "destructive",
      });
      return;
    }
    
    // Check user balance
    const userBalance = parseFloat((user as any)?.pusoBalance || '0');
    console.log('💳 User balance:', userBalance, 'Required:', amount);
    
    if (userBalance < amount) {
      console.log('❌ Insufficient balance');
      toast({
        title: "Insufficient Balance",
        description: `You need ${amount.toLocaleString()} PUSO but only have ${userBalance.toLocaleString()} PUSO available.`,
        variant: "destructive",
      });
      return;
    }
    
    console.log('✅ All validations passed, submitting...');
    contributeMutation.mutate(data);
  };

  if (campaignLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading campaign...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Campaign Not Found</h1>
            <p className="text-muted-foreground">The campaign you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentAmount = parseFloat(campaign.currentAmount || '0');
  const goalAmount = parseFloat(campaign.goalAmount || '0');
  const progress = (currentAmount / goalAmount) * 100;
  const daysLeft = campaign.endDate ? 
    Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

  const imageUrl = campaign.images ? 
    (campaign.images.startsWith('[') ? JSON.parse(campaign.images)[0] : campaign.images) : 
    categoryImages[campaign.category as keyof typeof categoryImages];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <img 
            src={imageUrl} 
            alt={campaign.title}
            className="w-full h-64 md:h-80 object-cover"
            data-testid="campaign-image"
          />
          
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <Badge 
                    className={`text-sm px-3 py-1 ${categoryColors[campaign.category as keyof typeof categoryColors]}`}
                    data-testid="campaign-category"
                  >
                    {campaign.category.charAt(0).toUpperCase() + campaign.category.slice(1)}
                  </Badge>
                  {campaign.tesVerified && (
                    <div className="flex items-center text-secondary">
                      <Shield className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">TES Verified</span>
                    </div>
                  )}
                  <Badge 
                    variant={campaign.status === "active" ? "default" : "secondary"}
                    data-testid="campaign-status"
                  >
                    {campaign.status}
                  </Badge>
                </div>
                
                <h1 className="text-3xl font-bold mb-4" data-testid="campaign-title">
                  {campaign.title}
                </h1>
                
                <p className="text-lg text-muted-foreground mb-6" data-testid="campaign-description">
                  {campaign.description}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 ml-6">
                <Button variant="outline" size="sm" data-testid="button-share">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" data-testid="button-report">
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </Button>
              </div>
            </div>

            {/* Progress Section */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <div className="text-3xl font-bold text-secondary" data-testid="current-amount">
                        ₱{currentAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        raised of ₱{goalAmount.toLocaleString()} goal
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold" data-testid="progress-percentage">
                        {progress.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">funded</div>
                    </div>
                  </div>
                  <Progress value={progress} className="h-3 mb-4" data-testid="progress-bar" />
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold" data-testid="contributors-count">
                        {contributions?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Contributors</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold" data-testid="days-left">
                        {daysLeft}
                      </div>
                      <div className="text-sm text-muted-foreground">Days Left</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold" data-testid="transactions-count">
                        {transactions?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Transactions</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                {/* Claim Button - Only for campaign creators */}
                {isAuthenticated && (user as any)?.id === campaign.creatorId && campaign.status === "active" && parseFloat(campaign.currentAmount || '0') >= 50 && (
                  <Dialog open={isClaimModalOpen} onOpenChange={setIsClaimModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="lg" 
                        className="w-full mb-4 bg-green-600 hover:bg-green-700"
                        data-testid="button-claim-funds"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Claim ₱{parseFloat(campaign.currentAmount || '0').toLocaleString()} PUSO
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          Claim Campaign Funds
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-700 mb-2">
                              ₱{parseFloat(campaign.currentAmount || '0').toLocaleString()}
                            </div>
                            <div className="text-sm text-green-600">
                              Available to claim as PUSO tokens
                            </div>
                          </div>
                        </div>
                        
                        {(user as any)?.kycStatus !== "verified" && (
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <div className="text-yellow-800 text-sm">
                              <strong>KYC Required:</strong> Complete your identity verification to claim funds.
                            </div>
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-600">
                          <p>When you claim these funds:</p>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Funds will be converted to PUSO tokens</li>
                            <li>PUSO tokens will be added to your wallet balance</li>
                            <li>Campaign amount will reset to ₱0</li>
                            <li>Campaign status will change to "claimed"</li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setIsClaimModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            console.log('🚀 Claiming funds...');
                            claimMutation.mutate();
                          }}
                          disabled={claimMutation.isPending || !['verified', 'approved'].includes((user as any)?.kycStatus || '')}
                          data-testid="button-confirm-claim"
                        >
                          {claimMutation.isPending ? "Claiming..." : "Claim Funds"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                
                {isAuthenticated && (user as any)?.id !== campaign.creatorId && campaign.status === "active" ? (
                  <>
                    <Dialog open={isContributeModalOpen} onOpenChange={setIsContributeModalOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="lg" 
                          className="w-full mb-2"
                          disabled={campaign.status !== "active"}
                          data-testid="button-contribute-main"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          Contribute Now
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Make a Contribution</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount (PUSO)</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="100"
                                    type="number"
                                    min="1"
                                    {...field}
                                    data-testid="input-contribution-amount"
                                  />
                                </FormControl>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Available balance: {((user as any)?.pusoBalance || 0).toLocaleString()} PUSO
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Message (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Leave a message of support..."
                                    {...field}
                                    value={field.value || ''}
                                    data-testid="textarea-contribution-message"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="isAnonymous"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value || false}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-anonymous"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Contribute anonymously
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex space-x-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsContributeModalOpen(false)}
                              className="flex-1"
                              data-testid="button-cancel-contribution"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="flex-1"
                              disabled={contributeMutation.isPending}
                              data-testid="button-submit-contribution"
                            >
                              {contributeMutation.isPending ? "Processing..." : "Contribute"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isTipModalOpen} onOpenChange={setIsTipModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="w-full mb-4 border-yellow-200 hover:bg-yellow-50"
                        disabled={campaign.status !== "active"}
                        data-testid="button-tip-creator"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Tip Creator
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Send a Tip</DialogTitle>
                      </DialogHeader>
                      <Form {...tipForm}>
                        <form onSubmit={tipForm.handleSubmit(onTipSubmit)} className="space-y-4">
                          <FormField
                            control={tipForm.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tip Amount (PUSO)</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="50"
                                    type="number"
                                    min="1"
                                    {...field}
                                    data-testid="input-tip-amount"
                                  />
                                </FormControl>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Available balance: {((user as any)?.pusoBalance || 0).toLocaleString()} PUSO
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={tipForm.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Message (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Say something nice to the creator..."
                                    {...field}
                                    value={field.value || ''}
                                    data-testid="textarea-tip-message"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={tipForm.control}
                            name="isAnonymous"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value || false}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-tip-anonymous"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Send tip anonymously</FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex gap-2 pt-4">
                            <Button 
                              type="button"
                              variant="outline" 
                              className="flex-1"
                              onClick={() => setIsTipModalOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                              disabled={tipMutation.isPending}
                              data-testid="button-confirm-tip"
                            >
                              {tipMutation.isPending ? "Sending..." : "Send Tip"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  </>
                ) : !isAuthenticated ? (
                  <Button 
                    size="lg" 
                    className="w-full mb-4"
                    onClick={() => window.location.href = "/api/login"}
                    data-testid="button-login-to-contribute"
                  >
                    Login to Contribute
                  </Button>
                ) : campaign.status !== "active" ? (
                  <div className="w-full mb-4 p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      This campaign is {campaign.status}
                    </p>
                  </div>
                ) : null}
                
                <div className="text-center text-sm text-muted-foreground">
                  By contributing, you agree to our terms of service
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Blockchain Transparency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Box className="w-5 h-5" />
                  <span>Blockchain Transparency</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions && transactions.length > 0 ? (
                    transactions.slice(0, 5).map((transaction: Transaction) => (
                      <div 
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-blue-50 rounded-lg"
                        data-testid={`transaction-item-${transaction.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <Box className="w-4 h-4 text-primary" />
                          <div>
                            <div className="font-medium text-sm">{transaction.description}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {(transaction.transactionHash || '').slice(0, 16)}...
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-secondary">
                            ₱{parseFloat(transaction.amount || '0').toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt!).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No transactions yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Contributions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5" />
                  <span>Recent Contributions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contributions && contributions.length > 0 ? (
                    contributions.slice(0, 10).map((contribution: Contribution) => (
                      <div 
                        key={contribution.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`contribution-item-${contribution.id}`}
                      >
                        <div>
                          <div className="font-medium">
                            {contribution.isAnonymous ? "Anonymous" : "Contributor"}
                          </div>
                          {contribution.message && (
                            <div className="text-sm text-muted-foreground mt-1">
                              "{contribution.message}"
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(contribution.createdAt!).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-lg font-semibold text-secondary">
                          ₱{parseFloat(contribution.amount).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No contributions yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Campaign Info */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Created</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(campaign.createdAt!).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Duration</div>
                    <div className="text-sm text-muted-foreground">
                      {campaign.duration} days
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Goal</div>
                    <div className="text-sm text-muted-foreground">
                      ₱{goalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fee Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Platform Fee:</span>
                  <span className="font-medium">3.8%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Conversion Fee:</span>
                  <span className="font-medium">1.0%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Withdrawal Fee:</span>
                  <span className="font-medium">₱20</span>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  Fees support platform security and blockchain verification
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
