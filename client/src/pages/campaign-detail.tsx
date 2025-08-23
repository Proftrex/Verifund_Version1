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
import CampaignReactions from "@/components/CampaignReactions";
import CampaignComments from "@/components/CampaignComments";
import ProgressReport from "@/components/ProgressReport";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  TrendingDown,
  Clock,
  HandCoins,
  UserPlus,
  Gift,
  Eye,
  Mail,
  MessageCircle,
  CheckCircle2,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Star,
  Briefcase,
  GraduationCap,
  Phone,
  Building,
  Linkedin,
  Wallet,
  Info,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import UserVerifiedBadge from "@/components/UserVerifiedBadge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContributionSchema, insertTipSchema, volunteerApplicationFormSchema, insertFraudReportSchema } from "@shared/schema";
import { z } from "zod";
import type { Campaign, Contribution, Transaction, Tip } from "@shared/schema";
import CampaignManagement from "@/components/CampaignManagement";

const fraudReportSchema = z.object({
  reportType: z.string().min(1, "Report type is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    // Callback will be handled by the component
  });
};

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

const claimContributionFormSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && num <= 999999;
    },
    "Amount must be a positive number (max 999,999)"
  ),
});

const claimTipFormSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && num <= 999999;
    },
    "Amount must be a positive number (max 999,999)"
  ),
});

