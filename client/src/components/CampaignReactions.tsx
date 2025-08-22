import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Share2, Flag } from 'lucide-react';

interface Reaction {
  id: string;
  reactionType: string;
  userId: string;
  campaignId: string;
  createdAt: Date;
}

interface ReactionSummary {
  [key: string]: {
    count: number;
    users: string[];
  };
}

interface CampaignReactionsProps {
  campaignId: string;
}

const reactionTypes = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'support', emoji: '🤝', label: 'Support' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😠', label: 'Angry' },
];

export default function CampaignReactions({ campaignId }: CampaignReactionsProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  // Fetch campaign reactions
  const { data: reactions = {} } = useQuery<ReactionSummary>({
    queryKey: ['/api/campaigns', campaignId, 'reactions'],
  });

  // Fetch user's current reaction
  const { data: userReaction } = useQuery<{ reaction: Reaction | null }>({
    queryKey: ['/api/campaigns', campaignId, 'reactions', 'user'],
    enabled: isAuthenticated,
  });

  // Toggle reaction mutation
  const toggleReactionMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      if (!isAuthenticated) {
        throw new Error('Please log in to react to campaigns');
      }
      return apiRequest('POST', `/api/campaigns/${campaignId}/reactions`, { reactionType });
    },
    onSuccess: () => {
      // Invalidate and refetch reactions
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'reactions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleReactionClick = (reactionType: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to react to campaigns',
        variant: 'destructive',
      });
      return;
    }

    toggleReactionMutation.mutate(reactionType);
  };

  const getUserReactionType = () => {
    return userReaction?.reaction?.reactionType || null;
  };

  const getTotalReactions = () => {
    return Object.values(reactions).reduce((total, reaction) => total + reaction.count, 0);
  };

  const handleShare = () => {
    const campaignUrl = `${window.location.origin}/campaigns/${campaignId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Check out this campaign',
        url: campaignUrl,
      });
    } else {
      navigator.clipboard.writeText(campaignUrl);
      toast({
        title: 'Link copied!',
        description: 'Campaign link copied to clipboard',
      });
    }
  };

  const reportMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!isAuthenticated) {
        throw new Error('Please log in to report campaigns');
      }
      return apiRequest('POST', `/api/campaigns/${campaignId}/reports`, { reason });
    },
    onSuccess: () => {
      setIsReportModalOpen(false);
      setReportReason('');
      toast({
        title: 'Report submitted',
        description: 'Thank you for reporting. We will review this campaign.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleReport = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to report campaigns',
        variant: 'destructive',
      });
      return;
    }
    setIsReportModalOpen(true);
  };

  const submitReport = () => {
    if (!reportReason.trim()) {
      toast({
        title: 'Please provide a reason',
        description: 'Please explain why you are reporting this campaign',
        variant: 'destructive',
      });
      return;
    }
    reportMutation.mutate(reportReason);
  };

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800" data-testid="campaign-reactions">
      <div className="flex flex-col space-y-4">
        {/* Reaction Buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          {reactionTypes.map((reaction) => {
            const isActive = getUserReactionType() === reaction.type;
            const count = reactions[reaction.type]?.count || 0;
            
            return (
              <TooltipProvider key={reaction.type}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleReactionClick(reaction.type)}
                      disabled={toggleReactionMutation.isPending}
                      className={`flex items-center gap-1 ${
                        isActive 
                          ? "bg-blue-500 hover:bg-blue-600 text-white" 
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      data-testid={`reaction-${reaction.type}`}
                    >
                      <span className="text-lg">{reaction.emoji}</span>
                      {count > 0 && <span className="text-sm">{count}</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-semibold">{reaction.label}</p>
                      {reactions[reaction.type]?.users && (
                        <div className="mt-1 text-sm">
                          {reactions[reaction.type].users.slice(0, 3).join(', ')}
                          {reactions[reaction.type].users.length > 3 && 
                            ` and ${reactions[reaction.type].users.length - 3} more`
                          }
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
          
          <div className="flex items-center gap-2 ml-4">
            {/* Share Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-700"
                    data-testid="button-share"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="text-sm">Share</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share this campaign</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Report Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReport}
                    className="flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                    data-testid="button-report"
                  >
                    <Flag className="h-4 w-4" />
                    <span className="text-sm">Report</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Report inappropriate content</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Reaction Summary */}
        {getTotalReactions() > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span data-testid="reaction-summary">
              {getTotalReactions()} {getTotalReactions() === 1 ? 'reaction' : 'reactions'}
            </span>
          </div>
        )}
      </div>

      {/* Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Help us keep the platform safe by reporting inappropriate content. Please explain why you're reporting this campaign.
            </p>
            <Textarea
              placeholder="Please describe the issue with this campaign..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
              data-testid="textarea-report-reason"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
              {reportReason.length}/500 characters
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsReportModalOpen(false)}
                data-testid="button-cancel-report"
              >
                Cancel
              </Button>
              <Button 
                onClick={submitReport} 
                disabled={reportMutation.isPending || !reportReason.trim()}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-submit-report"
              >
                {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}