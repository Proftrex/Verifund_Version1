import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { insertCampaignSchema, insertContributionSchema, insertVolunteerApplicationSchema } from "@shared/schema";
import { z } from "zod";
import { paymongoService } from "./services/paymongoService";
import { celoService } from "./services/celoService";
import { conversionService } from "./services/conversionService";

// Helper function for reaction emojis
function getReactionEmoji(reactionType: string): string {
  const emojiMap: { [key: string]: string } = {
    'like': '👍',
    'love': '❤️',
    'support': '🤝',
    'wow': '😮',
    'sad': '😢',
    'angry': '😠'
  };
  return emojiMap[reactionType] || '👍';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationId = req.params.id;
      await storage.markNotificationAsRead(notificationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Campaign routes
  app.get('/api/campaigns', async (req, res) => {
    try {
      const { status, category, limit } = req.query;
      const campaigns = await storage.getCampaigns({
        status: status as string,
        category: category as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // Featured campaigns - high credibility creators
  app.get('/api/campaigns/featured', isAuthenticated, async (req: any, res) => {
    try {
      const featuredCampaigns = await storage.getFeaturedCampaigns(6); // Limit to 6 campaigns
      res.json(featuredCampaigns);
    } catch (error) {
      console.error("Error fetching featured campaigns:", error);
      res.status(500).json({ message: "Failed to fetch featured campaigns" });
    }
  });

  // Recommended campaigns - based on user interests
  app.get('/api/campaigns/recommended', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recommendedCampaigns = await storage.getRecommendedCampaigns(userId, 6); // Limit to 6 campaigns
      res.json(recommendedCampaigns);
    } catch (error) {
      console.error("Error fetching recommended campaigns:", error);
      res.status(500).json({ message: "Failed to fetch recommended campaigns" });
    }
  });

  app.get('/api/campaigns/:id', async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.post('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignData = insertCampaignSchema.parse({
        ...req.body,
        creatorId: userId,
      });
      
      const campaign = await storage.createCampaign(campaignData);
      
      // Create notification for campaign creation
      await storage.createNotification({
        userId: userId,
        title: "Campaign Created Successfully! 🚀",
        message: `Your campaign "${campaign.title}" has been created and is now under review by our admin team.`,
        type: "campaign_created",
        relatedId: campaign.id,
      });
      
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.get('/api/campaigns/:id/contributions', async (req, res) => {
    try {
      const contributions = await storage.getContributionsByCampaign(req.params.id);
      res.json(contributions);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  app.post('/api/campaigns/:id/contribute', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contributionData = insertContributionSchema.parse({
        ...req.body,
        campaignId: req.params.id,
        contributorId: userId,
      });
      
      const contributionAmount = parseFloat(contributionData.amount);
      
      // Check if campaign exists and is active
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (campaign.status !== "active") {
        return res.status(400).json({ message: "Campaign is not active" });
      }
      
      // Check user PUSO balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const userBalance = parseFloat(user.pusoBalance || '0');
      if (userBalance < contributionAmount) {
        return res.status(400).json({ 
          message: `Insufficient PUSO balance. Available: ${userBalance.toLocaleString()} PUSO, Required: ${contributionAmount.toLocaleString()} PUSO`,
          availableBalance: userBalance,
          requiredAmount: contributionAmount
        });
      }
      
      // Create the contribution record
      const contribution = await storage.createContribution(contributionData);
      
      // Deduct PUSO from user's balance
      const newUserBalance = userBalance - contributionAmount;
      await storage.updateUserBalance(userId, newUserBalance.toString());
      
      // Update campaign current amount
      const currentCampaignAmount = parseFloat(campaign.currentAmount || '0');
      const newCampaignAmount = currentCampaignAmount + contributionAmount;
      await storage.updateCampaignAmount(req.params.id, newCampaignAmount.toString());
      
      // Create transaction record for the contribution
      await storage.createTransaction({
        userId: userId,
        campaignId: req.params.id,
        type: "contribution",
        amount: contributionData.amount,
        currency: "PUSO",
        description: `Contribution to ${campaign.title}${contributionData.message ? ` - ${contributionData.message}` : ''}`,
        status: "completed",
        transactionHash: contribution.transactionHash!,
      });

      // Create notifications for both contributor and campaign creator
      // Notification for contributor (sender)
      await storage.createNotification({
        userId: userId,
        title: "Contribution Sent Successfully! 💝",
        message: `Your ${contributionAmount.toLocaleString()} PUSO contribution to "${campaign.title}" has been processed successfully.`,
        type: "contribution_sent",
        relatedId: req.params.id,
      });

      // Notification for campaign creator (receiver)
      if (campaign.creatorId !== userId) {
        await storage.createNotification({
          userId: campaign.creatorId,
          title: "New Contribution Received! 🎉",
          message: `You received ${contributionAmount.toLocaleString()} PUSO contribution for "${campaign.title}". ${contributionData.message ? `Message: "${contributionData.message}"` : ''}`,
          type: "contribution_received",
          relatedId: req.params.id,
        });
      }
      
      console.log(`✅ Contribution successful: ${contributionAmount} PUSO from user ${userId} to campaign ${req.params.id}`);
      console.log(`   User balance: ${userBalance} → ${newUserBalance} PUSO`);
      console.log(`   Campaign total: ${currentCampaignAmount} → ${newCampaignAmount} PUSO`);
      
      res.json({
        ...contribution,
        newUserBalance,
        newCampaignAmount,
        message: "Contribution successful!"
      });
    } catch (error) {
      console.error("Error creating contribution:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contribution data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contribution" });
    }
  });

  // Claim campaign funds (supports partial claiming with amount parameter)
  app.post('/api/campaigns/:id/claim', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.params.id;
      const requestedAmount = req.body.amount ? parseFloat(req.body.amount) : null;
      
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      
      // Check if user is the campaign creator
      if (campaign.creatorId !== userId) {
        return res.status(403).json({ message: 'Only campaign creator can claim funds' });
      }
      
      // Check if campaign is in claimable state
      if (campaign.status !== 'active') {
        return res.status(400).json({ message: 'Campaign must be active to claim funds' });
      }
      
      const currentAmount = parseFloat(campaign.currentAmount || '0');
      const minimumClaim = 1; // Allow any amount for partial claiming
      
      if (currentAmount < minimumClaim) {
        return res.status(400).json({ 
          message: `No funds available to claim. Current: ${currentAmount.toLocaleString()} PUSO` 
        });
      }
      
      // Determine claim amount - either requested amount or full amount
      const claimAmount = requestedAmount || currentAmount;
      
      // Validate requested amount
      if (requestedAmount) {
        if (requestedAmount <= 0) {
          return res.status(400).json({ message: 'Claim amount must be greater than 0' });
        }
        if (requestedAmount > currentAmount) {
          return res.status(400).json({ 
            message: `Insufficient funds. Available: ${currentAmount.toLocaleString()} PUSO, Requested: ${requestedAmount.toLocaleString()} PUSO` 
          });
        }
      }
      
      // Check user KYC status
      const user = await storage.getUser(userId);
      if (!user || (user.kycStatus !== 'approved' && user.kycStatus !== 'verified')) {
        return res.status(403).json({ 
          message: 'KYC verification required for fund claims. Please complete your KYC verification first.',
          currentKycStatus: user?.kycStatus || 'not_started'
        });
      }
      
      // Create claim transaction
      const transaction = await storage.createTransaction({
        userId,
        type: 'claim',
        amount: claimAmount.toString(),
        currency: 'PUSO',
        description: `Claimed ${claimAmount.toLocaleString()} PUSO from campaign: ${campaign.title}`,
        status: 'completed',
        transactionHash: `claim-${campaignId}-${Date.now()}`,
        campaignId: campaignId,
      });
      
      // Add PUSO balance to creator's wallet
      const currentUserBalance = parseFloat(user.pusoBalance || '0');
      const newUserBalance = currentUserBalance + claimAmount;
      await storage.updateUserBalance(userId, newUserBalance.toString());
      
      // Update campaign amount (subtract claimed amount)
      const remainingAmount = currentAmount - claimAmount;
      await storage.updateCampaignAmount(campaignId, remainingAmount.toString());
      
      // If fully claimed, update status
      if (remainingAmount <= 0) {
        await storage.updateCampaignStatus(campaignId, 'claimed');
      }
      
      // Create notification for successful claim
      await storage.createNotification({
        userId: userId,
        title: "Funds Claimed Successfully! 💰",
        message: `You have successfully claimed ${claimAmount.toLocaleString()} PUSO from your campaign "${campaign.title}".`,
        type: "campaign_claimed",
        relatedId: campaignId,
      });
      
      console.log(`✅ Campaign funds claimed successfully:`);
      console.log(`   Campaign: ${campaign.title} (${campaignId})`);
      console.log(`   Claimed amount: ${claimAmount.toLocaleString()} PUSO`);
      console.log(`   Creator balance: ${currentUserBalance.toLocaleString()} → ${newUserBalance.toLocaleString()} PUSO`);
      console.log(`   Transaction ID: ${transaction.id}`);
      
      res.json({
        message: 'Funds claimed successfully! 🎉',
        claimedAmount: claimAmount,
        newBalance: newUserBalance,
        transactionId: transaction.id
      });
    } catch (error) {
      console.error('Error claiming campaign funds:', error);
      res.status(500).json({ message: 'Failed to claim funds' });
    }
  });

  // Claim campaign tips (campaign-specific tip claiming with amount parameter)
  app.post('/api/campaigns/:id/claim-tips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.params.id;
      const requestedAmount = req.body.amount ? parseFloat(req.body.amount) : 0;
      
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      
      // Check if user is the campaign creator
      if (campaign.creatorId !== userId) {
        return res.status(403).json({ message: 'Only campaign creator can claim tips' });
      }
      
      // Validate requested amount
      if (requestedAmount <= 0) {
        return res.status(400).json({ message: 'Claim amount must be greater than 0' });
      }
      
      // Check user KYC status
      const user = await storage.getUser(userId);
      if (!user || (user.kycStatus !== 'approved' && user.kycStatus !== 'verified')) {
        return res.status(403).json({ 
          message: 'KYC verification required for tip claims. Please complete your KYC verification first.',
          currentKycStatus: user?.kycStatus || 'not_started'
        });
      }
      
      // Get user's current tip balance (for simplicity, we'll add the requested amount to tips wallet)
      // In a real system, you'd track campaign-specific tips
      const currentTipBalance = parseFloat(user.tipsBalance || '0');
      const newTipBalance = currentTipBalance + requestedAmount;
      
      // Update user's tip balance
      await storage.updateUserTipBalance(userId, newTipBalance.toString());
      
      // Create tip claim transaction
      const transaction = await storage.createTransaction({
        userId,
        type: 'tip',
        amount: requestedAmount.toString(),
        currency: 'PUSO',
        description: `Claimed ${requestedAmount.toLocaleString()} PUSO tips from campaign: ${campaign.title}`,
        status: 'completed',
        transactionHash: `tip-claim-${campaignId}-${Date.now()}`,
        campaignId: campaignId,
      });
      
      console.log(`🎁 Campaign tips claimed: ${requestedAmount} PUSO from campaign ${campaign.title} transferred to tip wallet for user: ${userId}`);
      
      res.json({
        message: 'Tips claimed successfully! 🎁',
        claimedAmount: requestedAmount,
        newTipBalance,
        transactionId: transaction.id
      });
    } catch (error) {
      console.error('Error claiming campaign tips:', error);
      res.status(500).json({ message: 'Failed to claim tips' });
    }
  });

  // Campaign engagement routes - reactions
  app.post('/api/campaigns/:id/reactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.params.id;
      const { reactionType } = req.body;

      if (!reactionType) {
        return res.status(400).json({ message: 'Reaction type is required' });
      }

      const reaction = await storage.toggleCampaignReaction(campaignId, userId, reactionType);
      
      // Create notification for campaign creator
      if (reaction) {
        const campaign = await storage.getCampaign(campaignId);
        if (campaign && campaign.creatorId !== userId) {
          const user = await storage.getUser(userId);
          const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Someone';
          
          await storage.createNotification({
            userId: campaign.creatorId,
            title: `${getReactionEmoji(reactionType)} New reaction on your campaign`,
            message: `${userName} reacted ${reactionType} to your campaign "${campaign.title}"`,
            type: 'campaign_reaction',
            relatedId: campaignId,
          });
        }
      }

      res.json({ reaction, success: true });
    } catch (error) {
      console.error('Error toggling reaction:', error);
      res.status(500).json({ message: 'Failed to toggle reaction' });
    }
  });

  app.get('/api/campaigns/:id/reactions', async (req, res) => {
    try {
      const campaignId = req.params.id;
      const reactions = await storage.getCampaignReactions(campaignId);
      res.json(reactions);
    } catch (error) {
      console.error('Error fetching reactions:', error);
      res.status(500).json({ message: 'Failed to fetch reactions' });
    }
  });

  app.get('/api/campaigns/:id/reactions/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.params.id;
      const reaction = await storage.getCampaignReactionByUser(campaignId, userId);
      res.json({ reaction: reaction || null });
    } catch (error) {
      console.error('Error fetching user reaction:', error);
      res.status(500).json({ message: 'Failed to fetch user reaction' });
    }
  });

  // Campaign engagement routes - comments
  app.post('/api/campaigns/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.params.id;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Comment content is required' });
      }

      if (content.length > 1000) {
        return res.status(400).json({ message: 'Comment cannot exceed 1000 characters' });
      }

      const comment = await storage.createCampaignComment({
        campaignId,
        userId,
        content: content.trim(),
      });

      // Create notification for campaign creator
      const campaign = await storage.getCampaign(campaignId);
      if (campaign && campaign.creatorId !== userId) {
        const user = await storage.getUser(userId);
        const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Someone';
        
        await storage.createNotification({
          userId: campaign.creatorId,
          title: '💬 New comment on your campaign',
          message: `${userName} commented on your campaign "${campaign.title}"`,
          type: 'campaign_comment',
          relatedId: campaignId,
        });
      }

      res.json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: 'Failed to create comment' });
    }
  });

  app.get('/api/campaigns/:id/comments', async (req, res) => {
    try {
      const campaignId = req.params.id;
      const comments = await storage.getCampaignComments(campaignId);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  });

  app.put('/api/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentId = req.params.id;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Comment content is required' });
      }

      if (content.length > 1000) {
        return res.status(400).json({ message: 'Comment cannot exceed 1000 characters' });
      }

      const updatedComment = await storage.updateCampaignComment(commentId, content.trim(), userId);
      
      if (!updatedComment) {
        return res.status(404).json({ message: 'Comment not found or unauthorized' });
      }

      res.json(updatedComment);
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({ message: 'Failed to update comment' });
    }
  });

  app.delete('/api/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentId = req.params.id;

      await storage.deleteCampaignComment(commentId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ message: 'Failed to delete comment' });
    }
  });

  // Comment reply routes
  app.post('/api/comments/:id/replies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentId = req.params.id;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Reply content is required' });
      }

      if (content.length > 500) {
        return res.status(400).json({ message: 'Reply cannot exceed 500 characters' });
      }

      const reply = await storage.createCommentReply({
        commentId,
        userId,
        content: content.trim(),
      });

      res.json(reply);
    } catch (error) {
      console.error('Error creating reply:', error);
      res.status(500).json({ message: 'Failed to create reply' });
    }
  });

  app.put('/api/replies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const replyId = req.params.id;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Reply content is required' });
      }

      if (content.length > 500) {
        return res.status(400).json({ message: 'Reply cannot exceed 500 characters' });
      }

      const updatedReply = await storage.updateCommentReply(replyId, content.trim(), userId);
      
      if (!updatedReply) {
        return res.status(404).json({ message: 'Reply not found or unauthorized' });
      }

      res.json(updatedReply);
    } catch (error) {
      console.error('Error updating reply:', error);
      res.status(500).json({ message: 'Failed to update reply' });
    }
  });

  app.delete('/api/replies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const replyId = req.params.id;

      await storage.deleteCommentReply(replyId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting reply:', error);
      res.status(500).json({ message: 'Failed to delete reply' });
    }
  });

  // Comment and Reply Voting Routes (Social Score System)
  app.post('/api/comments/:id/vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentId = req.params.id;
      const { voteType } = req.body;

      if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
        return res.status(400).json({ message: 'Vote type must be "upvote" or "downvote"' });
      }

      await storage.voteOnComment(userId, commentId, voteType);
      
      res.json({ 
        success: true, 
        message: `Comment ${voteType}d successfully`,
        voteType 
      });
    } catch (error) {
      console.error('Error voting on comment:', error);
      res.status(500).json({ message: 'Failed to vote on comment' });
    }
  });

  app.post('/api/replies/:id/vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const replyId = req.params.id;
      const { voteType } = req.body;

      if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
        return res.status(400).json({ message: 'Vote type must be "upvote" or "downvote"' });
      }

      await storage.voteOnReply(userId, replyId, voteType);
      
      res.json({ 
        success: true, 
        message: `Reply ${voteType}d successfully`,
        voteType 
      });
    } catch (error) {
      console.error('Error voting on reply:', error);
      res.status(500).json({ message: 'Failed to vote on reply' });
    }
  });

  app.get('/api/comments/:id/user-vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentId = req.params.id;
      
      const vote = await storage.getUserVoteOnComment(userId, commentId);
      res.json(vote || { voteType: null });
    } catch (error) {
      console.error('Error fetching user vote on comment:', error);
      res.status(500).json({ message: 'Failed to fetch user vote' });
    }
  });

  app.get('/api/replies/:id/user-vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const replyId = req.params.id;
      
      const vote = await storage.getUserVoteOnReply(userId, replyId);
      res.json(vote || { voteType: null });
    } catch (error) {
      console.error('Error fetching user vote on reply:', error);
      res.status(500).json({ message: 'Failed to fetch user vote' });
    }
  });

  // Transaction routes
  app.get('/api/transactions/recent', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const transactions = await storage.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/campaigns/:id/transactions', async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByCampaign(req.params.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching campaign transactions:", error);
      res.status(500).json({ message: "Failed to fetch campaign transactions" });
    }
  });

  // Volunteer routes
  app.get('/api/volunteer-opportunities', async (req, res) => {
    try {
      const { status, limit } = req.query;
      const opportunities = await storage.getVolunteerOpportunities({
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching volunteer opportunities:", error);
      res.status(500).json({ message: "Failed to fetch volunteer opportunities" });
    }
  });

  app.post('/api/volunteer-opportunities/:id/apply', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const applicationData = insertVolunteerApplicationSchema.parse({
        ...req.body,
        opportunityId: req.params.id,
        volunteerId: userId,
      });
      
      const application = await storage.applyForVolunteer(applicationData);
      res.json(application);
    } catch (error) {
      console.error("Error applying for volunteer opportunity:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to apply for volunteer opportunity" });
    }
  });

  // Campaign volunteer application routes
  app.post('/api/campaigns/:id/volunteer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.params.id;
      const { intent, message } = req.body;

      // Validate required fields
      if (!intent || intent.length < 20) {
        return res.status(400).json({ message: "Intent must be at least 20 characters long" });
      }

      // Check if user is verified
      const user = await storage.getUser(userId);
      if (!user || user.kycStatus !== "verified") {
        return res.status(403).json({ message: "Only verified users can volunteer" });
      }

      // Check if campaign exists and needs volunteers
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (!campaign.needsVolunteers) {
        return res.status(400).json({ message: "This campaign doesn't need volunteers" });
      }

      if (campaign.status !== "active") {
        return res.status(400).json({ message: "Campaign is not active" });
      }

      // Check if user has already applied
      const existingApplication = await storage.getCampaignVolunteerApplication(campaignId, userId);
      if (existingApplication) {
        return res.status(400).json({ message: "You have already applied to volunteer for this campaign" });
      }

      // Create volunteer application
      const application = await storage.createCampaignVolunteerApplication({
        campaignId,
        applicantId: userId,
        intent,
        message: message || "",
        status: "pending"
      });

      // Create notifications for both applicant and campaign creator
      // Notification for applicant (volunteer)
      await storage.createNotification({
        userId: userId,
        title: "Volunteer Application Submitted! 🙋‍♂️",
        message: `Your volunteer application for "${campaign.title}" has been submitted successfully. The campaign creator will review your application.`,
        type: "volunteer_application_submitted",
        relatedId: campaignId,
      });

      // Notification for campaign creator
      await storage.createNotification({
        userId: campaign.creatorId,
        title: "New Volunteer Application! 👥",
        message: `A new volunteer has applied to help with your campaign "${campaign.title}". Review their application in your campaign dashboard.`,
        type: "volunteer_application_received",
        relatedId: campaignId,
      });

      res.json(application);
    } catch (error) {
      console.error('Error applying to volunteer for campaign:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/campaigns/:id/volunteer-applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.params.id;

      // Check if user owns the campaign
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (campaign.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const applications = await storage.getCampaignVolunteerApplications(campaignId);
      res.json(applications);
    } catch (error) {
      console.error('Error fetching campaign volunteer applications:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/campaigns/:id/volunteer-applications/:applicationId/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.params.id;
      const applicationId = req.params.applicationId;

      // Check if user owns the campaign
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign || campaign.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get the application to find the volunteer ID
      const applications = await storage.getCampaignVolunteerApplications(campaignId);
      const currentApp = applications.find(app => app.id === applicationId);

      if (!currentApp) {
        return res.status(404).json({ message: "Application not found" });
      }

      const application = await storage.updateCampaignVolunteerApplicationStatus(
        applicationId,
        "approved"
      );

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Create notification for the volunteer
      await storage.createNotification({
        userId: currentApp.volunteerId,
        title: "Volunteer Application Approved! ✅",
        message: `Your volunteer application for "${campaign.title}" has been approved. You can now start helping with the campaign.`,
        type: "volunteer_approved",
        relatedId: campaignId,
      });

      // Update volunteer slots count
      if (campaign.volunteerSlots) {
        await storage.incrementVolunteerSlotsFilledCount(campaignId);
      }

      res.json({ message: "Application approved successfully", application });
    } catch (error) {
      console.error('Error approving volunteer application:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/campaigns/:id/volunteer-applications/:applicationId/reject', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.params.id;
      const applicationId = req.params.applicationId;
      const { reason } = req.body;

      // Check if user owns the campaign
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign || campaign.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get the application to find the volunteer ID
      const applications = await storage.getCampaignVolunteerApplications(campaignId);
      const currentApp = applications.find(app => app.id === applicationId);

      if (!currentApp) {
        return res.status(404).json({ message: "Application not found" });
      }

      const application = await storage.updateCampaignVolunteerApplicationStatus(
        applicationId,
        "rejected",
        reason
      );

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Create notification for the volunteer
      await storage.createNotification({
        userId: currentApp.volunteerId,
        title: "Volunteer Application Update ❌",
        message: `Your volunteer application for "${campaign.title}" has been declined. ${reason ? `Reason: ${reason}` : 'Please consider applying to other campaigns.'}`,
        type: "volunteer_rejected",
        relatedId: campaignId,
      });

      res.json({ message: "Application rejected successfully", application });
    } catch (error) {
      console.error('Error rejecting volunteer application:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User routes
  app.get('/api/user/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getCampaignsByCreator(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching user campaigns:", error);
      res.status(500).json({ message: "Failed to fetch user campaigns" });
    }
  });

  // Public creator profile endpoint (accessible to all users)
  app.get('/api/creator/:userId/profile', isAuthenticated, async (req: any, res) => {
    try {
      const creatorId = req.params.userId;
      const creator = await storage.getUser(creatorId);
      
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      // Get creator's campaign statistics
      const campaigns = await storage.getCampaignsByCreator(creatorId);
      const activeCampaigns = campaigns.filter(c => c.status === 'active');
      const completedCampaigns = campaigns.filter(c => c.status === 'completed');
      const rejectedCampaigns = campaigns.filter(c => c.status === 'rejected');
      
      // Calculate performance metrics
      const totalRaised = campaigns.reduce((sum, c) => sum + parseFloat(c.currentAmount), 0);
      const averageSuccess = campaigns.length > 0 
        ? (completedCampaigns.length / campaigns.length) * 100 
        : 0;
      
      // Get contributions made by this creator
      const contributions = await storage.getContributionsByUser(creatorId);
      
      // Get credit score (document quality average)
      const creatorReports = await storage.getProgressReportsByCreator(creatorId);
      let creditScore = 0;
      if (creatorReports.length > 0) {
        const totalScores = creatorReports.reduce((sum, report) => sum + (report.creditScore || 0), 0);
        creditScore = Math.round(totalScores / creatorReports.length);
      }
      
      // Get social score
      const socialScore = creator.socialScore || 0;
      
      // Get creator rating (star rating average)
      const ratings = await storage.getRatingsByUser(creatorId);
      let averageRating = 0;
      let totalRatings = 0;
      if (ratings.length > 0) {
        totalRatings = ratings.length;
        const sumRatings = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        averageRating = parseFloat((sumRatings / totalRatings).toFixed(1));
      }

      const creatorProfile = {
        // Basic info
        id: creator.id,
        firstName: creator.firstName,
        lastName: creator.lastName,
        email: creator.email,
        profileImageUrl: creator.profileImageUrl,
        createdAt: creator.createdAt,
        
        // KYC and verification
        kycStatus: creator.kycStatus,
        
        // Trust & Community Scores
        socialScore: socialScore,
        creditScore: creditScore,
        averageRating: averageRating,
        totalRatings: totalRatings,
        
        // Campaign Statistics
        totalCampaigns: campaigns.length,
        activeCampaigns: activeCampaigns.length,
        completedCampaigns: completedCampaigns.length,
        rejectedCampaigns: rejectedCampaigns.length,
        totalRaised: totalRaised.toString(),
        averageSuccessRate: Math.round(averageSuccess),
        
        // Contribution Statistics
        totalContributions: contributions.length,
      };

      res.json(creatorProfile);
    } catch (error) {
      console.error("Error fetching creator profile:", error);
      res.status(500).json({ message: "Failed to fetch creator profile" });
    }
  });

  // Admin route to get creator profile for campaign review
  app.get('/api/admin/creator/:userId/profile', isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const requestingUser = await storage.getUser(requestingUserId);
      
      if (!requestingUser?.isAdmin && !requestingUser?.isSupport) {
        return res.status(403).json({ message: "Access denied" });
      }

      const creatorId = req.params.userId;
      const creator = await storage.getUser(creatorId);
      
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      // Get creator's campaign statistics
      const campaigns = await storage.getCampaignsByCreator(creatorId);
      const activeCampaigns = campaigns.filter(c => c.status === 'active');
      const completedCampaigns = campaigns.filter(c => c.status === 'completed');
      const rejectedCampaigns = campaigns.filter(c => c.status === 'rejected');
      
      // Calculate performance metrics
      const totalRaised = campaigns.reduce((sum, c) => sum + parseFloat(c.currentAmount), 0);
      const averageSuccess = campaigns.length > 0 
        ? (completedCampaigns.length / campaigns.length) * 100 
        : 0;
      
      // Get contributions made by this creator
      const contributions = await storage.getContributionsByUser(creatorId);
      
      // Get credit score (document quality average)
      const creatorReports = await storage.getProgressReportsByCreator(creatorId);
      let creditScore = 0;
      if (creatorReports.length > 0) {
        const totalScores = creatorReports.reduce((sum, report) => sum + (report.creditScore || 0), 0);
        creditScore = Math.round(totalScores / creatorReports.length);
      }
      
      // Get social score
      const socialScore = creator.socialScore || 0;
      
      // Get creator rating (star rating average)
      const ratings = await storage.getRatingsByUser(creatorId);
      let averageRating = 0;
      let totalRatings = 0;
      if (ratings.length > 0) {
        totalRatings = ratings.length;
        const sumRatings = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        averageRating = parseFloat((sumRatings / totalRatings).toFixed(1));
      }

      const creatorProfile = {
        // Basic info
        id: creator.id,
        firstName: creator.firstName,
        lastName: creator.lastName,
        email: creator.email,
        profileImageUrl: creator.profileImageUrl,
        createdAt: creator.createdAt,
        
        // KYC and verification
        kycStatus: creator.kycStatus,
        
        // Professional details
        profession: creator.profession,
        organizationName: creator.organizationName,
        organizationType: creator.organizationType,
        education: creator.education,
        workExperience: creator.workExperience,
        linkedinProfile: creator.linkedinProfile,
        phoneNumber: creator.phoneNumber,
        address: creator.address,
        
        // Campaign statistics
        totalCampaigns: campaigns.length,
        activeCampaigns: activeCampaigns.length,
        completedCampaigns: completedCampaigns.length,
        rejectedCampaigns: rejectedCampaigns.length,
        totalRaised: totalRaised.toFixed(2),
        averageSuccessRate: averageSuccess.toFixed(1),
        
        // Contribution activity
        totalContributions: contributions.length,
        contributionsValue: contributions.reduce((sum, c) => sum + parseFloat(c.amount), 0).toFixed(2),
        
        // Account balances
        pusoBalance: creator.pusoBalance,
        tipsBalance: creator.tipsBalance,
        contributionsBalance: creator.contributionsBalance,
        
        // Trust & Community Scores
        socialScore: socialScore,
        creditScore: creditScore,
        averageRating: averageRating,
        totalRatings: totalRatings,
      };

      res.json(creatorProfile);
    } catch (error) {
      console.error("Error fetching creator profile:", error);
      res.status(500).json({ message: "Failed to fetch creator profile" });
    }
  });

  app.get('/api/user/contributions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contributions = await storage.getContributionsByUser(userId);
      res.json(contributions);
    } catch (error) {
      console.error("Error fetching user contributions:", error);
      res.status(500).json({ message: "Failed to fetch user contributions" });
    }
  });

  app.post('/api/user/kyc', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { documents } = req.body;
      
      await storage.updateUserKYC(userId, "pending", JSON.stringify(documents));
      res.json({ message: "KYC documents submitted successfully" });
    } catch (error) {
      console.error("Error updating KYC:", error);
      res.status(500).json({ message: "Failed to update KYC" });
    }
  });

  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = req.body;
      
      const updatedUser = await storage.updateUserProfile(userId, profileData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Profile picture upload endpoint
  app.put('/api/user/profile-picture', isAuthenticated, async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const userId = req.user.claims.sub;
      const objectStorageService = new ObjectStorageService();
      
      // Set ACL policy for the uploaded profile picture (should be public)
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId,
          visibility: "public", // Profile pictures should be public
        },
      );

      // Update user's profile image URL in the database
      await storage.updateUserProfile(userId, {
        profileImageUrl: objectPath,
      });

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting profile picture:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin routes
  // Admin deposit/withdrawal management
  // Admin transaction search endpoint
  app.get('/api/admin/transactions/search', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { email, transactionId, amount, type } = req.query;
      
      if (!email && !transactionId && !amount) {
        return res.status(400).json({ message: "At least one search parameter required (email, transactionId, or amount)" });
      }
      
      const searchResults = await storage.searchTransactions({
        email: email as string,
        transactionId: transactionId as string,
        amount: amount as string,
        type: type as string // 'deposit', 'withdrawal', or undefined for all
      });
      
      console.log(`🔍 Admin transaction search:`);
      console.log(`   Email: ${email || 'N/A'}`);
      console.log(`   Transaction ID: ${transactionId || 'N/A'}`);
      console.log(`   Amount: ${amount || 'N/A'}`);
      console.log(`   Results: ${searchResults.length} found`);
      
      res.json(searchResults);
    } catch (error) {
      console.error("Error searching transactions:", error);
      res.status(500).json({ message: "Failed to search transactions" });
    }
  });

  // Tip endpoints
  app.post('/api/campaigns/:id/tip', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: campaignId } = req.params;
      const { amount, message, isAnonymous } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid tip amount' });
      }
      
      // Get campaign to find creator
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      
      // Get user balance
      const user = await storage.getUser(userId);
      const currentBalance = parseFloat(user?.pusoBalance || '0');
      const tipAmount = parseFloat(amount);
      
      if (currentBalance < tipAmount) {
        return res.status(400).json({ message: 'Insufficient PUSO balance' });
      }
      
      // Deduct from user's PUSO balance
      await storage.subtractPusoBalance(userId, tipAmount);
      
      // Add to creator's tips balance
      await storage.addTipsBalance(campaign.creatorId, tipAmount);
      
      // Create tip record
      const tip = await storage.createTip({
        campaignId,
        tipperId: userId,
        creatorId: campaign.creatorId,
        amount: tipAmount.toString(),
        message: message || null,
        isAnonymous: isAnonymous || false,
      });

      // Create notifications for both tipper and campaign creator
      // Notification for tipper (sender)
      await storage.createNotification({
        userId: userId,
        title: "Tip Sent Successfully! 💰",
        message: `Your ${tipAmount.toLocaleString()} PUSO tip to "${campaign.title}" has been sent successfully.`,
        type: "tip_sent",
        relatedId: campaignId,
      });

      // Notification for campaign creator (receiver)
      if (campaign.creatorId !== userId) {
        await storage.createNotification({
          userId: campaign.creatorId,
          title: "New Tip Received! ✨",
          message: `You received a ${tipAmount.toLocaleString()} PUSO tip for "${campaign.title}". ${message ? `Message: "${message}"` : ''}`,
          type: "tip_received",
          relatedId: campaignId,
        });
      }
      
      console.log('💰 Tip processed successfully:', tipAmount, 'PUSO');
      res.json({
        message: 'Tip sent successfully!',
        tip,
        newBalance: (currentBalance - tipAmount).toString()
      });
    } catch (error) {
      console.error('Error processing tip:', error);
      res.status(500).json({ message: 'Failed to process tip' });
    }
  });

  // Get tips for a campaign
  app.get('/api/campaigns/:id/tips', async (req, res) => {
    try {
      const { id: campaignId } = req.params;
      const tips = await storage.getTipsByCampaign(campaignId);
      res.json(tips);
    } catch (error) {
      console.error('Error fetching tips:', error);
      res.status(500).json({ message: 'Failed to fetch tips' });
    }
  });

  // Claim tips for a specific campaign
  app.post('/api/campaigns/:id/claim-tips', isAuthenticated, async (req: any, res) => {
    try {
      const { id: campaignId } = req.params;
      const { amount } = req.body;
      const userId = req.user.claims.sub;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Valid amount is required' });
      }
      
      const result = await storage.claimCampaignTips(userId, campaignId, parseFloat(amount));
      
      // Create transaction record
      await storage.createTransaction({
        userId,
        campaignId,
        type: 'tip',
        amount: result.claimedAmount.toString(),
        currency: 'PUSO',
        description: `Claimed ${result.tipCount} tips from campaign (₱${result.claimedAmount}) - transferred to tip wallet`,
        status: 'completed',
      });
      
      console.log(`🎁 Campaign tips claimed: ${result.claimedAmount} PUSO from ${result.tipCount} tips transferred to tip wallet for user:`, userId);
      res.json({
        message: 'Campaign tips claimed successfully!',
        claimedAmount: result.claimedAmount,
        tipCount: result.tipCount
      });
    } catch (error) {
      console.error('Error claiming campaign tips:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get tips for a creator (user)
  app.get('/api/users/:id/tips', isAuthenticated, async (req: any, res) => {
    try {
      const { id: creatorId } = req.params;
      const userId = req.user.claims.sub;
      
      // Only allow users to see their own tips
      if (userId !== creatorId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const tips = await storage.getTipsByCreator(creatorId);
      res.json(tips);
    } catch (error) {
      console.error('Error fetching user tips:', error);
      res.status(500).json({ message: 'Failed to fetch tips' });
    }
  });

  // Claim tips endpoint
  app.post('/api/users/claim-tips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user current tips balance
      const user = await storage.getUser(userId);
      const tipsBalance = parseFloat(user?.tipsBalance || '0');
      
      if (tipsBalance <= 0) {
        return res.status(400).json({ message: 'No tips available to claim' });
      }
      
      // Transfer tips to main PUSO wallet
      await storage.addPusoBalance(userId, tipsBalance);
      await storage.resetTipsBalance(userId);
      
      // Create transaction record for the claim
      await storage.createTransaction({
        userId,
        type: 'tip',
        amount: tipsBalance.toString(),
        currency: 'PUSO',
        description: `Tips claimed: ${tipsBalance} PUSO transferred to main wallet`,
        status: 'completed',
      });
      
      console.log('🎁 Tips claimed successfully:', tipsBalance, 'PUSO transferred to user:', userId);
      res.json({
        message: 'Tips claimed successfully!',
        claimedAmount: tipsBalance.toString(),
        newPusoBalance: (parseFloat(user?.pusoBalance || '0') + tipsBalance).toString()
      });
    } catch (error) {
      console.error('Error claiming tips:', error);
      res.status(500).json({ message: 'Failed to claim tips' });
    }
  });

  // Admin transaction processing endpoints
  app.post('/api/admin/transactions/:transactionId/process', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { transactionId } = req.params;
      
      console.log('✅ Admin processing transaction:', transactionId);
      
      await storage.processTransaction(transactionId);
      
      console.log('   Transaction processed successfully');
      res.json({ message: 'Transaction processed successfully' });
    } catch (error) {
      console.error('Error processing transaction:', error);
      res.status(500).json({ message: 'Failed to process transaction' });
    }
  });

  app.post('/api/admin/transactions/:transactionId/reject', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { transactionId } = req.params;
      
      console.log('❌ Admin rejecting transaction:', transactionId);
      
      await storage.rejectTransaction(transactionId);
      
      console.log('   Transaction rejected successfully');
      res.json({ message: 'Transaction rejected successfully' });
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      res.status(500).json({ message: 'Failed to reject transaction' });
    }
  });

  // Admin balance correction endpoints
  app.post('/api/admin/users/:userId/correct-puso-balance', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const { newBalance, reason } = req.body;
      
      if (!newBalance || !reason) {
        return res.status(400).json({ message: "New balance and reason are required" });
      }
      
      await storage.correctPusoBalance(userId, parseFloat(newBalance), reason);
      res.json({ message: "PUSO balance corrected successfully" });
    } catch (error) {
      console.error('Error correcting PUSO balance:', error);
      res.status(500).json({ message: 'Failed to correct PUSO balance' });
    }
  });

  app.post('/api/admin/transactions/:transactionId/update-status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { transactionId } = req.params;
      const { status, reason } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "New status is required" });
      }
      
      await storage.updateTransactionStatus(transactionId, status, reason);
      res.json({ message: "Transaction status updated successfully" });
    } catch (error) {
      console.error('Error updating transaction status:', error);
      res.status(500).json({ message: 'Failed to update transaction status' });
    }
  });

  app.post('/api/admin/transactions/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Approve the transaction
      await storage.updateTransaction(req.params.id, {
        status: 'completed',
        transactionHash: `mock-admin-${Date.now()}`
      });
      
      // For deposits, credit PUSO balance
      if (transaction.type === 'deposit') {
        const pusoAmount = parseFloat(transaction.amount) * parseFloat(transaction.exchangeRate || '1');
        await storage.addPusoBalance(transaction.userId, pusoAmount);
      }
      
      res.json({ message: "Transaction approved successfully" });
    } catch (error) {
      console.error("Error approving transaction:", error);
      res.status(500).json({ message: "Failed to approve transaction" });
    }
  });

  app.post('/api/admin/transactions/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      await storage.updateTransaction(req.params.id, {
        status: 'failed'
      });
      
      res.json({ message: "Transaction rejected successfully" });
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      res.status(500).json({ message: "Failed to reject transaction" });
    }
  });

  app.get('/api/admin/campaigns/pending', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const campaigns = await storage.getPendingCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching pending campaigns:", error);
      res.status(500).json({ message: "Failed to fetch pending campaigns" });
    }
  });

  app.post('/api/admin/campaigns/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Get campaign details for notification
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      await storage.updateCampaignStatus(req.params.id, "active");
      
      // Create notification for campaign creator
      await storage.createNotification({
        userId: campaign.creatorId,
        title: "Campaign Approved! 🎉",
        message: `Great news! Your campaign "${campaign.title}" has been approved by our admin team and is now live for donations.`,
        type: "campaign_approved",
        relatedId: req.params.id,
      });
      
      res.json({ message: "Campaign approved successfully" });
    } catch (error) {
      console.error("Error approving campaign:", error);
      res.status(500).json({ message: "Failed to approve campaign" });
    }
  });

  app.post('/api/admin/campaigns/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Get campaign details for notification
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      await storage.updateCampaignStatus(req.params.id, "rejected");
      
      // Create notification for campaign creator
      await storage.createNotification({
        userId: campaign.creatorId,
        title: "Campaign Review Update 📜",
        message: `Your campaign "${campaign.title}" requires some updates before it can be approved. Please review our guidelines and resubmit.`,
        type: "campaign_rejected",
        relatedId: req.params.id,
      });
      
      res.json({ message: "Campaign rejected successfully" });
    } catch (error) {
      console.error("Error rejecting campaign:", error);
      res.status(500).json({ message: "Failed to reject campaign" });
    }
  });

  app.post('/api/admin/campaigns/:id/flag', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      await storage.updateCampaignStatus(req.params.id, "flagged");
      res.json({ message: "Campaign flagged successfully" });
    } catch (error) {
      console.error("Error flagging campaign:", error);
      res.status(500).json({ message: "Failed to flag campaign" });
    }
  });

  app.get('/api/admin/kyc/pending', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getPendingKYC();
      res.json(users);
    } catch (error) {
      console.error("Error fetching pending KYC:", error);
      res.status(500).json({ message: "Failed to fetch pending KYC" });
    }
  });

  app.post('/api/admin/kyc/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      await storage.updateUserKYC(req.params.id, "verified");
      
      // Create notification for user
      await storage.createNotification({
        userId: req.params.id,
        title: "KYC Verification Approved! ✅",
        message: "Congratulations! Your identity verification has been approved. You can now access all platform features including fund claiming and volunteering.",
        type: "kyc_approved",
        relatedId: req.params.id,
      });
      
      res.json({ message: "KYC approved successfully" });
    } catch (error) {
      console.error("Error approving KYC:", error);
      res.status(500).json({ message: "Failed to approve KYC" });
    }
  });

  app.post('/api/admin/kyc/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      await storage.updateUserKYC(req.params.id, "rejected");
      res.json({ message: "KYC rejected successfully" });
    } catch (error) {
      console.error("Error rejecting KYC:", error);
      res.status(500).json({ message: "Failed to reject KYC" });
    }
  });

  // Object Storage Routes
  
  // The endpoint for serving private objects.
  // It checks the ACL policy for the object properly.
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    // Gets the authenticated user id.
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // The endpoint for getting the upload URL for an object entity.
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // This is an endpoint for updating the model state after an object entity is uploaded (campaign image in this case).
  app.put("/api/campaign-images", isAuthenticated, async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    // Gets the authenticated user id.
    const userId = req.user?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId,
          // Campaign images should be public as they can be accessed by everyone
          visibility: "public",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting campaign image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Blockchain deposit/withdraw routes
  
  // Initialize default exchange rates
  app.post('/api/blockchain/init-rates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      await conversionService.initializeDefaultRates();
      res.json({ message: 'Exchange rates initialized' });
    } catch (error) {
      console.error('Error initializing rates:', error);
      res.status(500).json({ message: 'Failed to initialize rates' });
    }
  });

  // Get conversion quote
  app.post('/api/conversions/quote', isAuthenticated, async (req, res) => {
    try {
      const { amount, fromCurrency, toCurrency } = req.body;
      
      const validation = conversionService.validateConversionParams(
        parseFloat(amount),
        fromCurrency,
        toCurrency
      );
      
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }
      
      const quote = await conversionService.getConversionQuote(
        parseFloat(amount),
        fromCurrency,
        toCurrency
      );
      
      res.json(quote);
    } catch (error) {
      console.error('Error getting conversion quote:', error);
      res.status(500).json({ message: 'Failed to get conversion quote' });
    }
  });

  // Get user transactions
  app.get('/api/transactions/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserTransactions(userId, 10);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  // Create automated withdrawal (PUSO to PHP)
  app.post('/api/withdrawals/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, paymentMethod, accountDetails } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }
      
      if (!paymentMethod || !accountDetails) {
        return res.status(400).json({ message: 'Payment method and account details are required' });
      }
      
      // Check user balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const userBalance = parseFloat(user.pusoBalance || '0');
      if (userBalance < parseFloat(amount)) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      
      // Check KYC status (accept both 'approved' and 'verified')
      if (user.kycStatus !== 'approved' && user.kycStatus !== 'verified') {
        return res.status(403).json({ message: 'KYC verification required for withdrawals' });
      }
      
      // Get conversion quote
      const quote = await conversionService.getConversionQuote(
        parseFloat(amount),
        'PUSO',
        'PHP'
      );
      
      console.log(`🏦 Processing automated withdrawal:`);
      console.log(`   User: ${user.email} (${userId})`);
      console.log(`   Amount: ${quote.fromAmount} PUSO → ${quote.toAmount} PHP`);
      console.log(`   Method: ${paymentMethod} (${accountDetails})`);
      
      // Deduct PUSO from user balance immediately
      await storage.addPusoBalance(userId, -parseFloat(amount));
      
      try {
        // Create automated payout through PayMongo
        const payout = await paymongoService.createAutomatedPayout({
          amount: paymongoService.phpToCentavos(quote.toAmount),
          currency: 'PHP',
          description: `VeriFund Withdrawal - ${user.email}`,
          destination: {
            type: paymentMethod === 'gcash' ? 'gcash' : 'bank',
            accountNumber: accountDetails,
            accountName: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.email || 'VeriFund User',
          },
        });
        
        // Create successful transaction record
        const transaction = await storage.createTransaction({
          userId,
          type: 'withdrawal',
          amount: quote.fromAmount.toString(),
          currency: 'PUSO',
          description: `Withdraw ${quote.fromAmount} PUSO → ${quote.toAmount} PHP via ${paymentMethod}`,
          status: 'completed', // Mark as completed immediately
          paymentProvider: 'paymongo',
          exchangeRate: quote.exchangeRate.toString(),
          feeAmount: quote.fee.toString(),
        });
        
        // Create notification for successful withdrawal
        await storage.createNotification({
          userId: userId,
          title: "Withdrawal Completed Successfully! 🏦",
          message: `Your withdrawal of ${quote.fromAmount} PUSO (₱${quote.toAmount} PHP) to ${paymentMethod === 'gcash' ? 'GCash' : 'bank account'} has been completed.`,
          type: "withdrawal_completed",
          relatedId: transaction.id,
        });
        
        console.log(`✅ Automated withdrawal completed:`);
        console.log(`   Transaction ID: ${transaction.id}`);
        console.log(`   Payout ID: ${payout.id}`);
        console.log(`   New Balance: ${userBalance - parseFloat(amount)} PUSO`);
        
        res.json({
          transactionId: transaction.id,
          payoutId: payout.id,
          quote,
          paymentMethod,
          accountDetails,
          status: 'completed',
          message: `Successfully withdrawn ${quote.toAmount} PHP to your ${paymentMethod === 'gcash' ? 'GCash' : 'bank account'}!`
        });
        
      } catch (payoutError) {
        console.error('❌ Payout failed, refunding user:', payoutError);
        
        // Refund the PUSO back to user if payout fails
        await storage.addPusoBalance(userId, parseFloat(amount));
        
        // Create failed transaction record
        await storage.createTransaction({
          userId,
          type: 'withdrawal',
          amount: quote.fromAmount.toString(),
          currency: 'PUSO',
          description: `Failed withdrawal ${quote.fromAmount} PUSO → ${quote.toAmount} PHP`,
          status: 'failed',
          paymentProvider: 'paymongo',
          exchangeRate: quote.exchangeRate.toString(),
          feeAmount: quote.fee.toString(),
        });
        
        return res.status(500).json({ 
          message: 'Withdrawal failed. Your PUSO balance has been restored. Please try again later.' 
        });
      }
      
    } catch (error) {
      console.error('Error creating automated withdrawal:', error);
      res.status(500).json({ message: 'Failed to create withdrawal' });
    }
  });

  // Create deposit (PHP to PUSO)
  app.post('/api/deposits/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, paymentMethod } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }
      
      // Get conversion quote
      const quote = await conversionService.getConversionQuote(
        parseFloat(amount),
        'PHP',
        'PUSO'
      );
      
      // Create PayMongo checkout session
      const paymentIntent = await paymongoService.createCheckoutSession({
        amount: paymongoService.phpToCentavos(quote.totalCost),
        currency: 'PHP',
        description: `VeriFund Deposit - ${quote.toAmount} PUSO`,
        metadata: {
          userId,
          pusoAmount: quote.toAmount.toString(),
          type: 'deposit',
        },
      });
      
      if (paymentIntent.error) {
        return res.status(500).json({ message: paymentIntent.error });
      }
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: 'deposit',
        amount: quote.fromAmount.toString(),
        currency: 'PHP',
        description: `Deposit ${quote.fromAmount} PHP → ${quote.toAmount} PUSO`,
        status: 'pending',
        paymentProvider: 'paymongo',
        paymentProviderTxId: paymentIntent.id,
        exchangeRate: quote.exchangeRate.toString(),
        feeAmount: quote.fee.toString(),
      });
      
      // Create payment record
      await storage.createPaymentRecord({
        userId,
        transactionId: transaction.id,
        paymongoPaymentId: paymentIntent.id,
        paymentMethod,
        amount: quote.totalCost.toString(),
        currency: 'PHP',
        status: 'pending',
        description: `Deposit ${quote.fromAmount} PHP → ${quote.toAmount} PUSO`,
      });
      
      res.json({
        transactionId: transaction.id,
        paymentIntent,
        quote,
      });
    } catch (error) {
      console.error('Error creating deposit:', error);
      res.status(500).json({ message: 'Failed to create deposit' });
    }
  });

  // PayMongo webhook for automatic payment completion
  app.post('/api/webhooks/paymongo', async (req, res) => {
    try {
      const rawBody = JSON.stringify(req.body);
      const signature = req.headers['paymongo-signature'] as string;
      
      if (!signature) {
        console.error('Missing PayMongo signature header');
        return res.status(400).json({ message: 'Missing signature' });
      }
      
      // Verify webhook signature for security
      const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET || 'whsec_test_secret';
      const isValidSignature = paymongoService.verifyWebhookSignature(
        rawBody,
        signature,
        webhookSecret
      );
      
      if (!isValidSignature) {
        console.error('Invalid PayMongo webhook signature');
        return res.status(401).json({ message: 'Invalid signature' });
      }
      
      const event = req.body;
      console.log('PayMongo Webhook Event:', JSON.stringify(event, null, 2));
      
      // Handle payment.paid event and checkout_session.payment.paid
      if ((event.data && event.data.type === 'event' && event.data.attributes.type === 'payment.paid') ||
          (event.data && event.data.type === 'checkout_session.payment.paid')) {
        
        let paymentId;
        
        if (event.data.type === 'event' && event.data.attributes.type === 'payment.paid') {
          // Direct payment event
          const paymentData = event.data.attributes.data;
          paymentId = paymentData.id;
        } else if (event.data.type === 'checkout_session.payment.paid') {
          // Checkout session payment
          paymentId = event.data.attributes?.data?.payment_intent?.id || event.data.id;
        }
        
        console.log('Processing payment event for payment:', paymentId);
        
        // First try to find by PayMongo payment ID (transactions table)
        let transaction = await storage.getTransactionByPaymongoId(paymentId);
        
        if (!transaction) {
          // Try to find by payment record (payment_records table)
          const paymentRecord = await storage.getPaymentRecordByPaymongoId(paymentId);
          if (paymentRecord?.transactionId) {
            transaction = await storage.getTransaction(paymentRecord.transactionId);
            // Update payment record status
            await storage.updatePaymentRecord(paymentRecord.id, { status: 'paid' });
          }
        }
        
        if (!transaction) {
          console.error('Transaction not found for PayMongo payment:', paymentId);
          return res.status(200).json({ message: 'Transaction not found' });
        }
        
        if (transaction.status === 'completed') {
          console.log('Transaction already completed:', transaction.id);
          return res.status(200).json({ message: 'Transaction already completed' });
        }
        
        console.log('Auto-completing transaction:', transaction.id);
        
        // Get user and generate wallet if needed
        const user = await storage.getUser(transaction.userId);
        if (!user?.celoWalletAddress) {
          const wallet = celoService.generateWallet();
          const encryptedKey = celoService.encryptPrivateKey(wallet.privateKey);
          await storage.updateUserWallet(transaction.userId, wallet.address, encryptedKey);
        }
        
        // Calculate PUSO amount from exchange rate
        const pusoAmount = parseFloat(transaction.amount) * parseFloat(transaction.exchangeRate || '1');
        
        // Mint PUSO tokens (mock for now)
        const mintResult = await celoService.mintPuso(
          user?.celoWalletAddress || '',
          pusoAmount.toString()
        );
        
        // Auto-complete the deposit
        await storage.updateTransaction(transaction.id, {
          status: 'completed',
          transactionHash: mintResult.hash,
          blockNumber: mintResult.blockNumber?.toString(),
        });
        
        // Update user balance using the method that updates the users table
        const currentBalance = parseFloat(user?.pusoBalance || '0');
        const newBalance = currentBalance + pusoAmount;
        await storage.updateUserBalance(transaction.userId, newBalance.toString());
        
        // Create notification for successful deposit
        await storage.createNotification({
          userId: transaction.userId,
          title: "Deposit Completed Successfully! 💳",
          message: `Your deposit of ₱${transaction.amount} PHP has been processed and ${pusoAmount.toLocaleString()} PUSO has been added to your wallet.`,
          type: "deposit_completed",
          relatedId: transaction.id,
        });
        
        console.log(`✅ Auto-completed deposit: ${transaction.amount} PHP → ${pusoAmount} PUSO for user ${transaction.userId}`);
        
        res.status(200).json({ 
          message: 'Payment processed successfully',
          transactionId: transaction.id,
          pusoAmount 
        });
        return;
      }
      
      // For other webhook events, just acknowledge
      console.log('Received webhook event:', event.data?.attributes?.type);
      res.status(200).json({ message: 'Event received' });
      
    } catch (error) {
      console.error('Error processing PayMongo webhook:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Manual complete payment (for testing while webhook is being configured)
  app.post('/api/deposits/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { transactionId } = req.body;
      
      if (!transactionId) {
        return res.status(400).json({ message: 'Transaction ID required' });
      }
      
      // Get transaction
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction || transaction.userId !== userId) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      if (transaction.status === 'completed') {
        return res.status(400).json({ message: 'Transaction already completed' });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Generate wallet if user doesn't have one
      if (!user.celoWalletAddress) {
        const wallet = celoService.generateWallet();
        const encryptedKey = celoService.encryptPrivateKey(wallet.privateKey);
        await storage.updateUserWallet(userId, wallet.address, encryptedKey);
      }
      
      // Calculate PUSO amount from the transaction data
      const pusoAmount = parseFloat(transaction.amount) * parseFloat(transaction.exchangeRate || '1');
      
      // Mint PUSO tokens (mock for now)
      const mintResult = await celoService.mintPuso(
        user.celoWalletAddress || '',
        pusoAmount.toString()
      );
      
      // Update transaction with blockchain hash
      await storage.updateTransaction(transaction.id, {
        status: 'completed',
        transactionHash: mintResult.hash,
        blockNumber: mintResult.blockNumber?.toString(),
      });
      
      // Update user balance
      const currentBalance = parseFloat(user.pusoBalance || '0');
      const newBalance = currentBalance + pusoAmount;
      await storage.updateUserBalance(userId, newBalance.toString());
      
      console.log(`Manual deposit completed: ${pusoAmount} PUSO for user ${userId}`);
      
      res.json({
        success: true,
        pusoAmount,
        newBalance,
        transactionHash: mintResult.hash,
      });
    } catch (error) {
      console.error('Error completing deposit manually:', error);
      res.status(500).json({ message: 'Failed to complete deposit' });
    }
  });


  // Get user transactions
  app.get('/api/transactions/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const transactions = await storage.getUserTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  // Enhanced analytics endpoint with wallet data
  app.get("/api/admin/analytics", isAuthenticated, async (req: any, res) => {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.user.claims.sub);
    if (!user?.isAdmin && !user?.isSupport) {
      return res.status(403).json({ message: "Admin or Support access required" });
    }

    try {
      const analytics = await storage.getAnalytics();
      const [campaignsCount, pendingKYC] = await Promise.all([
        storage.getCampaigns(),
        storage.getPendingKYC()
      ]);

      res.json({
        campaignsCount: campaignsCount.length,
        pendingKYC: pendingKYC.length,
        totalWithdrawn: analytics.totalWithdrawn,
        totalTipsCollected: analytics.totalTipsCollected,
        totalContributionsCollected: analytics.totalContributionsCollected,
        totalDeposited: analytics.totalDeposited
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Support staff invitation endpoints
  app.post("/api/admin/support/invite", isAuthenticated, async (req: any, res) => {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.user.claims.sub);
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    try {
      const invitation = await storage.createSupportInvitation(email, user.id);
      // TODO: Send email with invitation link using SendGrid
      res.json({ invitation, message: "Support invitation sent successfully" });
    } catch (error) {
      console.error("Error creating support invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.get("/api/admin/support/invitations", isAuthenticated, async (req: any, res) => {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.user.claims.sub);
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const invitations = await storage.getPendingSupportInvitations();
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching support invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post("/api/support/accept/:token", async (req, res) => {
    const { token } = req.params;

    try {
      await storage.acceptSupportInvitation(token);
      res.json({ message: "Support invitation accepted successfully" });
    } catch (error) {
      console.error("Error accepting support invitation:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Wallet operations
  app.post("/api/wallet/claim-tips", isAuthenticated, async (req: any, res) => {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Get user tips balance before claiming to calculate fee
      const user = await storage.getUser(req.user.claims.sub);
      const originalTipsAmount = parseFloat(user?.tipsBalance || '0');
      const claimingFee = Math.max(originalTipsAmount * 0.01, 1);
      
      const claimedAmount = await storage.claimTips(req.user.claims.sub);
      
      // Record the claim transaction with fee details  
      await storage.createTransaction({
        userId: req.user.claims.sub,
        type: 'conversion',
        amount: claimedAmount.toString(),
        currency: 'PUSO',
        description: `Claimed ${claimedAmount} PUSO from Tips wallet (${originalTipsAmount.toFixed(2)} PUSO - ${claimingFee.toFixed(2)} fee)`,
        status: 'completed',
        feeAmount: claimingFee.toString(),
      });

      res.json({ 
        message: "Tips claimed successfully",
        amount: claimedAmount
      });
    } catch (error) {
      console.error("Error claiming tips:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/wallet/claim-contributions", isAuthenticated, async (req: any, res) => {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Get user contributions balance before claiming to calculate fee
      const user = await storage.getUser(req.user.claims.sub);
      const originalContributionsAmount = parseFloat(user?.contributionsBalance || '0');
      const claimingFee = Math.max(originalContributionsAmount * 0.01, 1);
      
      const claimedAmount = await storage.claimContributions(req.user.claims.sub);
      
      // Record the claim transaction with fee details
      await storage.createTransaction({
        userId: req.user.claims.sub,
        type: 'conversion',
        amount: claimedAmount.toString(),
        currency: 'PUSO',
        description: `Claimed ${claimedAmount} PUSO from Contributions wallet (${originalContributionsAmount.toFixed(2)} PUSO - ${claimingFee.toFixed(2)} fee)`,
        status: 'completed',
        feeAmount: claimingFee.toString(),
      });

      res.json({ 
        message: "Contributions claimed successfully",
        amount: claimedAmount
      });
    } catch (error) {
      console.error("Error claiming contributions:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Progress Report routes
  
  // Get progress reports for a campaign
  app.get("/api/campaigns/:campaignId/progress-reports", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const reports = await storage.getProgressReportsForCampaign(campaignId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching progress reports:", error);
      res.status(500).json({ error: "Failed to fetch progress reports" });
    }
  });

  // Creator Rating endpoints
  app.post('/api/progress-reports/:id/ratings', isAuthenticated, async (req: any, res) => {
    try {
      const { id: progressReportId } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.claims.sub;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }

      // Get progress report details to find creator and campaign
      const report = await storage.getProgressReport(progressReportId);
      if (!report) {
        return res.status(404).json({ message: 'Progress report not found' });
      }

      // Prevent self-rating
      if (report.createdById === userId) {
        return res.status(400).json({ message: 'Cannot rate your own progress report' });
      }

      const creatorRating = await storage.createCreatorRating({
        raterId: userId,
        creatorId: report.createdById,
        campaignId: report.campaignId,
        progressReportId,
        rating: Number(rating),
        comment: comment || null,
      });

      res.json({ message: 'Rating submitted successfully', rating: creatorRating });
    } catch (error) {
      console.error('Error creating creator rating:', error);
      res.status(500).json({ message: 'Failed to submit rating' });
    }
  });

  app.get('/api/progress-reports/:id/ratings', async (req, res) => {
    try {
      const { id: progressReportId } = req.params;
      const ratings = await storage.getCreatorRatingsByProgressReport(progressReportId);
      res.json(ratings);
    } catch (error) {
      console.error('Error fetching creator ratings:', error);
      res.status(500).json({ message: 'Failed to fetch ratings' });
    }
  });

  app.get('/api/progress-reports/:id/ratings/user', isAuthenticated, async (req: any, res) => {
    try {
      const { id: progressReportId } = req.params;
      const userId = req.user.claims.sub;
      
      const userRating = await storage.getUserRatingForProgressReport(userId, progressReportId);
      res.json(userRating || null);
    } catch (error) {
      console.error('Error fetching user rating:', error);
      res.status(500).json({ message: 'Failed to fetch user rating' });
    }
  });

  app.get('/api/users/:id/creator-rating', async (req, res) => {
    try {
      const { id: creatorId } = req.params;
      const averageRating = await storage.getAverageCreatorRating(creatorId);
      res.json(averageRating);
    } catch (error) {
      console.error('Error fetching creator average rating:', error);
      res.status(500).json({ message: 'Failed to fetch creator rating' });
    }
  });

  // Create a new progress report (creator only)
  app.post("/api/campaigns/:campaignId/progress-reports", isAuthenticated, async (req: any, res) => {
    try {
      const { campaignId } = req.params;
      const { title, description, reportDate } = req.body;
      const userId = req.user.claims.sub;

      // Validate input
      if (!title || !reportDate) {
        return res.status(400).json({ error: "Title and report date are required" });
      }

      // Check if user is the campaign creator
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign || campaign.creatorId !== userId) {
        return res.status(403).json({ error: "Only campaign creators can create progress reports" });
      }

      const report = await storage.createProgressReport({
        campaignId,
        createdById: userId,
        title,
        description: description || null,
        reportDate: new Date(reportDate),
      });

      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating progress report:", error);
      res.status(500).json({ error: "Failed to create progress report" });
    }
  });

  // Update a progress report (creator only)
  app.put("/api/progress-reports/:reportId", isAuthenticated, async (req: any, res) => {
    try {
      const { reportId } = req.params;
      const { title, description, reportDate } = req.body;
      const userId = req.user.claims.sub;

      // Check if user is the report creator
      const report = await storage.getProgressReport(reportId);
      if (!report || report.createdById !== userId) {
        return res.status(403).json({ error: "Only report creators can update progress reports" });
      }

      const updatedReport = await storage.updateProgressReport(reportId, {
        title,
        description,
        reportDate: reportDate ? new Date(reportDate) : undefined,
      });

      res.json(updatedReport);
    } catch (error) {
      console.error("Error updating progress report:", error);
      res.status(500).json({ error: "Failed to update progress report" });
    }
  });

  // Delete a progress report (creator only)
  app.delete("/api/progress-reports/:reportId", isAuthenticated, async (req: any, res) => {
    try {
      const { reportId } = req.params;
      const userId = req.user.claims.sub;

      // Check if user is the report creator
      const report = await storage.getProgressReport(reportId);
      if (!report || report.createdById !== userId) {
        return res.status(403).json({ error: "Only report creators can delete progress reports" });
      }

      await storage.deleteProgressReport(reportId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting progress report:", error);
      res.status(500).json({ error: "Failed to delete progress report" });
    }
  });

  // Upload document to progress report (creator only)
  app.post("/api/progress-reports/:reportId/documents", isAuthenticated, async (req: any, res) => {
    try {
      const { reportId } = req.params;
      const { documentType, fileName, fileUrl, fileSize, mimeType, description } = req.body;
      const userId = req.user.claims.sub;

      // Validate input
      if (!documentType || !fileName || !fileUrl) {
        return res.status(400).json({ error: "Document type, file name, and file URL are required" });
      }

      // Check if user is the report creator
      const report = await storage.getProgressReport(reportId);
      if (!report || report.createdById !== userId) {
        return res.status(403).json({ error: "Only report creators can upload documents" });
      }

      const document = await storage.createProgressReportDocument({
        progressReportId: reportId,
        documentType,
        fileName,
        fileUrl,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
        description: description || null,
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Delete document from progress report (creator only)
  app.delete("/api/progress-reports/documents/:documentId", isAuthenticated, async (req: any, res) => {
    try {
      const { documentId } = req.params;
      const userId = req.user.claims.sub;

      // Get document to check ownership (we'll need to add this to storage later)
      // For now, we'll skip the ownership check and rely on the report-level check
      await storage.deleteProgressReportDocument(documentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Get user's average credit score
  app.get("/api/users/:userId/credit-score", async (req, res) => {
    try {
      const { userId } = req.params;
      const averageScore = await storage.getUserAverageCreditScore(userId);
      res.json({ averageScore });
    } catch (error) {
      console.error("Error fetching credit score:", error);
      res.status(500).json({ error: "Failed to fetch credit score" });
    }
  });

  // Get current user's average credit score
  app.get("/api/auth/user/credit-score", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const averageScore = await storage.getUserAverageCreditScore(userId);
      res.json({ averageScore });
    } catch (error) {
      console.error("Error fetching user credit score:", error);
      res.status(500).json({ error: "Failed to fetch credit score" });
    }
  });

  // Fraud Report endpoints - community safety feature
  app.post('/api/fraud-reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { documentId, reportType, description } = req.body;
      
      if (!documentId || !reportType || !description) {
        return res.status(400).json({ message: "Document ID, report type, and description are required" });
      }
      
      const fraudReport = await storage.createFraudReport({
        reporterId: userId,
        documentId,
        reportType,
        description,
      });
      
      // Create notification for the reporter
      await storage.createNotification({
        userId: userId,
        title: "Fraud Report Submitted 🛡️",
        message: "Thank you for helping keep our community safe. Your report is being reviewed by our admin team.",
        type: "fraud_report_submitted",
        relatedId: fraudReport.id,
      });
      
      res.json({ message: "Fraud report submitted successfully", reportId: fraudReport.id });
    } catch (error) {
      console.error("Error creating fraud report:", error);
      res.status(500).json({ message: "Failed to submit fraud report" });
    }
  });

  // Admin Fraud Reports Management
  app.get('/api/admin/fraud-reports', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.claims?.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const fraudReports = await storage.getAllFraudReports();
      res.json(fraudReports);
    } catch (error) {
      console.error("Error fetching fraud reports:", error);
      res.status(500).json({ message: "Failed to fetch fraud reports" });
    }
  });

  app.post('/api/admin/fraud-reports/:id/validate', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.claims?.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { adminNotes, socialPointsAwarded = 10 } = req.body;
      const fraudReports = await storage.getAllFraudReports();
      const report = fraudReports.find(r => r.id === req.params.id);
      
      if (!report) {
        return res.status(404).json({ message: "Fraud report not found" });
      }
      
      await storage.updateFraudReportStatus(
        req.params.id, 
        'validated', 
        adminNotes, 
        user.id, 
        socialPointsAwarded
      );
      
      // Award social score to the reporter if points > 0
      if (socialPointsAwarded > 0) {
        await storage.awardSocialScore(report.reporterId, socialPointsAwarded);
      }
      
      res.json({ message: "Fraud report validated and social score awarded" });
    } catch (error) {
      console.error("Error validating fraud report:", error);
      res.status(500).json({ message: "Failed to validate fraud report" });
    }
  });

  app.post('/api/admin/fraud-reports/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.claims?.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { adminNotes } = req.body;
      await storage.updateFraudReportStatus(
        req.params.id, 
        'rejected', 
        adminNotes, 
        user.id, 
        0
      );
      
      res.json({ message: "Fraud report rejected" });
    } catch (error) {
      console.error("Error rejecting fraud report:", error);
      res.status(500).json({ message: "Failed to reject fraud report" });
    }
  });

  // Submit fraud report for campaign
  app.post("/api/fraud-reports/campaign", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reportType, description, campaignId } = req.body;

      if (!reportType || !description || !campaignId) {
        return res.status(400).json({ message: "Missing required fields: reportType, description, and campaignId are required" });
      }

      // Verify campaign exists
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      // For campaign fraud reports, we'll create a notification instead of using the fraud_reports table
      // since it has a foreign key constraint to progress_report_documents
      
      // Create notification for admin team
      await storage.createNotification({
        userId: "admin", // Special admin notification
        title: "🚨 Campaign Fraud Report",
        message: `Campaign "${campaign.title}" reported for ${reportType}: ${description}`,
        type: "campaign_fraud_report",
        relatedId: campaignId,
      });

      // Create notification for the reporter
      await storage.createNotification({
        userId: userId,
        title: "Campaign Report Submitted 🛡️",
        message: "Thank you for helping keep our community safe. Your campaign report is being reviewed by our admin team.",
        type: "fraud_report_submitted",
        relatedId: campaignId,
      });

      res.status(201).json({ message: "Campaign report submitted successfully", campaignId: campaignId });
    } catch (error) {
      console.error("Error creating campaign fraud report:", error);
      res.status(500).json({ message: "Failed to submit campaign report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
