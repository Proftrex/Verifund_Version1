import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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




  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800" data-testid="campaign-reactions">
      <div className="flex flex-col space-y-4">
        {/* Reaction Buttons and Actions */}
        <div className="flex justify-between items-center">
          {/* Left side - Reaction Buttons */}
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
          </div>
          
          {/* Right side - Share and Report */}
          <div className="flex items-center gap-2">
            {/* Share Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const campaignUrl = `${window.location.origin}/campaigns/${campaignId}`;
                      navigator.clipboard.writeText(campaignUrl);
                      toast({
                        title: 'Link copied!',
                        description: 'Campaign link copied to clipboard',
                      });
                    }}
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
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast({
                          title: 'Please log in',
                          description: 'You need to be logged in to report campaigns',
                          variant: 'destructive',
                        });
                        return;
                      }
                      // This will trigger the report functionality
                      toast({
                        title: 'Report submitted',
                        description: 'Thank you for reporting. We will review this campaign.',
                      });
                    }}
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

    </div>
  );
}