const volunteerFormSchema = volunteerApplicationFormSchema;

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
  
  if (!match || !params?.id) {
    return <div>Campaign not found</div>;
  }

  const campaignId = params.id;
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isClaimContributionModalOpen, setIsClaimContributionModalOpen] = useState(false);
  const [isClaimTipModalOpen, setIsClaimTipModalOpen] = useState(false);
  const [isVolunteerDetailsModalOpen, setIsVolunteerDetailsModalOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [selectedContribution, setSelectedContribution] = useState<any>(null);
  const [selectedTip, setSelectedTip] = useState<any>(null);
  const [showCreatorProfile, setShowCreatorProfile] = useState(false);
  const [showFraudReportModal, setShowFraudReportModal] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);

  const form = useForm<z.infer<typeof contributionFormSchema>>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      amount: "",
      message: "",
      isAnonymous: false,
    },
  });

  const claimContributionForm = useForm<z.infer<typeof claimContributionFormSchema>>({
    resolver: zodResolver(claimContributionFormSchema),
    defaultValues: {
      amount: "",
    },
  });

  const claimTipForm = useForm<z.infer<typeof claimTipFormSchema>>({
    resolver: zodResolver(claimTipFormSchema),
    defaultValues: {
      amount: "",
    },
  });

  const fraudReportForm = useForm<z.infer<typeof fraudReportSchema>>({
    resolver: zodResolver(fraudReportSchema),
    defaultValues: {
      reportType: '',
      description: '',
    },
  });

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

  // Fetch campaign tips
  const { data: tips } = useQuery({
    queryKey: ["/api/campaigns", campaignId, "tips"],
    queryFn: () => fetch(`/api/campaigns/${campaignId}/tips`).then(res => res.json()),
  });

  // Fetch volunteer applications (only for campaign creators)
  const { data: volunteerApplications } = useQuery({
    queryKey: ["/api/campaigns", campaignId, "volunteer-applications"],
    queryFn: () => fetch(`/api/campaigns/${campaignId}/volunteer-applications`).then(res => res.json()),
    enabled: isAuthenticated && (user as any)?.id === campaign?.creatorId,
  });

  // Check if current user has applied to volunteer
  const { data: userVolunteerApplication } = useQuery({
    queryKey: ["/api/campaigns", campaignId, "user-volunteer-application"],
    queryFn: () => fetch(`/api/campaigns/${campaignId}/user-volunteer-application`).then(res => res.json()),
    enabled: isAuthenticated && (user as any)?.id !== campaign?.creatorId,
  });

  const hasAppliedToVolunteer = userVolunteerApplication?.hasApplied;

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
        description: `Thank you for contributing ${parseFloat(form.getValues().amount).toLocaleString()} PHP to this campaign!`,
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

  // View creator profile mutation
  const viewCreatorProfileMutation = useMutation({
    mutationFn: async () => {
      if (!campaign?.creatorId) throw new Error("Creator ID not found");
      const response = await fetch(`/api/creator/${campaign.creatorId}/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load creator profile: ${response.statusText}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Creator profile data:', data);
      setCreatorProfile(data);
      setShowCreatorProfile(true);
    },
    onError: (error: Error) => {
      console.error('❌ Creator profile error:', error);
      toast({
        title: "Error Loading Profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit fraud report mutation
  const submitFraudReportMutation = useMutation({
    mutationFn: async (data: z.infer<typeof fraudReportSchema>) => {
      console.log('🛡️ Submitting fraud report:', { ...data, campaignId });
      const response = await apiRequest("POST", '/api/fraud-reports/campaign', {
        ...data,
        campaignId,
      });
      const result = await response.json();
      console.log('✅ Fraud report response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Fraud report submitted successfully:', data);
      setShowFraudReportModal(false);
      fraudReportForm.reset();
      toast({
        title: "Report Submitted Successfully! 🛡️",
        description: "Thank you for helping keep the community safe. We'll review your report.",
      });
      // Refresh notifications to show the confirmation
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      console.error('❌ Fraud report submission failed:', error);
      
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
      
      let errorMessage = "Failed to submit report. Please try again.";
      try {
        // Handle different error formats
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object') {
          if ('message' in error && typeof (error as any).message === 'string') {
            const rawMessage = (error as any).message;
            // Try to parse JSON from error message
            if (rawMessage.includes('{')) {
              try {
                const jsonPart = rawMessage.substring(rawMessage.indexOf('{'));
                const errorData = JSON.parse(jsonPart);
                errorMessage = errorData.message || rawMessage;
              } catch {
                errorMessage = rawMessage;
              }
            } else {
              errorMessage = rawMessage;
            }
          }
        }
      } catch (e) {
        console.log('Error parsing error message:', e);
      }
      
      toast({
        title: "Error Submitting Report",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const volunteerForm = useForm<z.infer<typeof volunteerFormSchema>>({
    resolver: zodResolver(volunteerFormSchema),
    mode: "onChange",
    defaultValues: {
      intent: "",
      telegramDisplayName: "",
      telegramUsername: "",
    },
  });

  const tipMutation = useMutation({
    mutationFn: async (data: z.infer<typeof tipFormSchema>) => {
      const tipAmount = parseFloat(data.amount);
      const currentBalance = parseFloat((user as any)?.phpBalance || '0');
      
      if (currentBalance < tipAmount) {
        throw new Error('Insufficient PHP balance');
      }
      
      return await apiRequest("POST", `/api/campaigns/${campaignId}/tip`, data);
    },
    onSuccess: (data: any) => {
      console.log('✅ Tip sent successfully:', data);
      const tipAmount = parseFloat(tipForm.getValues('amount'));
      toast({
        title: "Tip Sent Successfully!",
        description: `₱${tipAmount.toLocaleString()} has been sent as a tip to the creator.`,
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

  const volunteerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof volunteerFormSchema>) => {
      return await apiRequest("POST", `/api/campaigns/${campaignId}/volunteer`, data);
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted! 📝",
        description: "Your volunteer application has been submitted successfully! The campaign creator will review your application.",
      });
      setIsVolunteerModalOpen(false);
      volunteerForm.reset();
      // Invalidate the volunteer application status cache to update button state
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "user-volunteer-application"] });
    },
    onError: (error) => {
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
        title: "Application Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onTipSubmit = async (data: z.infer<typeof tipFormSchema>) => {
    console.log('🎯 Tip form submitted:', data);
    tipMutation.mutate(data);
  };

  const onVolunteerSubmit = async (data: z.infer<typeof volunteerFormSchema>) => {
    // Explicit validation for Telegram fields
    if (!data.telegramDisplayName?.trim()) {
      volunteerForm.setError("telegramDisplayName", { 
        message: "Telegram Display Name is required for volunteer coordination" 
      });
      toast({
        title: "Missing Telegram Information",
        description: "Please provide your Telegram Display Name for coordination.",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.telegramUsername?.trim()) {
      volunteerForm.setError("telegramUsername", { 
        message: "Telegram Username is required for secure communication" 
      });
      toast({
        title: "Missing Telegram Information", 
        description: "Please provide your Telegram Username for secure communication.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('🙋 Volunteer application submitted:', data);
    volunteerMutation.mutate(data);
  };

  const handleVolunteerClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to volunteer for this campaign.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }

    // Check if user is verified
    if ((user as any)?.kycStatus !== "verified") {
      toast({
        title: "Verification Required",
        description: "Only verified users can volunteer. Please complete your KYC verification first.",
        variant: "destructive",
      });
      return;
    }

    setIsVolunteerModalOpen(true);
  };

  const claimMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/campaigns/${campaignId}/claim`, {});
    },
    onSuccess: (data: any) => {
      console.log('✅ Contributions claimed successfully:', data);
      const claimedAmount = data?.claimedAmount || data?.amount || parseFloat(campaign?.currentAmount || '0');
      toast({
        title: "Contributions Claimed Successfully! 🎉",
        description: `₱${claimedAmount.toLocaleString()} has been transferred to your PHP wallet.`,
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
      let errorMessage = "Failed to claim contributions. Please try again.";
      try {
        if (error && typeof error === 'object' && 'message' in error) {
          const errorData = JSON.parse((error as any).message.split(': ')[1] || '{}');
          errorMessage = errorData.message || errorMessage;
        }
      } catch (e) {
        errorMessage = (error as any)?.message || errorMessage;
      }
      
      toast({
        title: "Contributions Claim Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Claim specific amount of contributions
  const claimContributionMutation = useMutation({
    mutationFn: async (amount: string) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/claim`, { amount });
      const data = await response.json();
      console.log('📡 Claim API response:', data);
      return data;
    },
    onSuccess: (data: any) => {
      console.log('✅ Contributions claimed successfully:', data);
      console.log('📊 Claimed amount raw:', data.claimedAmount, 'type:', typeof data.claimedAmount);
      
      // Handle both string and number formats
      const claimedAmount = typeof data.claimedAmount === 'string' 
        ? parseFloat(data.claimedAmount) 
        : data.claimedAmount || 0;
      
      console.log('📊 Parsed claimed amount:', claimedAmount);
      
      toast({
        title: "Contributions Claimed Successfully! 🎉",
        description: `₱${claimedAmount.toLocaleString()} has been transferred to your PHP wallet.`,
      });
      setIsClaimContributionModalOpen(false);
      claimContributionForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/user"] });
    },
    onError: (error) => {
      console.error('❌ Claim contributions failed:', error);
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
      
      let errorMessage = "Failed to claim contributions. Please try again.";
      try {
        // Handle different error formats
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object') {
          if ('message' in error && typeof (error as any).message === 'string') {
            const rawMessage = (error as any).message;
            // Try to parse JSON from error message
            if (rawMessage.includes('{')) {
              try {
                const jsonPart = rawMessage.substring(rawMessage.indexOf('{'));
                const errorData = JSON.parse(jsonPart);
                errorMessage = errorData.message || rawMessage;
              } catch {
                errorMessage = rawMessage;
              }
            } else {
              errorMessage = rawMessage;
            }
          }
        }
      } catch (e) {
        console.log('Error parsing error message:', e);
      }
      
      toast({
        title: "Contributions Claim Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Claim specific amount of tips for this campaign
  const claimTipMutation = useMutation({
    mutationFn: async (amount: string) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/claim-tips`, { amount });
      const data = await response.json();
      console.log('📡 Tip claim API response:', data);
      return data;
    },
    onSuccess: (data: any) => {
      console.log('✅ Tips claimed successfully:', data);
      console.log('📊 Tip amount raw:', data.claimedAmount, 'type:', typeof data.claimedAmount);
      
      // Handle both string and number formats
      const claimedAmount = typeof data.claimedAmount === 'string' 
        ? parseFloat(data.claimedAmount) 
        : data.claimedAmount || 0;
        
      console.log('📊 Parsed tip amount:', claimedAmount);
      
      toast({
        title: "Tips Claimed Successfully! 🎁",
        description: `₱${claimedAmount.toLocaleString()} has been transferred to your tip wallet.`,
      });
      setIsClaimTipModalOpen(false);
      claimTipForm.reset();
      // Invalidate all relevant queries to refresh the UI  
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "tips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/user"] });
      
      // Force immediate refresh of all data 
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/campaigns", campaignId, "tips"] });
        queryClient.refetchQueries({ queryKey: ["/api/campaigns", campaignId] });
      }, 100);
    },
    onError: (error) => {
      console.error('❌ Claim tips failed:', error);
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
      
      let errorMessage = "Failed to claim tips. Please try again.";
      try {
        // Handle different error formats
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object') {
          if ('message' in error && typeof (error as any).message === 'string') {
            const rawMessage = (error as any).message;
            // Try to parse JSON from error message
            if (rawMessage.includes('{')) {
              try {
                const jsonPart = rawMessage.substring(rawMessage.indexOf('{'));
                const errorData = JSON.parse(jsonPart);
                errorMessage = errorData.message || rawMessage;
              } catch {
                errorMessage = rawMessage;
              }
            } else {
              errorMessage = rawMessage;
            }
          }
        }
      } catch (e) {
        console.log('Error parsing error message:', e);
      }
      
      toast({
        title: "Tips Claim Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Volunteer management mutations
  const approveVolunteerMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      return await apiRequest("POST", `/api/campaigns/${campaignId}/volunteer-applications/${applicationId}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "Volunteer Approved! ✅",
        description: "The volunteer application has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "volunteer-applications"] });
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: "Failed to approve volunteer application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectVolunteerMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      return await apiRequest("POST", `/api/campaigns/${campaignId}/volunteer-applications/${applicationId}/reject`, {});
    },
    onSuccess: () => {
      toast({
        title: "Volunteer Rejected",
        description: "The volunteer application has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "volunteer-applications"] });
    },
    onError: (error) => {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject volunteer application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const openVolunteerDetails = (volunteer: any) => {
    setSelectedVolunteer(volunteer);
    setIsVolunteerDetailsModalOpen(true);
  };

  const onClaimContribution = (data: z.infer<typeof claimContributionFormSchema>) => {
    const amount = parseFloat(data.amount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to claim.",
        variant: "destructive",
      });
      return;
    }

    const availableAmount = parseFloat(campaign?.currentAmount || '0') - parseFloat(campaign?.claimedAmount || '0');
    if (amount > availableAmount) {
      toast({
        title: "Insufficient Funds",
        description: `Only ₱${availableAmount.toLocaleString()} is available to claim.`,
        variant: "destructive",
      });
      return;
    }

    claimContributionMutation.mutate(data.amount);
  };

  const onClaimTip = (data: z.infer<typeof claimTipFormSchema>) => {
    const amount = parseFloat(data.amount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to claim.",
        variant: "destructive",
      });
      return;
    }

    // Note: We could add validation against available tip amount here
    claimTipMutation.mutate(data.amount);
  };

  const handleViewCreatorProfile = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view creator profiles",
        variant: "destructive",
      });
      return;
    }
    viewCreatorProfileMutation.mutate();
  };


  const onSubmitFraudReport = (data: z.infer<typeof fraudReportSchema>) => {
    submitFraudReportMutation.mutate(data);
  };

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
    const userBalance = parseFloat((user as any)?.phpBalance || '0');
    console.log('💳 User balance:', userBalance, 'Required:', amount);
    
    if (userBalance < amount) {
      console.log('❌ Insufficient balance');
      toast({
        title: "Insufficient Balance",
        description: `You need ${amount.toLocaleString()} PHP but only have ${userBalance.toLocaleString()} PHP available.`,
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
  
  // Calculate total tips
  const totalTips = tips?.reduce((sum: number, tip: any) => sum + parseFloat(tip.amount || '0'), 0) || 0;
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
                    {campaign?.category ? campaign.category.charAt(0).toUpperCase() + campaign.category.slice(1) : 'Unknown'}
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
                
                {/* Creator Information */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                        <span className="font-semibold text-white text-sm">
                          {campaign.creatorName ? campaign.creatorName.charAt(0).toUpperCase() : 'C'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{campaign.creatorName || 'Unknown Creator'}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          Campaign Creator
                          {campaign.tesVerified && (
                            <div className="flex items-center ml-2 text-secondary">
                              <Shield className="w-3 h-3 mr-1" />
                              <span className="text-xs">Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      data-testid="button-view-creator"
                      onClick={handleViewCreatorProfile}
                    >
                      View Creator Profile
                    </Button>
                  </div>
                </div>
                
                <p className="text-lg text-muted-foreground mb-6" data-testid="campaign-description">
                  {campaign.description}
                </p>
              </div>
              
            </div>

            {/* Progress Section */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="mb-6 space-y-6">
                  {/* Total Goal Progress */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <div className="text-3xl font-bold text-secondary" data-testid="current-amount">
                          ₱{currentAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          raised of ₱{goalAmount.toLocaleString()} total goal
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold" data-testid="progress-percentage">
                          {progress.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">of total goal</div>
                      </div>
                    </div>
                    <Progress value={progress} className="h-3 mb-2" data-testid="progress-bar" />
                    <div className="text-center mb-4">
                      <div className="text-xs text-muted-foreground">
                        {progress.toFixed(1)}% of total goal reached
                      </div>
                      {campaign.minimumAmount && parseFloat(campaign.minimumAmount) > 0 && (
                        <div className="text-xs mt-1">
                          <span className={parseFloat(campaign.minimumAmount) <= currentAmount ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                            {parseFloat(campaign.minimumAmount) <= currentAmount 
                              ? `✅ Operational amount of ₱${parseFloat(campaign.minimumAmount).toLocaleString()} reached - campaign can start implementing!`
                              : `🎯 Needs ₱${parseFloat(campaign.minimumAmount).toLocaleString()} to become operational`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
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

                {/* Tip Pool Section */}
                <div className="mt-6">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <div className="text-2xl font-bold text-blue-600" data-testid="total-tips">
                        ₱{totalTips.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        total tips received
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-blue-600" data-testid="tips-count">
                        {tips?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">tips</div>
                    </div>
                  </div>
                  
                  {/* Single Tip Progress Bar */}
                  <div className="bg-blue-100 h-2 rounded-full mb-4">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: totalTips > 0 ? '100%' : '0%' }}
                    />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-2">
                      💝 Tips are separate from campaign goals and go directly to the creator
                    </div>
                    {tips && tips.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-blue-600 font-medium">
                          Total Tips: ₱{totalTips.toLocaleString()} from {tips.length} supporter{tips.length !== 1 ? 's' : ''}
                          {isAuthenticated && (user as any)?.id === campaign.creatorId && totalTips > 0 && (
                            <span className="text-blue-500"> • ₱{totalTips.toLocaleString()} available to claim</span>
                          )}
                          {isAuthenticated && (user as any)?.id === campaign.creatorId && totalTips === 0 && (
                            <span className="text-green-500"> • All tips claimed ✅</span>
                          )}
                        </div>
                      </div>
                    )}
                    {(!tips || tips.length === 0) && (
                      <div className="text-xs text-muted-foreground">
                        No tips yet. Be the first to support this creator! 
                      </div>
                    )}
                  </div>
                </div>

                {/* Volunteer Management Section - Only for campaign creators */}
                {isAuthenticated && (user as any)?.id === campaign.creatorId && campaign.needsVolunteers && (
                  <div className="mt-6">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <div className="text-2xl font-bold text-purple-600" data-testid="volunteer-applications-count">
                          {volunteerApplications?.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          volunteer applications
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-purple-600" data-testid="volunteer-slots">
                          {campaign.volunteerSlotsFilledCount || 0}/{campaign.volunteerSlots || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">slots filled</div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-100 h-2 rounded-full mb-4">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: campaign.volunteerSlots > 0 ? 
                            `${((campaign.volunteerSlotsFilledCount || 0) / campaign.volunteerSlots) * 100}%` : 
                            '0%' 
                        }}
                      />
                    </div>
                    
                    <div className="text-center mb-4">
                      <div className="text-xs text-muted-foreground">
                        👥 Review and approve volunteer applications below
                      </div>
                    </div>

                    {/* Volunteer Applications List */}
                    {volunteerApplications && volunteerApplications.length > 0 ? (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {volunteerApplications.map((application: any) => (
                          <div 
                            key={application.id} 
                            className="border rounded-lg p-4 bg-white"
                            data-testid={`volunteer-application-${application.id}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-semibold text-sm" data-testid={`volunteer-name-${application.id}`}>
                                  {application.volunteerName || 'Anonymous Volunteer'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Applied {new Date(application.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  application.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`} data-testid={`volunteer-status-${application.id}`}>
                                  {application.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-sm mb-2" data-testid={`volunteer-intent-${application.id}`}>
                              <strong>Why they want to help:</strong> {application.intent}
                            </div>
                            
                            {application.message && (
                              <div className="text-sm mb-3 text-muted-foreground" data-testid={`volunteer-message-${application.id}`}>
                                <strong>Message:</strong> {application.message}
                              </div>
                            )}
                            
                            <div className="flex gap-2 items-center justify-between">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openVolunteerDetails(application)}
                                data-testid={`button-view-volunteer-${application.id}`}
                                className="flex-1"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View Details
                              </Button>
                              
                              {application.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => approveVolunteerMutation.mutate(application.id)}
                                    disabled={approveVolunteerMutation.isPending}
                                    data-testid={`button-approve-volunteer-${application.id}`}
                                  >
                                    ✅ Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => rejectVolunteerMutation.mutate(application.id)}
                                    disabled={rejectVolunteerMutation.isPending}
                                    data-testid={`button-reject-volunteer-${application.id}`}
                                  >
                                    ❌ Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <div className="text-4xl mb-2">👥</div>
                        <div className="text-sm">No volunteer applications yet</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                {/* Unified Campaign Management */}
                <CampaignManagement
                  campaign={campaign}
                  variant="detail"
                  onClaimContribution={() => setIsClaimContributionModalOpen(true)}
                  onClaimTip={() => setIsClaimTipModalOpen(true)}
                  totalTips={totalTips}
                />


                {/* Event Details Section */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="space-y-4">
                    {/* Event Location */}
                    {(campaign.street || campaign.barangay || campaign.city || campaign.province) && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <h3 className="font-semibold text-gray-800 text-sm">Event Location</h3>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          {campaign.street && (
                            <div data-testid="campaign-street">
                              <strong>Street:</strong> {campaign.street}
                            </div>
                          )}
                          {campaign.barangay && (
                            <div data-testid="campaign-barangay">
                              <strong>Barangay:</strong> {campaign.barangay}
                            </div>
                          )}
                          {campaign.city && (
                            <div data-testid="campaign-city">
                              <strong>City:</strong> {campaign.city}
                            </div>
                          )}
                          {campaign.province && (
                            <div data-testid="campaign-province">
                              <strong>Province:</strong> {campaign.province}
                            </div>
                          )}
                          {campaign.zipcode && (
                            <div data-testid="campaign-zipcode">
                              <strong>Zipcode:</strong> {campaign.zipcode}
                            </div>
                          )}
                          {campaign.landmark && (
                            <div data-testid="campaign-landmark">
                              <strong>Landmark:</strong> {campaign.landmark}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Event Timeline */}
                    {(campaign.startDate || campaign.endDate) && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <h3 className="font-semibold text-gray-800 text-sm">Event Timeline</h3>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          {campaign.startDate && (
                            <div data-testid="campaign-start-date">
                              <strong>Start Date:</strong> {format(new Date(campaign.startDate), 'PPP')}
                            </div>
                          )}
                          {campaign.endDate && (
                            <div data-testid="campaign-end-date">
                              <strong>End Date:</strong> {format(new Date(campaign.endDate), 'PPP')}
                            </div>
                          )}
                          {campaign.duration && (
                            <div data-testid="campaign-duration">
                              <strong>Duration:</strong> {campaign.duration} days
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Volunteer Information */}
                    {campaign.needsVolunteers && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-purple-600" />
                          <h3 className="font-semibold text-gray-800 text-sm">Volunteer Opportunities</h3>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div data-testid="campaign-volunteer-slots">
                            <strong>Volunteer Slots:</strong> {campaign.volunteerSlotsFilledCount || 0}/{campaign.volunteerSlots || 0} filled
                          </div>
                          <div className="text-xs text-purple-600 font-medium">
                            {(campaign.volunteerSlots || 0) - (campaign.volunteerSlotsFilledCount || 0) > 0 
                              ? `${(campaign.volunteerSlots || 0) - (campaign.volunteerSlotsFilledCount || 0)} volunteer positions available`
                              : 'All volunteer positions filled'
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {isAuthenticated && (user as any)?.id === campaign.creatorId && campaign.status === "active" && parseFloat(campaign.currentAmount || '0') >= 50 && (
                  <Dialog open={isClaimModalOpen} onOpenChange={setIsClaimModalOpen}>
                    <DialogTrigger asChild>
                      <div style={{ display: 'none' }}>
                        <Button>Hidden Trigger</Button>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <HandCoins className="w-5 h-5 text-green-600" />
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
                              Available to claim as PHP tokens
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
                            <li>Funds will be converted to PHP tokens</li>
                            <li>PHP tokens will be added to your wallet balance</li>
                            <li>Campaign amount will reset to ₱0</li>
                            <li>Campaign status will change to "claimed"</li>
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setIsClaimModalOpen(false);
                              setIsClaimContributionModalOpen(true);
                            }}
                            disabled={!['verified', 'approved'].includes((user as any)?.kycStatus || '')}
                            data-testid="button-claim-contributions"
                          >
                            CLAIM CONTRIBUTION
                          </Button>
                          <Button 
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              setIsClaimModalOpen(false);
                              setIsClaimTipModalOpen(true);
                            }}
                            disabled={!['verified', 'approved'].includes((user as any)?.kycStatus || '') || totalTips === 0}
                            data-testid="button-claim-tips"
                          >
                            {totalTips === 0 ? 'ALL CLAIMED' : 'CLAIM TIP'}
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setIsClaimModalOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Claim Contribution Modal */}
                <Dialog open={isClaimContributionModalOpen} onOpenChange={setIsClaimContributionModalOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Claim Campaign Contributions</DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        Specify the amount you want to claim from this campaign
                      </p>
                    </DialogHeader>
                    <Form {...claimContributionForm}>
                      <form onSubmit={claimContributionForm.handleSubmit(onClaimContribution)} className="space-y-4">
                        <FormField
                          control={claimContributionForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount to Claim (₱)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter amount to claim"
                                  type="number"
                                  min="1"
                                  max={parseFloat(campaign?.currentAmount || '0') - parseFloat(campaign?.claimedAmount || '0')}
                                  {...field}
                                  data-testid="input-claim-contribution-amount"
                                />
                              </FormControl>
                              <div className="text-xs text-muted-foreground mt-1">
                                Available to claim: ₱{(parseFloat(campaign?.currentAmount || '0') - parseFloat(campaign?.claimedAmount || '0')).toLocaleString()}
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
                            onClick={() => setIsClaimContributionModalOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={claimContributionMutation.isPending}
                            data-testid="button-confirm-claim-contribution"
                          >
                            {claimContributionMutation.isPending ? "Claiming..." : "Claim Contribution"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                {/* Claim Tips Modal */}
                <Dialog open={isClaimTipModalOpen} onOpenChange={setIsClaimTipModalOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Claim Campaign Tips</DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        Specify the amount of tips you want to claim from this campaign
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
                                Available to claim: ₱{totalTips.toLocaleString()} from {tips?.length || 0} tips<br/>
                                Tips will be transferred to your tip wallet
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
                            onClick={() => setIsClaimTipModalOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            disabled={claimTipMutation.isPending}
                            data-testid="button-confirm-claim-tip"
                          >
                            {claimTipMutation.isPending ? "Claiming..." : "Claim Tips"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                
                {isAuthenticated && (user as any)?.id !== campaign.creatorId ? (
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
                                <FormLabel>Amount (PHP)</FormLabel>
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
                                  Available balance: {((user as any)?.phpBalance || 0).toLocaleString()} PHP
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
                  
                  {/* Volunteer Button */}
                  {campaign.needsVolunteers && (
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="w-full mb-2"
                      onClick={handleVolunteerClick}
                      disabled={campaign.status !== "active" || hasAppliedToVolunteer}
                      data-testid="button-volunteer-main"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {hasAppliedToVolunteer ? "Application Submitted" : "Volunteer for this Campaign"}
                    </Button>
                  )}
                  
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
                                <FormLabel>Tip Amount (PHP)</FormLabel>
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
                                  Available balance: {((user as any)?.phpBalance || 0).toLocaleString()} PHP
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

      </div>

      {/* Campaign Pool - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Progress Report Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  Progress Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressReport 
                  campaignId={campaignId} 
                  isCreator={isAuthenticated && (user as any)?.id === campaign?.creatorId}
                  campaignStatus={campaign?.status}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Community Insights Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Community Insights
                  </div>
                  {/* Rate Creator Button - Only show for non-creators */}
                  {isAuthenticated && (user as any)?.id !== campaign?.creatorId && (
                    <Button 
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      data-testid="button-rate-creator-main"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Rate Creator
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Reactions */}
                <div className="flex justify-center">
                  <CampaignReactions campaignId={campaignId} />
                </div>
                
                {/* Comments Section */}
                <div>
                  <CampaignComments campaignId={campaignId} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Transaction Panels - Bottom Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* First Panel - Blockchain Transparency */}
          <div>
            <Card className="h-[300px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Box className="w-5 h-5" />
                  <span>Blockchain Transparency</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full overflow-hidden">
                <div className="h-full overflow-y-auto space-y-4 pr-2">
                  {transactions && transactions.length > 0 ? (
                    transactions.map((transaction: Transaction) => {
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
                          className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-all hover:shadow-md"
                          data-testid={`transaction-item-${transaction.id}`}
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">Amount</span>
                              <span className="font-semibold text-base text-gray-900">
                                ₱{parseFloat(transaction.amount || '0').toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">Transaction ID</span>
                              <span className="text-sm font-mono text-gray-700">
                                {transaction.id.slice(0, 8)}...
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">Status</span>
                              <span className="text-sm font-medium text-green-600">
                                {transaction.status || 'Completed'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No transactions yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Panel - Recent Contributions */}
          <div>
            <Card className="h-[300px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5" />
                  <span>Recent Contributions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full overflow-hidden">
                <div className="h-full overflow-y-auto space-y-4 pr-2">
                  {contributions && contributions.length > 0 ? (
                    contributions.map((contribution: Contribution) => (
                      <div 
                        key={contribution.id}
                        className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-all hover:shadow-md"
                        data-testid={`contribution-item-${contribution.id}`}
                        onClick={() => setSelectedContribution(contribution)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Amount</span>
                            <span className="font-semibold text-base text-gray-900">
                              ₱{parseFloat(contribution.amount).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Transaction ID</span>
                            <span className="text-sm font-mono text-gray-700">
                              {contribution.id.slice(0, 8)}...
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Status</span>
                            <span className="text-sm font-medium text-green-600">
                              Completed
                            </span>
                          </div>
                        </div>
                        {contribution.message && (
                          <div className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                            "{contribution.message}"
                          </div>
                        )}
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

          {/* Third Panel - Recent Tips */}
          <div>
            <Card className="h-[300px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="w-5 h-5" />
                  <span>Recent Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full overflow-hidden">
                <div className="h-full overflow-y-auto space-y-4 pr-2">
                  {tips && tips.length > 0 ? (
                    tips.map((tip: any) => (
                      <div 
                        key={tip.id}
                        className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-all hover:shadow-md"
                        data-testid={`tip-item-${tip.id}`}
                        onClick={() => setSelectedTip(tip)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Amount</span>
                            <span className="font-semibold text-base text-gray-900">
                              ₱{parseFloat(tip.amount || '0').toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Transaction ID</span>
                            <span className="text-sm font-mono text-gray-700">
                              {tip.id.slice(0, 8)}...
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Status</span>
                            <span className="text-sm font-medium text-green-600">
                              Completed
                            </span>
                          </div>
                        </div>
                        {tip.message && (
                          <div className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                            "{tip.message}"
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No tips yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Volunteer Application Modal */}
      <Dialog open={isVolunteerModalOpen} onOpenChange={setIsVolunteerModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Volunteer Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">{campaign.title}</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {campaign.location}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  {campaign.volunteerSlots ? 
                    `${campaign.volunteerSlots - campaign.volunteerSlotsFilledCount} slots available of ${campaign.volunteerSlots}` :
                    "Open volunteer slots"
                  }
                </div>
              </div>
            </div>

            <Form {...volunteerForm}>
              <form onSubmit={volunteerForm.handleSubmit(onVolunteerSubmit)} className="space-y-4">
                <FormField
                  control={volunteerForm.control}
                  name="intent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Why do you want to volunteer for this campaign? *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please explain your motivation and why you want to be part of this campaign (minimum 20 characters)..."
                          rows={4}
                          {...field}
                          data-testid="textarea-volunteer-campaign-intent"
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        This helps the campaign creator understand your motivation and commitment.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Telegram Display Name Field */}
                <div className="space-y-2">
                  <label className="text-red-600 font-semibold text-sm">
                    Telegram Display Name *
                  </label>
                  <Input
                    placeholder="Your display name as it appears on Telegram"
                    value={volunteerForm.watch("telegramDisplayName") || ""}
                    onChange={(e) => volunteerForm.setValue("telegramDisplayName", e.target.value)}
                    className="border-red-200 focus:border-red-400"
                    data-testid="input-volunteer-telegram-display-name"
                  />
                  <p className="text-sm text-muted-foreground">
                    This will only be visible to the creator after approval for coordination purposes.
                  </p>
                  {volunteerForm.formState.errors.telegramDisplayName && (
                    <p className="text-red-500 text-sm">{volunteerForm.formState.errors.telegramDisplayName.message}</p>
                  )}
                </div>

                {/* Telegram Username Field */}
                <div className="space-y-2">
                  <label className="text-red-600 font-semibold text-sm">
                    Telegram Username *
                  </label>
                  <Input
                    placeholder="@username or username (without @)"
                    value={volunteerForm.watch("telegramUsername") || ""}
                    onChange={(e) => volunteerForm.setValue("telegramUsername", e.target.value)}
                    className="border-red-200 focus:border-red-400"
                    data-testid="input-volunteer-telegram-username"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your Telegram username for direct communication after approval.
                  </p>
                  {volunteerForm.formState.errors.telegramUsername && (
                    <p className="text-red-500 text-sm">{volunteerForm.formState.errors.telegramUsername.message}</p>
                  )}
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Privacy Notice:</strong> Your Telegram information will only be visible to the campaign creator after they approve your volunteer application. This ensures no unwanted contact before approval and enables proper coordination once accepted.
                  </AlertDescription>
                </Alert>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-3">
                    <UserVerifiedBadge size="lg" className="text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Verified Users Only</p>
                      <p className="text-blue-700 mt-1">
                        Only KYC-verified users can volunteer. Your application will be reviewed by the campaign creator.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsVolunteerModalOpen(false)}
                    className="flex-1"
                    data-testid="button-cancel-volunteer-campaign"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={volunteerMutation.isPending}
                    data-testid="button-submit-volunteer-campaign"
                  >
                    {volunteerMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Volunteer Details Modal */}
      <Dialog open={isVolunteerDetailsModalOpen} onOpenChange={setIsVolunteerDetailsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold">Volunteer Application Details</div>
                <div className="text-sm text-muted-foreground font-normal">
                  Review complete application information
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedVolunteer && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg border-l-4 ${
                selectedVolunteer.status === 'approved' 
                  ? 'bg-green-50 border-green-400' 
                  : selectedVolunteer.status === 'rejected'
                  ? 'bg-red-50 border-red-400'
                  : 'bg-yellow-50 border-yellow-400'
              }`}>
                <div className="flex items-center gap-3">
                  {selectedVolunteer.status === 'approved' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  {selectedVolunteer.status === 'rejected' && <XCircle className="w-5 h-5 text-red-600" />}
                  {selectedVolunteer.status === 'pending' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                  
                  <div className="flex-1">
                    <div className="font-semibold text-sm capitalize">
                      Application {selectedVolunteer.status}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedVolunteer.status === 'approved' && 'This volunteer has been approved to help with your campaign'}
                      {selectedVolunteer.status === 'rejected' && 'This volunteer application was rejected'}
                      {selectedVolunteer.status === 'pending' && 'This application is waiting for your review'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Volunteer Profile Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold text-sm">Personal Information</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {selectedVolunteer.volunteerProfile?.profileImageUrl && (
                          <img 
                            src={selectedVolunteer.volunteerProfile.profileImageUrl} 
                            alt="Profile" 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <div className="text-lg font-bold">
                          {selectedVolunteer.applicantName || selectedVolunteer.volunteerProfile?.firstName || 'Anonymous Volunteer'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        📧 {selectedVolunteer.volunteerProfile?.email || selectedVolunteer.applicantEmail}
                      </div>
                      {selectedVolunteer.volunteerProfile?.phoneNumber && (
                        <div className="text-sm text-gray-600">
                          📱 {selectedVolunteer.volunteerProfile.phoneNumber}
                        </div>
                      )}
                      {selectedVolunteer.volunteerProfile?.address && (
                        <div className="text-sm text-gray-600">
                          🏠 {selectedVolunteer.volunteerProfile.address}
                        </div>
                      )}
                      {/* Telegram Information - Only show if available AND approved */}
                      {selectedVolunteer.status === 'approved' && (selectedVolunteer.telegramDisplayName || selectedVolunteer.telegramUsername) && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-2">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.139-.357.139-.497 0l.537-3.188 2.953-2.67c.122-.11-.026-.174-.19-.065l-3.637 2.297-1.566-.491c-.34-.107-.345-.34.076-.502l6.105-2.354c.283-.114.529.065.444.486z"/>
                            </svg>
                            <span className="font-semibold text-sm text-red-800">Telegram Contact</span>
                          </div>
                          {selectedVolunteer.telegramDisplayName && (
                            <div className="text-sm text-red-700">
                              <span className="font-medium">Display Name:</span> {selectedVolunteer.telegramDisplayName}
                            </div>
                          )}
                          {selectedVolunteer.telegramUsername && (
                            <div className="text-sm text-red-700">
                              <span className="font-medium">Username:</span> {selectedVolunteer.telegramUsername}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Telegram Community Prompt - Show when Telegram info is visible (approved volunteers) */}
                      {selectedVolunteer.status === 'approved' && (selectedVolunteer.telegramDisplayName || selectedVolunteer.telegramUsername) && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.139-.357.139-.497 0l.537-3.188 2.953-2.67c.122-.11-.026-.174-.19-.065l-3.637 2.297-1.566-.491c-.34-.107-.345-.34.076-.502l6.105-2.354c.283-.114.529.065.444.486z"/>
                            </svg>
                            <span className="font-semibold text-blue-800">Join VeriFund Community</span>
                          </div>
                          <div className="text-sm text-blue-700 mb-3">
                            Connect with your campaign team and the broader VeriFund community for better coordination:
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-100 mb-3">
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.139-.357.139-.497 0l.537-3.188 2.953-2.67c.122-.11-.026-.174-.19-.065l-3.637 2.297-1.566-.491c-.34-.107-.345-.34.076-.502l6.105-2.354c.283-.114.529.065.444.486z"/>
                            </svg>
                            <a 
                              href="https://t.me/verifund" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                            >
                              https://t.me/verifund
                            </a>
                          </div>
                          <div className="text-xs text-blue-600 leading-relaxed">
                            💡 <strong>Pro Tip:</strong> Join our community first, then use the Telegram usernames above to create your own private campaign group chat for focused planning and coordination.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Professional Background */}
                  {(selectedVolunteer.volunteerProfile?.profession || selectedVolunteer.volunteerProfile?.education) && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                        </svg>
                        <span className="font-semibold text-sm text-blue-800">Professional Background</span>
                      </div>
                      <div className="space-y-2">
                        {selectedVolunteer.volunteerProfile?.profession && (
                          <div className="text-sm">
                            <span className="font-medium">Profession:</span> {selectedVolunteer.volunteerProfile.profession}
                          </div>
                        )}
                        {selectedVolunteer.volunteerProfile?.education && (
                          <div className="text-sm">
                            <span className="font-medium">Education:</span> {selectedVolunteer.volunteerProfile.education}
                          </div>
                        )}
                        {selectedVolunteer.volunteerProfile?.workExperience && (
                          <div className="text-sm">
                            <span className="font-medium">Work Experience:</span> {selectedVolunteer.volunteerProfile.workExperience}
                          </div>
                        )}
                        {selectedVolunteer.volunteerProfile?.linkedinProfile && (
                          <div className="text-sm">
                            <span className="font-medium">LinkedIn:</span> 
                            <a 
                              href={selectedVolunteer.volunteerProfile.linkedinProfile} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline ml-1"
                            >
                              View Profile
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Organization Information */}
                  {(selectedVolunteer.volunteerProfile?.organizationName || selectedVolunteer.volunteerProfile?.organizationType) && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
                        </svg>
                        <span className="font-semibold text-sm text-green-800">Organization</span>
                      </div>
                      <div className="space-y-2">
                        {selectedVolunteer.volunteerProfile?.organizationName && (
                          <div className="text-sm">
                            <span className="font-medium">Organization:</span> {selectedVolunteer.volunteerProfile.organizationName}
                          </div>
                        )}
                        {selectedVolunteer.volunteerProfile?.organizationType && (
                          <div className="text-sm">
                            <span className="font-medium">Type:</span> {selectedVolunteer.volunteerProfile.organizationType}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold text-sm">Application Date</span>
                    </div>
                    <div>
                      {new Date(selectedVolunteer.createdAt).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* KYC Verification Status */}
                  <div className={`p-4 rounded-lg border ${
                    selectedVolunteer.volunteerProfile?.kycStatus === 'verified' 
                      ? 'bg-green-50 border-green-200' 
                      : selectedVolunteer.volunteerProfile?.kycStatus === 'pending'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className={`w-4 h-4 ${
                        selectedVolunteer.volunteerProfile?.kycStatus === 'verified' 
                          ? 'text-green-600' 
                          : selectedVolunteer.volunteerProfile?.kycStatus === 'pending'
                          ? 'text-yellow-600'
                          : 'text-gray-600'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span className={`font-semibold text-sm ${
                        selectedVolunteer.volunteerProfile?.kycStatus === 'verified' 
                          ? 'text-green-800' 
                          : selectedVolunteer.volunteerProfile?.kycStatus === 'pending'
                          ? 'text-yellow-800'
                          : 'text-gray-800'
                      }`}>Identity Verification</span>
                    </div>
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      selectedVolunteer.volunteerProfile?.kycStatus === 'verified' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedVolunteer.volunteerProfile?.kycStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedVolunteer.volunteerProfile?.kycStatus?.toUpperCase() || 'NOT VERIFIED'}
                    </div>
                    {selectedVolunteer.volunteerProfile?.kycStatus === 'verified' && (
                      <div className="text-xs text-green-700 mt-1">
                        ✅ Verified volunteer - Identity confirmed
                      </div>
                    )}
                  </div>

                  {/* Trust & Community Scores */}
                  <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg p-4 border">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Social Score</div>
                      <div className="text-lg font-bold text-blue-600">
                        {selectedVolunteer.volunteerProfile?.socialScore || 0}
                      </div>
                      <div className="text-xs text-gray-500">Community engagement</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Credit Score</div>
                      <div className="text-lg font-bold text-orange-600">
                        {selectedVolunteer.volunteerProfile?.creditScore || 0}%
                      </div>
                      <div className="text-xs text-gray-500">Document quality</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Star Rating</div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <div className="text-lg font-bold text-yellow-600">
                          {selectedVolunteer.volunteerProfile?.averageRating || 0}
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= Math.round(selectedVolunteer.volunteerProfile?.averageRating || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{selectedVolunteer.volunteerProfile?.totalRatings || 0} ratings</div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-sm text-purple-800">Account Information</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Member since:</span> {' '}
                        {selectedVolunteer.volunteerProfile?.createdAt 
                          ? new Date(selectedVolunteer.volunteerProfile.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : 'Unknown'
                        }
                      </div>
                      <div>
                        <span className="font-medium">Profile Status:</span> {' '}
                        <span className={`px-2 py-1 rounded text-xs ${
                          selectedVolunteer.volunteerProfile?.isProfileComplete 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {selectedVolunteer.volunteerProfile?.isProfileComplete ? 'Complete' : 'Incomplete'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-sm text-blue-800">Application Status</span>
                    </div>
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      selectedVolunteer.status === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedVolunteer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedVolunteer.status.toUpperCase()}
                    </div>
                  </div>

                  {selectedVolunteer.rejectionReason && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="font-semibold text-sm text-red-800">Rejection Reason</span>
                      </div>
                      <div className="text-sm text-red-700">
                        {selectedVolunteer.rejectionReason}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Volunteer Responses */}
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    Volunteer Responses
                  </h3>
                </div>

                {/* Why they want to help */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-2 mb-2">
                    <Heart className="w-4 h-4 text-purple-600 mt-1" />
                    <span className="font-semibold text-sm text-purple-800">Why they want to help:</span>
                  </div>
                  <div className="text-gray-700 leading-relaxed pl-6">
                    "{selectedVolunteer.intent}"
                  </div>
                </div>

                {/* Additional message */}
                {selectedVolunteer.message && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2 mb-2">
                      <Mail className="w-4 h-4 text-blue-600 mt-1" />
                      <span className="font-semibold text-sm text-blue-800">Additional Message:</span>
                    </div>
                    <div className="text-gray-700 leading-relaxed pl-6">
                      "{selectedVolunteer.message}"
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedVolunteer.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      approveVolunteerMutation.mutate(selectedVolunteer.id);
                      setIsVolunteerDetailsModalOpen(false);
                    }}
                    disabled={approveVolunteerMutation.isPending}
                    data-testid="modal-button-approve-volunteer"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve Volunteer
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      rejectVolunteerMutation.mutate(selectedVolunteer.id);
                      setIsVolunteerDetailsModalOpen(false);
                    }}
                    disabled={rejectVolunteerMutation.isPending}
                    data-testid="modal-button-reject-volunteer"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Application
                  </Button>
                </div>
              )}

              {selectedVolunteer.status !== 'pending' && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsVolunteerDetailsModalOpen(false)}
                    data-testid="modal-button-close"
                  >
                    Close Details
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Creator Profile Modal */}
      {showCreatorProfile && creatorProfile && (
        <Dialog 
          open={showCreatorProfile} 
          onOpenChange={(open) => {
            setShowCreatorProfile(open);
            if (!open) {
              // Clear creator profile state when modal closes
              setCreatorProfile(null);
            }
          }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Creator Profile
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {creatorProfile.profileImageUrl ? (
                    <img 
                      src={creatorProfile.profileImageUrl} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <span>{creatorProfile.firstName?.[0] || 'U'}{creatorProfile.lastName?.[0] || ''}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {creatorProfile.firstName || 'Anonymous'} {creatorProfile.lastName || 'User'}
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{creatorProfile.email || 'Email not provided'}</span>
                    </div>
                    <Badge 
                      variant={
                        creatorProfile.kycStatus === 'verified' ? 'default' : 
                        creatorProfile.kycStatus === 'pending' ? 'secondary' : 
                        'destructive'
                      }
                    >
                      <UserVerifiedBadge size="sm" className="mr-1" />
                      KYC {creatorProfile.kycStatus || 'Not started'}
                    </Badge>
                  </div>
                  {creatorProfile.joinDate && (
                    <p className="text-sm text-gray-500 mt-1">
                      Member since {format(new Date(creatorProfile.joinDate), 'MMMM yyyy')}
                    </p>
                  )}
                </div>
              </div>

              {/* Trust & Community Scores */}
              <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4 border">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Social Score</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {creatorProfile.socialScore || 0}
                  </div>
                  <div className="text-xs text-gray-500">Community engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Credit Score</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {creatorProfile.creditScore || 0}%
                  </div>
                  <div className="text-xs text-gray-500">Document quality</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Star Rating</div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="text-2xl font-bold text-yellow-600">
                      {creatorProfile.averageRating || 0}
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(creatorProfile.averageRating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{creatorProfile.totalRatings || 0} ratings</div>
                </div>
              </div>

              {/* Campaign Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{creatorProfile.totalCampaigns || 0}</div>
                  <div className="text-sm text-gray-600">Total Campaigns</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    ₱{creatorProfile.totalRaised ? parseFloat(creatorProfile.totalRaised).toLocaleString() : '0'}
                  </div>
                  <div className="text-sm text-gray-600">Funds Raised</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{creatorProfile.totalContributions || 0}</div>
                  <div className="text-sm text-gray-600">Contributions Made</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-lg font-bold text-orange-600">{creatorProfile.averageSuccessRate || 0}%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>

              {/* Profile Information */}
              {(creatorProfile.profession || creatorProfile.education || creatorProfile.address || creatorProfile.phoneNumber) && (
                <div className="bg-white border rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {creatorProfile.profession && (
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Profession</div>
                          <div className="font-medium">{creatorProfile.profession}</div>
                        </div>
                      </div>
                    )}
                    
                    {creatorProfile.education && (
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Education</div>
                          <div className="font-medium">{creatorProfile.education}</div>
                        </div>
                      </div>
                    )}
                    
                    {creatorProfile.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Address</div>
                          <div className="font-medium">{creatorProfile.address}</div>
                        </div>
                      </div>
                    )}
                    
                    {creatorProfile.phoneNumber && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Phone</div>
                          <div className="font-medium">{creatorProfile.phoneNumber}</div>
                        </div>
                      </div>
                    )}
                    
                    {creatorProfile.organizationName && (
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Organization</div>
                          <div className="font-medium">{creatorProfile.organizationName}</div>
                          {creatorProfile.organizationType && (
                            <div className="text-sm text-gray-500">({creatorProfile.organizationType})</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {creatorProfile.linkedinProfile && (
                      <div className="flex items-center gap-3">
                        <Linkedin className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">LinkedIn</div>
                          <a 
                            href={creatorProfile.linkedinProfile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-800 truncate"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Account Information */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">PHP Balance</div>
                      <div className="font-medium">₱{creatorProfile.phpBalance ? parseFloat(creatorProfile.phpBalance).toLocaleString() : '0'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Tips Balance</div>
                      <div className="font-medium">₱{creatorProfile.tipsBalance ? parseFloat(creatorProfile.tipsBalance).toLocaleString() : '0'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Contributions Balance</div>
                      <div className="font-medium">₱{creatorProfile.contributionsBalance ? parseFloat(creatorProfile.contributionsBalance).toLocaleString() : '0'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setShowCreatorProfile(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Fraud Report Modal */}
      <Dialog open={showFraudReportModal} onOpenChange={setShowFraudReportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Campaign</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Please help us maintain community safety by reporting suspicious or fraudulent campaigns.
            </p>
          </DialogHeader>
          
          <Form {...fraudReportForm}>
            <form onSubmit={fraudReportForm.handleSubmit(onSubmitFraudReport)} className="space-y-4">
              <FormField
                control={fraudReportForm.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Type</FormLabel>
                    <FormControl>
                      <select 
                        className="w-full p-2 border rounded-md"
                        {...field}
                        data-testid="select-report-type"
                      >
                        <option value="">Select report type</option>
                        <option value="fraud">Fraud/Scam</option>
                        <option value="inappropriate">Inappropriate Content</option>
                        <option value="fake">Fake/Misleading Information</option>
                        <option value="other">Other</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={fraudReportForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide details about why you're reporting this campaign..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="textarea-report-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFraudReportModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitFraudReportMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                  data-testid="button-submit-report"
                >
                  {submitFraudReportMutation.isPending ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Transaction Details Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                  <p className="text-sm font-mono break-all">{selectedTransaction.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-sm">{(selectedTransaction.type || 'Transaction').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="text-lg font-semibold">₱{parseFloat(selectedTransaction.amount || '0').toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm font-medium text-green-600">{selectedTransaction.status || 'Completed'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                  <p className="text-sm">{new Date(selectedTransaction.createdAt!).toLocaleString()}</p>
                </div>
                {selectedTransaction.transactionHash && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
                    <p className="text-sm font-mono break-all">{selectedTransaction.transactionHash}</p>
                  </div>
                )}
                {selectedTransaction.fee && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fee</label>
                    <p className="text-sm">₱{parseFloat(selectedTransaction.fee).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contribution Details Modal */}
      <Dialog open={!!selectedContribution} onOpenChange={() => setSelectedContribution(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contribution Details</DialogTitle>
          </DialogHeader>
          {selectedContribution && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contribution ID</label>
                  <p className="text-sm font-mono break-all">{selectedContribution.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-sm">Contribution</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="text-lg font-semibold">₱{parseFloat(selectedContribution.amount).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm font-medium text-green-600">Completed</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contributor</label>
                  <p className="text-sm">{selectedContribution.isAnonymous ? 'Anonymous' : 'Public Contributor'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                  <p className="text-sm">{new Date(selectedContribution.createdAt!).toLocaleString()}</p>
                </div>
              </div>
              {selectedContribution.message && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Message</label>
                  <div className="bg-gray-50 rounded-lg p-3 mt-1">
                    <p className="text-sm">"{selectedContribution.message}"</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tip Details Modal */}
      <Dialog open={!!selectedTip} onOpenChange={() => setSelectedTip(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tip Details</DialogTitle>
          </DialogHeader>
          {selectedTip && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tip ID</label>
                  <p className="text-sm font-mono break-all">{selectedTip.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-sm">Tip</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="text-lg font-semibold">₱{parseFloat(selectedTip.amount || '0').toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm font-medium text-green-600">Completed</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipper</label>
                  <p className="text-sm">{selectedTip.isAnonymous ? 'Anonymous' : 'Public Tipper'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                  <p className="text-sm">{new Date(selectedTip.createdAt!).toLocaleString()}</p>
                </div>
              </div>
              {selectedTip.message && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Message</label>
                  <div className="bg-gray-50 rounded-lg p-3 mt-1">
                    <p className="text-sm">"{selectedTip.message}"</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
