import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { 
  Settings, 
  HandCoins, 
  Gift, 
  XCircle, 
  CheckCircle2,
  Eye,
  Flag
} from 'lucide-react';
import type { CampaignWithCreator } from '@shared/schema';

interface CampaignManagementProps {
  campaign: CampaignWithCreator;
  variant?: 'card' | 'detail' | 'admin';
  onClaimContribution?: () => void;
  onClaimTip?: () => void;
  totalTips?: number;
  className?: string;
}

export function CampaignManagement({ 
  campaign, 
  variant = 'card',
  onClaimContribution,
  onClaimTip,
  totalTips = 0,
  className = ''
}: CampaignManagementProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const isCreator = (user as any)?.id === campaign?.creatorId;
  const isAdmin = (user as any)?.isAdmin;
  const isKycVerified = ['verified', 'approved'].includes((user as any)?.kycStatus || '');
  const isActiveStatus = ['active', 'on_progress'].includes(campaign?.status || '');

  // Handle campaign status changes
  const handleStatusChange = async (status: string, confirmMessage: string, successMessage: string) => {
    if (confirm(confirmMessage)) {
      try {
        await apiRequest("PATCH", `/api/campaigns/${campaign?.id}/status`, { status });
        toast({
          title: "Success",
          description: successMessage,
        });
        // Invalidate all campaign-related queries
        queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/campaigns"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
        queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaign?.id] });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Action failed. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle admin actions
  const handleAdminAction = async (action: 'approve' | 'reject' | 'flag', confirmMessage: string) => {
    if (confirm(confirmMessage)) {
      try {
        await apiRequest("POST", `/api/admin/campaigns/${campaign?.id}/${action}`, {});
        toast({
          title: "Success",
          description: `Campaign ${action}d successfully.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
        queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to ${action} campaign. Please try again.`,
          variant: "destructive",
        });
      }
    }
  };

  // Card variant - Simple manage/contribute button
  if (variant === 'card') {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="flex items-center text-sm text-muted-foreground">
          <span data-testid={`text-contributors-${campaign?.id}`}>Contributors</span>
        </div>
        <Link href={`/campaigns/${campaign?.id}`}>
          <Button 
            size="sm"
            variant={isCreator ? "outline" : "default"}
            data-testid={`button-${isCreator ? 'manage' : 'contribute'}-${campaign?.id}`}
          >
            {isCreator ? (
              <>
                <Settings className="w-4 h-4 mr-2" />
                MANAGE
              </>
            ) : (
              "Contribute"
            )}
          </Button>
        </Link>
      </div>
    );
  }

  // Admin variant - Admin specific actions
  if (variant === 'admin') {
    return (
      <div className={`space-y-2 ${className}`}>
        {campaign?.status === 'pending' && (
          <div className="grid grid-cols-3 gap-2">
            <Button 
              size="sm" 
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleAdminAction('approve', 'Approve this campaign?')}
              data-testid={`button-admin-approve-${campaign?.id}`}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              APPROVE
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => handleAdminAction('reject', 'Reject this campaign?')}
              data-testid={`button-admin-reject-${campaign?.id}`}
            >
              <XCircle className="w-4 h-4 mr-1" />
              REJECT
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              onClick={() => handleAdminAction('flag', 'Flag this campaign for review?')}
              data-testid={`button-admin-flag-${campaign?.id}`}
            >
              <Flag className="w-4 h-4 mr-1" />
              FLAG
            </Button>
          </div>
        )}
        <Link href={`/campaigns/${campaign?.id}`}>
          <Button 
            size="sm" 
            variant="outline"
            className="w-full"
            data-testid={`button-admin-view-${campaign?.id}`}
          >
            <Eye className="w-4 h-4 mr-2" />
            VIEW DETAILS
          </Button>
        </Link>
      </div>
    );
  }

  // Detail variant - Full management interface
  if (variant === 'detail' && isAuthenticated && isCreator && isActiveStatus) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Claim Buttons */}
        <div className="space-y-2">
          <Button 
            size="lg" 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={onClaimContribution}
            disabled={!isKycVerified}
            data-testid="button-claim-contributions-main"
          >
            <HandCoins className="w-4 h-4 mr-2" />
            CLAIM CONTRIBUTION
          </Button>
          <Button 
            size="lg" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={onClaimTip}
            disabled={!isKycVerified || totalTips === 0}
            data-testid="button-claim-tips-main"
          >
            <Gift className="w-4 h-4 mr-2" />
            {totalTips === 0 ? 'ALL TIPS CLAIMED' : 'CLAIM TIP'}
          </Button>
        </div>

        {/* Campaign Management Actions */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50 min-w-[120px] text-xs"
              onClick={() => handleStatusChange(
                'cancelled',
                `⚠️ CRITICAL WARNING: End Campaign Pool ⚠️

Closed Campaign Pools that raised contributions and tips will do automatic refunds to all contributors and tippers. All claimed tips and contributions in your account will be sent automatically to the contributors' wallets.

🚨 FRAUD DETECTION & CONSEQUENCES:
• If contributors receive their complete contributed amount: You will NOT be flagged for fraud
• If NOT all contributors receive full refunds: You WILL be flagged for fraud and your account WILL be suspended

📊 CREDIT SCORE EVALUATION IMPACT:
Based on your progress reports after closing:
• Below 65% credit score: Account SUSPENDED
• 66-75%: Only 2 more pools LIFETIME + must increase credit score to unlock monthly access
• 76-85%: Limited to 2 pools per month
• 85-95%: Limited to 4 pools per month  
• 96-100%: Limited to 10 pools per month

⏰ SUSPENSION APPEAL PROCESS:
• Suspended accounts can request dispute evaluation
• Suspended accounts can request lifting of suspension through Support Ticket
• Admin review takes 30 days to complete
• No guarantee of account restoration

💰 REFUND PROCESS:
• All funds automatically distributed to contributors
• Process cannot be reversed once initiated
• No further contributions accepted

This action is PERMANENT and cannot be undone. Do you understand the consequences and want to proceed?`,
                'Your campaign pool has been closed. Automatic refund processing has begun. All contributors will receive their funds back.'
              )}
              data-testid="button-end-campaign"
            >
              <XCircle className="w-4 h-4 mr-1" />
              CLOSE CAMPAIGN
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50 min-w-[130px] text-xs"
              onClick={() => handleStatusChange(
                'completed',
                'Mark this campaign as completed? This will close the campaign and stop further contributions.',
                'Congratulations! Your campaign has been marked as completed.'
              )}
              data-testid="button-complete-campaign"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              CAMPAIGN COMPLETE
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default CampaignManagement;