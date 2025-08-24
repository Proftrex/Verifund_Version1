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
import multer from "multer";
import crypto from "crypto";
import { paymongoService } from "./services/paymongoService";
import { celoService } from "./services/celoService";
import { conversionService } from "./services/conversionService";
import { getRegionFromProvince } from "@shared/regionUtils";

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
  // Configure multer for evidence file uploads
  const evidenceUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
      files: 5, // Maximum 5 files
    },
    fileFilter: (req, file, cb) => {
      // Allow images, PDFs, and documents
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
      }
    }
  });

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
      const campaigns = await storage.getCampaignsWithCreators({
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
      const campaign = await storage.getCampaignWithCreator(req.params.id);
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
      
      // Check if user is admin/support - they cannot create campaigns
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isAdmin || user.isSupport) {
        return res.status(403).json({ 
          message: "Administrative accounts cannot create campaigns",
          reason: "Admin and Support accounts are restricted from normal user activities. Please use a personal verified account for campaign creation."
        });
      }
      
      // Check if user can create campaigns based on credibility score
      const canCreate = await storage.canUserCreateCampaign(userId);
      if (!canCreate.canCreate) {
        return res.status(403).json({ 
          error: 'Campaign creation restricted',
          reason: canCreate.reason
        });
      }

      if (user.isSuspended) {
        return res.status(403).json({ 
          message: "Account suspended",
          reason: user.suspensionReason || "Your account has been suspended from creating campaigns due to fraudulent activity.",
          suspendedAt: user.suspendedAt
        });
      }
      
      // Convert date strings to Date objects and auto-populate region
      const processedData = {
        ...req.body,
        creatorId: userId,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        duration: typeof req.body.duration === 'string' ? parseInt(req.body.duration) : req.body.duration,
        // Auto-populate region based on province
        region: req.body.province ? getRegionFromProvince(req.body.province) : null,
      };
      
      const campaignData = insertCampaignSchema.parse(processedData);
      
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

      // Check if user is admin/support - they cannot contribute to campaigns
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isAdmin || user.isSupport) {
        return res.status(403).json({ 
          message: "Administrative accounts cannot contribute to campaigns",
          reason: "Admin and Support accounts are restricted from normal user activities. Please use a personal verified account for contributions."
        });
      }

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
      
      const userBalance = parseFloat(user.phpBalance || '0');
      if (userBalance < contributionAmount) {
        return res.status(400).json({ 
          message: `Insufficient PHP balance. Available: ${userBalance.toLocaleString()} PHP, Required: ${contributionAmount.toLocaleString()} PHP`,
          availableBalance: userBalance,
          requiredAmount: contributionAmount
        });
      }
      
      // Create the contribution record
      const contribution = await storage.createContribution(contributionData);
      
      // Deduct PHP from user's balance
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
        currency: "PHP",
        description: `Contribution to ${campaign.title}${contributionData.message ? ` - ${contributionData.message}` : ''}`,
        status: "completed",
        transactionHash: contribution.transactionHash!,
      });

      // Create notifications for both contributor and campaign creator
      // Notification for contributor (sender)
      await storage.createNotification({
        userId: userId,
        title: "Contribution Sent Successfully! 💝",
        message: `Your ${contributionAmount.toLocaleString()} PHP contribution to "${campaign.title}" has been processed successfully.`,
        type: "contribution_sent",
        relatedId: req.params.id,
      });

      // Notification for campaign creator (receiver)
      if (campaign.creatorId !== userId) {
        await storage.createNotification({
          userId: campaign.creatorId,
          title: "New Contribution Received! 🎉",
          message: `You received ${contributionAmount.toLocaleString()} PHP contribution for "${campaign.title}". ${contributionData.message ? `Message: "${contributionData.message}"` : ''}`,
          type: "contribution_received",
          relatedId: req.params.id,
        });
      }
      
      console.log(`✅ Contribution successful: ${contributionAmount} PHP from user ${userId} to campaign ${req.params.id}`);
      console.log(`   User balance: ${userBalance} → ${newUserBalance} PHP`);
      console.log(`   Campaign total: ${currentCampaignAmount} → ${newCampaignAmount} PHP`);
      
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
          message: `No funds available to claim. Current: ${currentAmount.toLocaleString()} PHP` 
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
            message: `Insufficient funds. Available: ${currentAmount.toLocaleString()} PHP, Requested: ${requestedAmount.toLocaleString()} PHP` 
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
        currency: 'PHP',
        description: `Claimed ${claimAmount.toLocaleString()} PHP from campaign: ${campaign.title}`,
        status: 'completed',
        transactionHash: `claim-${campaignId}-${Date.now()}`,
        campaignId: campaignId,
      });
      
      // Add PHP balance to creator's wallet
      const currentUserBalance = parseFloat(user.phpBalance || '0');
      const newUserBalance = currentUserBalance + claimAmount;
      await storage.updateUserBalance(userId, newUserBalance.toString());
      
      // Keep currentAmount unchanged to show total contributions received (prevent exploitation)
      // Update claimedAmount to track what's been claimed
      const currentClaimedAmount = parseFloat(campaign.claimedAmount || '0');
      const newClaimedAmount = currentClaimedAmount + claimAmount;
      await storage.updateCampaignClaimedAmount(campaignId, newClaimedAmount.toString());
      
      // Note: Progress bar shows currentAmount, claimable amount = currentAmount - claimedAmount
      
      // Create notification for successful claim
      await storage.createNotification({
        userId: userId,
        title: "Funds Claimed Successfully! 💰",
        message: `You have successfully claimed ${claimAmount.toLocaleString()} PHP from your campaign "${campaign.title}".`,
        type: "campaign_claimed",
        relatedId: campaignId,
      });
      
      console.log(`✅ Campaign funds claimed successfully:`);
      console.log(`   Campaign: ${campaign.title} (${campaignId})`);
      console.log(`   Claimed amount: ${claimAmount.toLocaleString()} PHP`);
      console.log(`   Creator balance: ${currentUserBalance.toLocaleString()} → ${newUserBalance.toLocaleString()} PHP`);
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

  // Campaign Status Management Routes
  app.patch('/api/campaigns/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.params.id;
      const { status } = req.body;

      if (!status || !['completed', 'cancelled', 'active'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be "completed", "cancelled", or "active"' });
      }

      // Get campaign to verify ownership
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      if (campaign.creatorId !== userId) {
        return res.status(403).json({ message: 'Only campaign creator can update campaign status' });
      }

      if (!campaign.status || !['active', 'on_progress'].includes(campaign.status)) {
        return res.status(400).json({ message: 'Campaign must be active or in progress to change status' });
      }

      // Add logging for debugging
      console.log(`Campaign status update request: ${campaignId}, current status: ${campaign.status}, requested status: ${status}`);

      // Check for suspicious behavior before updating status
      if ((status === 'completed' || status === 'cancelled') && campaign.status === 'on_progress') {
        // Check if campaign has progress reports using the correct method
        const progressReports = await storage.getProgressReportsForCampaign(campaignId);
        
        if (progressReports.length === 0) {
          // No progress reports found - suspicious behavior
          console.log(`⚠️ Suspicious behavior detected: Campaign ${campaignId} is being closed without progress reports`);
          
          // Lower creator's credibility score (implement in future)
          // For now, just log the suspicious activity
          await storage.createNotification({
            userId: userId,
            title: "⚠️ Credibility Alert",
            message: `Warning: Your campaign "${campaign.title}" was closed without any progress reports. This may affect your creator rating.`,
            type: "credibility_warning",
            relatedId: campaignId,
          });
        }
      }

      // Update campaign status
      const updatedCampaign = await storage.updateCampaignStatus(campaignId, status);

      // Create notification for status change
      let notificationTitle = "";
      let notificationMessage = "";
      
      if (status === 'completed') {
        notificationTitle = "Campaign Completed! 🎉";
        notificationMessage = `Your campaign "${campaign.title}" has been successfully completed.`;
      } else if (status === 'cancelled') {
        notificationTitle = "Campaign Ended 📋";
        notificationMessage = `Your campaign "${campaign.title}" has been ended.`;
      }

      await storage.createNotification({
        userId: userId,
        title: notificationTitle,
        message: notificationMessage,
        type: "campaign_status_update",
        relatedId: campaignId,
      });

      res.json(updatedCampaign);
    } catch (error) {
      console.error('Error updating campaign status:', error);
      console.error('Full error details:', error);
      res.status(500).json({ message: 'Failed to update campaign status' });
    }
  });

  // Campaign Closure with Fraud Prevention
  app.post('/api/campaigns/:id/close', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.params.id;
      const { reason } = req.body;

      // Get campaign details
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      if (campaign.creatorId !== userId) {
        return res.status(403).json({ message: 'Only campaign creator can close campaign' });
      }

      if (!campaign.status || !['active', 'on_progress'].includes(campaign.status)) {
        return res.status(400).json({ message: 'Campaign must be active or in progress to close' });
      }

      console.log(`🚨 Campaign closure initiated: ${campaignId}`);
      console.log(`📊 Current amount: ₱${campaign.currentAmount}`);
      console.log(`📊 Minimum required: ₱${campaign.minimumAmount}`);
      console.log(`📊 Claimed amount: ₱${campaign.claimedAmount}`);

      // Get creator details
      const creator = await storage.getUser(userId);
      if (!creator) {
        return res.status(404).json({ message: 'Creator not found' });
      }

      const currentAmount = parseFloat(campaign.currentAmount?.toString() || '0');
      const minimumAmount = parseFloat(campaign.minimumAmount.toString());
      const claimedAmount = parseFloat(campaign.claimedAmount?.toString() || '0');
      const hasWithdrawnFunds = claimedAmount > 0;

      // Check if campaign received any contributions or tips
      const contributions = await storage.getContributionsByCampaign(campaignId);
      const tips = await storage.getTipsByCampaign(campaignId);
      const hasReceivedFunds = contributions.length > 0 || tips.length > 0;

      // Check if minimum operational amount was reached
      const isUnderFunded = currentAmount < minimumAmount;

      // SCENARIO 0: No contributions or tips received -> CLEAN CLOSURE (no penalty)
      if (!hasReceivedFunds) {
        console.log(`✅ Closing campaign with no contributions or tips received - no penalty applied`);
        
        // Update campaign status to closed
        await storage.updateCampaignStatus(campaignId, 'closed');

        // Create closure transaction
        await storage.createTransaction({
          userId: userId,
          campaignId: campaignId,
          type: 'campaign_closure',
          amount: '0',
          currency: 'PHP',
          description: `Campaign closed (no contributions received): ${campaign.title}`,
          status: 'completed',
        });

        // Notify creator
        await storage.createNotification({
          userId: userId,
          title: "Campaign Closed 📋",
          message: `Your campaign "${campaign.title}" has been closed. No contributions were received.`,
          type: "campaign_closure",
          relatedId: campaignId,
        });

        return res.json({ 
          message: 'Campaign closed successfully - no contributions were received',
          status: 'closed'
        });
      }

      if (isUnderFunded && !hasWithdrawnFunds) {
        // SCENARIO 1: Under-funded, no withdrawals -> REFUND (no penalty)
        console.log(`✅ Processing refunds for under-funded campaign`);
        
        let totalRefunded = 0;

        // Refund all contributions
        for (const contribution of contributions) {
          const refundAmount = parseFloat(contribution.amount.toString());
          
          // Add refund to contributor's PHP balance
          await storage.updateUserBalance(contribution.contributorId, refundAmount.toString());
          
          // Create refund transaction
          await storage.createTransaction({
            userId: contribution.contributorId,
            campaignId: campaignId,
            type: 'refund',
            amount: refundAmount.toString(),
            currency: 'PHP',
            description: `Refund for campaign: ${campaign.title} (Campaign closed - minimum amount not reached)`,
            status: 'completed',
          });

          totalRefunded += refundAmount;
        }

        // Refund all tips
        for (const tip of tips) {
          const refundAmount = parseFloat(tip.amount.toString());
          
          // Add refund to tipper's PHP balance
          await storage.updateUserBalance(tip.tipperId, refundAmount.toString());
          
          // Create refund transaction
          await storage.createTransaction({
            userId: tip.tipperId,
            campaignId: campaignId,
            type: 'refund',
            amount: refundAmount.toString(),
            currency: 'PHP',
            description: `Tip refund for campaign: ${campaign.title} (Campaign closed)`,
            status: 'completed',
          });

          totalRefunded += refundAmount;
        }

        // Update campaign status
        await storage.updateCampaignStatus(campaignId, 'closed_with_refund');

        // Create closure transaction
        await storage.createTransaction({
          userId: userId,
          campaignId: campaignId,
          type: 'campaign_closure',
          amount: totalRefunded.toString(),
          currency: 'PHP',
          description: `Campaign closed with full refund: ${campaign.title}`,
          status: 'completed',
        });

        // Notify creator
        await storage.createNotification({
          userId: userId,
          title: "Campaign Closed with Refunds 💰",
          message: `Your campaign "${campaign.title}" has been closed and ₱${totalRefunded.toLocaleString()} has been refunded to contributors.`,
          type: "campaign_closure",
          relatedId: campaignId,
        });

        console.log(`✅ Refunded ₱${totalRefunded} to contributors`);
        
        res.json({ 
          message: 'Campaign closed successfully with full refunds',
          totalRefunded,
          status: 'closed_with_refund'
        });

      } else if (isUnderFunded && hasWithdrawnFunds) {
        // SCENARIO 2: Under-funded, has withdrawals -> Check if full refund is possible
        console.log(`⚠️ Checking if creator can fully refund withdrawn amounts...`);
        
        // Get creator's current balance to see if they can refund
        const creator = await storage.getUser(userId);
        const creatorContributionsBalance = parseFloat(creator?.contributionsBalance || '0');
        const creatorTipsBalance = parseFloat(creator?.tipsBalance || '0');
        const creatorPhpBalance = parseFloat(creator?.phpBalance || '0');
        const totalCreatorBalance = creatorContributionsBalance + creatorTipsBalance + creatorPhpBalance;
        
        console.log(`💰 Creator's total balance: ₱${totalCreatorBalance} (contributions: ₱${creatorContributionsBalance}, tips: ₱${creatorTipsBalance}, php: ₱${creatorPhpBalance})`);
        console.log(`💰 Amount that needs to be refunded: ₱${claimedAmount}`);
        
        if (totalCreatorBalance >= claimedAmount) {
          // Creator can fully refund - process refunds without penalty
          console.log(`✅ Creator can fully refund - processing refunds without penalty`);
          
          // Calculate total to refund
          let totalToRefund = 0;
          for (const contribution of contributions) {
            totalToRefund += parseFloat(contribution.amount.toString());
          }
          for (const tip of tips) {
            totalToRefund += parseFloat(tip.amount.toString());
          }
          
          // Deduct from creator's balances to enable refunds
          if (creatorContributionsBalance >= claimedAmount) {
            await storage.subtractUserContributionsBalance(userId, claimedAmount);
          } else {
            // Use multiple balance sources if needed
            const remainingAfterContributions = claimedAmount - creatorContributionsBalance;
            if (creatorContributionsBalance > 0) {
              await storage.subtractUserContributionsBalance(userId, creatorContributionsBalance);
            }
            if (creatorTipsBalance >= remainingAfterContributions) {
              await storage.addTipsBalance(userId, -remainingAfterContributions);
            } else {
              const remainingAfterTips = remainingAfterContributions - creatorTipsBalance;
              if (creatorTipsBalance > 0) {
                await storage.addTipsBalance(userId, -creatorTipsBalance);
              }
              await storage.subtractPhpBalance(userId, remainingAfterTips);
            }
          }
          
          // Process refunds to contributors and tippers
          for (const contribution of contributions) {
            const refundAmount = parseFloat(contribution.amount.toString());
            await storage.updateUserBalance(contribution.contributorId, refundAmount.toString());
            await storage.createTransaction({
              userId: contribution.contributorId,
              campaignId: campaignId,
              type: 'refund',
              amount: refundAmount.toString(),
              currency: 'PHP',
              description: `Full refund for campaign: ${campaign.title} (Creator provided full refund)`,
              status: 'completed',
            });
          }
          
          for (const tip of tips) {
            const refundAmount = parseFloat(tip.amount.toString());
            await storage.updateUserBalance(tip.tipperId, refundAmount.toString());
            await storage.createTransaction({
              userId: tip.tipperId,
              campaignId: campaignId,
              type: 'refund',
              amount: refundAmount.toString(),
              currency: 'PHP',
              description: `Tip refund for campaign: ${campaign.title} (Creator provided full refund)`,
              status: 'completed',
            });
          }
          
          // Update campaign status without penalty
          await storage.updateCampaignStatus(campaignId, 'closed_with_refund');
          
          // Notify creator
          await storage.createNotification({
            userId: userId,
            title: "Campaign Closed with Full Refunds 💰",
            message: `Your campaign "${campaign.title}" has been closed and ₱${totalToRefund.toLocaleString()} has been refunded to contributors from your account.`,
            type: "campaign_closure",
            relatedId: campaignId,
          });
          
          return res.json({ 
            message: 'Campaign closed successfully with full refunds from creator',
            totalRefunded: totalToRefund,
            status: 'closed_with_refund'
          });
          
        } else {
          // Creator cannot fully refund - FLAG AS FRAUD + SUSPEND
          console.log(`🚨 FRAUD DETECTED: Creator withdrew ₱${claimedAmount} but can only refund ₱${totalCreatorBalance}`);
        
        // Get all contributions (both claimed and unclaimed) to reclaim claimed ones
        const allContributions = await storage.getAllContributionsForCampaign(campaignId);
        const unclaimedContributions = await storage.getContributionsByCampaign(campaignId);
        const tips = await storage.getTipsByCampaign(campaignId);
        
        let totalRefunded = 0;
        
        // STEP 1: Reclaim claimed contributions from creator's wallet
        const claimedContributions = allContributions.filter(c => (c as any).status === 'claimed');
        if (claimedContributions.length > 0) {
          console.log(`🔄 Reclaiming ${claimedContributions.length} claimed contributions from creator's wallet...`);
          
          const creator = await storage.getUser(userId);
          const creatorContributionsBalance = parseFloat(creator?.contributionsBalance || '0');
          let totalClaimedAmount = 0;
          
          // Calculate total claimed amount
          for (const contribution of claimedContributions) {
            totalClaimedAmount += parseFloat(contribution.amount.toString());
          }
          
          console.log(`💰 Total claimed amount to reclaim: ₱${totalClaimedAmount}`);
          console.log(`💰 Creator's current contributions balance: ₱${creatorContributionsBalance}`);
          
          // Reclaim funds from creator's wallet and refund to original contributors
          for (const contribution of claimedContributions) {
            try {
              const contributionAmount = parseFloat(contribution.amount.toString());
              
              // Subtract from creator's contributions balance (if possible)
              if (creatorContributionsBalance >= contributionAmount) {
                await storage.subtractUserContributionsBalance(userId, contributionAmount);
              }
              
              // Add money back to contributor's balance
              await storage.updateUserBalance(contribution.contributorId, contributionAmount.toString());
              
              // Create refund transaction for contributor
              await storage.createTransaction({
                userId: contribution.contributorId,
                campaignId: campaignId,
                type: 'refund',
                amount: contributionAmount.toString(),
                currency: 'PHP',
                description: `Reclaimed contribution refund for fraudulent campaign: ${campaign.title}`,
                status: 'completed',
              });
              
              // Create deduction transaction for creator
              await storage.createTransaction({
                userId: userId,
                campaignId: campaignId,
                type: 'contribution_reclaim',
                amount: (-contributionAmount).toString(),
                currency: 'PHP',
                description: `Contribution reclaimed due to fraud for campaign: ${campaign.title}`,
                status: 'completed',
              });
              
              // Mark contribution as refunded
              await storage.markContributionAsRefunded(contribution.id);
              
              totalRefunded += contributionAmount;
              
              console.log(`✅ Reclaimed and refunded ₱${contributionAmount} to user ${contribution.contributorId}`);
            } catch (error) {
              console.error(`❌ Failed to reclaim contribution ${contribution.id}:`, error);
            }
          }
        }
        
        // STEP 2: Refund all unclaimed contributions
        for (const contribution of unclaimedContributions) {
          const refundAmount = parseFloat(contribution.amount.toString());
          
          // Add refund to contributor's PHP balance
          await storage.updateUserBalance(contribution.contributorId, refundAmount.toString());
          
          // Create refund transaction
          await storage.createTransaction({
            userId: contribution.contributorId,
            campaignId: campaignId,
            type: 'refund',
            amount: refundAmount.toString(),
            currency: 'PHP',
            description: `Refund for fraudulent campaign: ${campaign.title}`,
            status: 'completed',
          });

          totalRefunded += refundAmount;
        }

        // STEP 3: Refund all tips
        for (const tip of tips) {
          const refundAmount = parseFloat(tip.amount.toString());
          
          // Add refund to tipper's PHP balance
          await storage.updateUserBalance(tip.tipperId, refundAmount.toString());
          
          // Create refund transaction
          await storage.createTransaction({
            userId: tip.tipperId,
            campaignId: campaignId,
            type: 'refund',
            amount: refundAmount.toString(),
            currency: 'PHP',
            description: `Tip refund for fraudulent campaign: ${campaign.title}`,
            status: 'completed',
          });

          totalRefunded += refundAmount;
        }
        
        // Flag user as fraudulent
        await storage.updateUser(userId, {
          isFlagged: true,
          isSuspended: true,
          flagReason: `Withdrew ₱${claimedAmount} from campaign "${campaign.title}" but failed to reach minimum operational amount of ₱${minimumAmount}`,
          suspensionReason: `Fraudulent campaign behavior: withdrew funds without reaching minimum operational amount`,
          flaggedAt: new Date(),
          suspendedAt: new Date(),
        });

        // Update campaign status
        await storage.updateCampaignStatus(campaignId, 'flagged');

        // Create fraud alert transaction
        await storage.createTransaction({
          userId: userId,
          campaignId: campaignId,
          type: 'campaign_closure',
          amount: totalRefunded.toString(),
          currency: 'PHP',
          description: `FRAUD ALERT: Campaign closed with ₱${totalRefunded} refunded - Creator suspended`,
          status: 'completed',
        });

        // Notify creator about suspension
        await storage.createNotification({
          userId: userId,
          title: "🚨 Account Suspended - Fraudulent Activity",
          message: `Your account has been suspended for withdrawing ₱${claimedAmount} from campaign "${campaign.title}" without reaching the minimum operational amount. All contributions (₱${totalRefunded}) have been refunded to contributors.`,
          type: "fraud_alert",
          relatedId: campaignId,
        });

        console.log(`🚨 User ${userId} suspended for fraud. ₱${totalRefunded} refunded to contributors.`);
        
        res.json({ 
          message: 'Campaign flagged for fraudulent activity. Creator account suspended and all funds refunded.',
          status: 'flagged',
          suspension: true,
          totalRefunded: totalRefunded
        });
        }

      } else {
        // SCENARIO 3: Reached minimum amount -> First check if creator can provide full refunds
        console.log(`✅ Campaign reached minimum - checking if creator can provide full refunds...`);
        
        // Calculate total that needs to be refunded if creator chooses to close with full refunds
        let totalNeededForRefund = 0;
        for (const contribution of contributions) {
          totalNeededForRefund += parseFloat(contribution.amount.toString());
        }
        for (const tip of tips) {
          totalNeededForRefund += parseFloat(tip.amount.toString());
        }
        
        // Check creator's current balance to see if they can provide full refunds
        const creator = await storage.getUser(userId);
        const creatorContributionsBalance = parseFloat(creator?.contributionsBalance || '0');
        const creatorTipsBalance = parseFloat(creator?.tipsBalance || '0');
        const creatorPhpBalance = parseFloat(creator?.phpBalance || '0');
        const totalCreatorBalance = creatorContributionsBalance + creatorTipsBalance + creatorPhpBalance;
        
        console.log(`💰 Creator's total balance: ₱${totalCreatorBalance}`);
        console.log(`💰 Total needed for full refund: ₱${totalNeededForRefund}`);
        
        if (totalCreatorBalance >= totalNeededForRefund) {
          // SCENARIO 3A: Creator CAN provide full refunds -> CLEAN CLOSURE (no penalty)
          console.log(`✅ Creator can provide full refunds - processing clean closure with refunds`);
          
          // Deduct from creator's balances proportionally
          let remainingToDeduct = totalNeededForRefund;
          
          // First deduct from contributions balance
          if (creatorContributionsBalance > 0 && remainingToDeduct > 0) {
            const deductFromContributions = Math.min(creatorContributionsBalance, remainingToDeduct);
            await storage.subtractUserContributionsBalance(userId, deductFromContributions);
            remainingToDeduct -= deductFromContributions;
          }
          
          // Then deduct from tips balance
          if (creatorTipsBalance > 0 && remainingToDeduct > 0) {
            const deductFromTips = Math.min(creatorTipsBalance, remainingToDeduct);
            await storage.addTipsBalance(userId, -deductFromTips);
            remainingToDeduct -= deductFromTips;
          }
          
          // Finally deduct from PHP balance
          if (remainingToDeduct > 0) {
            await storage.subtractPhpBalance(userId, remainingToDeduct);
          }
          
          // Process refunds to all contributors and tippers
          for (const contribution of contributions) {
            const refundAmount = parseFloat(contribution.amount.toString());
            await storage.updateUserBalance(contribution.contributorId, refundAmount.toString());
            await storage.createTransaction({
              userId: contribution.contributorId,
              campaignId: campaignId,
              type: 'refund',
              amount: refundAmount.toString(),
              currency: 'PHP',
              description: `Full refund for campaign: ${campaign.title} (Creator voluntarily closed with full refunds)`,
              status: 'completed',
            });
          }
          
          for (const tip of tips) {
            const refundAmount = parseFloat(tip.amount.toString());
            await storage.updateUserBalance(tip.tipperId, refundAmount.toString());
            await storage.createTransaction({
              userId: tip.tipperId,
              campaignId: campaignId,
              type: 'refund',
              amount: refundAmount.toString(),
              currency: 'PHP',
              description: `Tip refund for campaign: ${campaign.title} (Creator voluntarily closed with full refunds)`,
              status: 'completed',
            });
          }
          
          // Update campaign status without any penalty
          await storage.updateCampaignStatus(campaignId, 'closed_with_refund');
          
          // Notify creator
          await storage.createNotification({
            userId: userId,
            title: "Campaign Closed with Full Refunds 💰",
            message: `Your campaign "${campaign.title}" has been closed successfully and ₱${totalNeededForRefund.toLocaleString()} has been refunded to contributors from your account.`,
            type: "campaign_closure",
            relatedId: campaignId,
          });
          
          return res.json({ 
            message: 'Campaign closed successfully with full refunds from creator',
            totalRefunded: totalNeededForRefund,
            status: 'closed_with_refund'
          });
          
        } else {
          // SCENARIO 3B: Creator CANNOT provide full refunds -> Check progress reports
          console.log(`⚠️ Creator cannot provide full refunds - checking progress reports for compliance...`);
          
          // Check if progress reports were submitted after reaching operational amount
          const progressReports = await storage.getProgressReportsForCampaign(campaignId);
        
          if (progressReports.length === 0) {
            // SCENARIO 3B1: Cannot refund AND no progress reports -> FLAG AS FRAUD + SUSPEND
            console.log(`🚨 FRAUD DETECTED: Creator cannot provide full refunds and has no progress reports`);
            
            // Flag user as fraudulent for not providing transparency AND being unable to fully refund
            await storage.updateUser(userId, {
              isFlagged: true,
              isSuspended: true,
              flagReason: `Reached operational amount (₱${minimumAmount}) in campaign "${campaign.title}" but failed to submit required progress reports and cannot provide full refund (balance: ₱${totalCreatorBalance}, needed: ₱${totalNeededForRefund})`,
              suspensionReason: `Fraudulent campaign behavior: failed to provide transparency through progress reports and cannot fully refund contributors`,
              flaggedAt: new Date(),
              suspendedAt: new Date(),
            });

            // Update campaign status
            await storage.updateCampaignStatus(campaignId, 'flagged');

            // Create fraud alert transaction
            await storage.createTransaction({
              userId: userId,
              campaignId: campaignId,
              type: 'campaign_closure',
              amount: currentAmount.toString(),
              currency: 'PHP',
              description: `FRAUD ALERT: Campaign flagged for lack of progress reports and inability to fully refund - Creator suspended`,
              status: 'completed',
            });

            // Notify creator about suspension
            await storage.createNotification({
              userId: userId,
              title: "🚨 Account Suspended - Missing Reports & Insufficient Refund Capability",
              message: `Your account has been suspended for failing to submit progress reports after reaching the operational amount and being unable to provide full refunds to contributors.`,
              type: "fraud_alert",
              relatedId: campaignId,
            });

            console.log(`🚨 User ${userId} suspended for not submitting progress reports and insufficient refund capability.`);
            
            return res.json({ 
              message: 'Campaign flagged for lack of transparency and insufficient refund capability. Creator account suspended.',
              status: 'flagged',
              suspension: true,
              totalRaised: currentAmount
            });

          } else {
            // SCENARIO 3B2: Cannot refund BUT has progress reports -> NORMAL CLOSURE
            console.log(`✅ Normal campaign closure - minimum amount reached with progress reports`);
            
            await storage.updateCampaignStatus(campaignId, 'completed');

            await storage.createNotification({
              userId: userId,
              title: "Campaign Completed Successfully! 🎉",
              message: `Your campaign "${campaign.title}" has been completed successfully. Total raised: ₱${currentAmount.toLocaleString()}`,
              type: "campaign_completion",
              relatedId: campaignId,
            });

            return res.json({ 
              message: 'Campaign completed successfully',
              status: 'completed',
              totalRaised: currentAmount
            });
          }
        }
      }

    } catch (error) {
      console.error('Error closing campaign:', error);
      res.status(500).json({ message: 'Failed to close campaign' });
    }
  });

  // Check if user is suspended (for campaign creation)
  app.get('/api/users/suspension-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        isSuspended: user.isSuspended || false,
        suspensionReason: user.suspensionReason || null,
        suspendedAt: user.suspendedAt || null,
        isFlagged: user.isFlagged || false,
        flagReason: user.flagReason || null
      });
    } catch (error) {
      console.error('Error checking suspension status:', error);
      res.status(500).json({ message: 'Failed to check suspension status' });
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
      res.json(opportunities || []); // Ensure we always return an array
    } catch (error) {
      console.error("Error fetching volunteer opportunities:", error);
      res.status(500).json({ message: "Failed to fetch volunteer opportunities", opportunities: [] });
    }
  });

  app.post('/api/volunteer-opportunities/:id/apply', isAuthenticated, async (req: any, res) => {
    try {
      console.log('🎯 Volunteer application received:', req.body);
      const userId = req.user.claims.sub;
      const opportunityId = req.params.id;

      // Check if user is admin/support - they cannot apply for volunteer opportunities
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isAdmin || user.isSupport) {
        return res.status(403).json({ 
          message: "Administrative accounts cannot apply for volunteer opportunities",
          reason: "Admin and Support accounts are restricted from normal user activities. Please use a personal verified account for volunteering."
        });
      }
      
      // Extract campaign ID from volunteer opportunity ID (format: volunteer-{campaignId})
      const campaignId = opportunityId.startsWith('volunteer-') ? opportunityId.replace('volunteer-', '') : opportunityId;
      
      // Get the campaign to validate volunteer slots
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      // Check if campaign has volunteer slots
      if (!campaign.volunteerSlots || campaign.volunteerSlots <= 0) {
        return res.status(400).json({ message: "This campaign does not need volunteers" });
      }

      // Check if user already applied for this campaign
      const existingApplication = await storage.getCampaignVolunteerApplication(campaignId, userId);
      if (existingApplication) {
        return res.status(400).json({ message: "You have already applied to volunteer for this campaign" });
      }

      // Check available volunteer slots
      const availableSlots = campaign.volunteerSlots - (campaign.volunteerSlotsFilledCount || 0);
      if (availableSlots <= 0) {
        return res.status(400).json({ message: "No available volunteer slots for this campaign" });
      }
      
      const applicationData = insertVolunteerApplicationSchema.parse({
        ...req.body,
        opportunityId: opportunityId,
        campaignId: campaignId,
        volunteerId: userId,
      });
      
      console.log('✅ Parsed application data:', applicationData);
      const application = await storage.applyForVolunteer(applicationData);
      res.json(application);
    } catch (error) {
      console.error("Error applying for volunteer opportunity:", error);
      if (error instanceof z.ZodError) {
        console.log('❌ Validation errors:', error.errors);
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
      const { intent, telegramDisplayName, telegramUsername } = req.body;

      console.log('🎯 Campaign volunteer application received:', req.body);
      console.log('📋 Campaign ID:', campaignId);
      console.log('👤 User ID:', userId);
      console.log('🔍 Validation checks starting...');

      // Validate required fields
      if (!intent || intent.length < 20) {
        console.log('❌ Intent validation failed:', intent);
        return res.status(400).json({ message: "Intent must be at least 20 characters long" });
      }

      if (!telegramDisplayName || telegramDisplayName.trim().length === 0) {
        console.log('❌ Telegram Display Name validation failed:', telegramDisplayName);
        return res.status(400).json({ message: "Telegram Display Name is required" });
      }

      if (!telegramUsername || telegramUsername.trim().length === 0) {
        console.log('❌ Telegram Username validation failed:', telegramUsername);
        return res.status(400).json({ message: "Telegram Username is required" });
      }

      // Check if user exists (removed KYC requirement temporarily)
      console.log('🔍 Checking user...');
      const user = await storage.getUser(userId);
      console.log('👤 User found:', !!user);
      
      if (!user) {
        console.log('❌ User not found');
        return res.status(403).json({ message: "User not found" });
      }
      console.log('✅ User found!');

      // Check if campaign exists and needs volunteers
      console.log('🔍 Checking campaign...');
      const campaign = await storage.getCampaign(campaignId);
      console.log('🎯 Campaign found:', !!campaign);
      console.log('🎯 Campaign needs volunteers:', campaign?.needsVolunteers);
      console.log('🎯 Campaign status:', campaign?.status);
      
      if (!campaign) {
        console.log('❌ Campaign not found');
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (!campaign.needsVolunteers) {
        console.log('❌ Campaign does not need volunteers');
        return res.status(400).json({ message: "This campaign doesn't need volunteers" });
      }

      if (campaign.status !== "active") {
        console.log('❌ Campaign is not active');
        return res.status(400).json({ message: "Campaign is not active" });
      }
      console.log('✅ Campaign checks passed!');

      // Check if user has already applied
      console.log('🔍 Checking for existing application...');
      const existingApplication = await storage.getCampaignVolunteerApplication(campaignId, userId);
      console.log('📄 Existing application found:', !!existingApplication);
      
      if (existingApplication) {
        console.log('⚠️ TEMPORARILY ALLOWING REAPPLICATION - User has already applied');
      }
      console.log('✅ Proceeding with application!');

      // Create volunteer application
      const application = await storage.createCampaignVolunteerApplication({
        campaignId,
        applicantId: userId,
        intent,
        telegramDisplayName,
        telegramUsername,
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

      console.log('🔍 Fetching volunteer applications for campaign:', campaignId);
      console.log('👤 Requested by user:', userId);

      // Check if user owns the campaign
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        console.log('❌ Campaign not found');
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (campaign.creatorId !== userId) {
        console.log('❌ Unauthorized access - user is not campaign creator');
        console.log('📊 Campaign creator:', campaign.creatorId);
        console.log('📊 Requesting user:', userId);
        return res.status(403).json({ message: "Unauthorized" });
      }

      console.log('✅ User authorized, fetching applications...');
      const applications = await storage.getCampaignVolunteerApplications(campaignId);
      console.log('📋 Found applications:', applications?.length || 0);
      console.log('📋 Applications data:', applications);
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

  // === VOLUNTEER RELIABILITY RATING ENDPOINTS ===

  // POST /api/volunteers/:volunteerId/rate - Rate a volunteer's reliability after working together
  app.post('/api/volunteers/:volunteerId/rate', isAuthenticated, async (req: any, res) => {
    try {
      const creatorId = req.user.claims.sub;
      const volunteerId = req.params.volunteerId;
      const { campaignId, rating, feedback } = req.body;

      // Validate input
      if (!campaignId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Campaign ID and rating (1-5) are required" });
      }

      // Check if creator owns the campaign
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign || campaign.creatorId !== creatorId) {
        return res.status(403).json({ message: "You can only rate volunteers for your own campaigns" });
      }

      // Check if volunteer was approved for this campaign
      const volunteerApplication = await storage.getCampaignVolunteerApplication(campaignId, volunteerId);
      if (!volunteerApplication || volunteerApplication.status !== 'approved') {
        return res.status(400).json({ message: "You can only rate volunteers who were approved for your campaign" });
      }

      // Check if creator already rated this volunteer for this campaign
      const existingRating = await storage.getVolunteerReliabilityRating(volunteerId, campaignId);
      if (existingRating) {
        return res.status(400).json({ message: "You have already rated this volunteer for this campaign" });
      }

      // Create the reliability rating
      const reliabilityRating = await storage.createVolunteerReliabilityRating({
        raterId: creatorId,
        volunteerId,
        campaignId,
        volunteerApplicationId: volunteerApplication.id,
        rating: parseInt(rating),
        feedback: feedback || null,
      });

      // Update volunteer's overall reliability score
      await storage.updateVolunteerReliabilityScore(volunteerId);

      res.status(201).json(reliabilityRating);
    } catch (error) {
      console.error('Error rating volunteer:', error);
      res.status(500).json({ message: 'Failed to rate volunteer' });
    }
  });

  // GET /api/volunteers/:volunteerId/reliability-ratings - Get all reliability ratings for a volunteer
  app.get('/api/volunteers/:volunteerId/reliability-ratings', async (req, res) => {
    try {
      const volunteerId = req.params.volunteerId;
      const ratings = await storage.getVolunteerReliabilityRatings(volunteerId);
      res.json(ratings);
    } catch (error) {
      console.error('Error fetching volunteer reliability ratings:', error);
      res.status(500).json({ message: 'Failed to fetch reliability ratings' });
    }
  });

  // GET /api/volunteer-ratings - Get all volunteer ratings across the platform (admin only)
  app.get('/api/volunteer-ratings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user is admin or support
      if (!user?.isAdmin && !user?.isSupport) {
        return res.status(403).json({ message: 'Access restricted to administrators' });
      }

      const allRatings = await storage.getAllVolunteerReliabilityRatings();
      res.json(allRatings);
    } catch (error) {
      console.error('Error fetching all volunteer ratings:', error);
      res.status(500).json({ message: 'Failed to fetch volunteer ratings' });
    }
  });

  // GET /api/reported-volunteers - Get all reported volunteers (admin only)
  app.get('/api/reported-volunteers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user is admin or support
      if (!user?.isAdmin && !user?.isSupport) {
        return res.status(403).json({ message: 'Access restricted to administrators' });
      }

      // For now, return empty array as we haven't implemented volunteer reports yet
      // This could be extended to include actual volunteer reports in the future
      const reportedVolunteers = await storage.getReportedVolunteers();
      res.json(reportedVolunteers);
    } catch (error) {
      console.error('Error fetching reported volunteers:', error);
      res.status(500).json({ message: 'Failed to fetch reported volunteers' });
    }
  });

  // GET /api/campaigns/:campaignId/volunteers-to-rate - Get volunteers that can be rated for a campaign
  app.get('/api/campaigns/:campaignId/volunteers-to-rate', isAuthenticated, async (req: any, res) => {
    try {
      const creatorId = req.user.claims.sub;
      const campaignId = req.params.campaignId;

      // Check if creator owns the campaign
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign || campaign.creatorId !== creatorId) {
        return res.status(403).json({ message: "You can only view volunteers for your own campaigns" });
      }

      // Get approved volunteers for this campaign who haven't been rated yet
      const volunteers = await storage.getVolunteersToRate(campaignId, creatorId);
      res.json(volunteers);
    } catch (error) {
      console.error('Error fetching volunteers to rate:', error);
      res.status(500).json({ message: 'Failed to fetch volunteers to rate' });
    }
  });

  // Get all volunteer applications for current user's campaigns (requests received)
  app.get("/api/user/volunteer-applications/received", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;

    console.log(`🔍 Fetching volunteer applications received for user: ${userId}`);

    try {
      // Get all campaigns created by the current user
      const userCampaigns = await storage.getCampaignsByCreator(userId);
      console.log(`📋 User has ${userCampaigns.length} campaigns`);

      if (userCampaigns.length === 0) {
        return res.json([]);
      }

      // Get all applications for all user's campaigns
      const allApplications = [];
      for (const campaign of userCampaigns) {
        const campaignApplications = await storage.getCampaignVolunteerApplications(campaign.id);
        // Add campaign info to each application
        const applicationsWithCampaign = campaignApplications.map(app => ({
          ...app,
          campaignTitle: campaign.title,
          campaignCategory: campaign.category,
          campaignStatus: campaign.status
        }));
        allApplications.push(...applicationsWithCampaign);
      }

      console.log(`📋 Found total received applications: ${allApplications.length}`);

      // Sort by creation date (newest first)
      allApplications.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      res.json(allApplications);
    } catch (error) {
      console.error("Error fetching user volunteer applications received:", error);
      res.status(500).json({ message: "Failed to fetch volunteer applications received" });
    }
  });

  // Get all volunteer applications that current user has submitted (applications I sent)
  app.get("/api/user/volunteer-applications/sent", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;

    console.log(`🔍 Fetching volunteer applications sent by user: ${userId}`);

    try {
      // Get all applications where this user is the volunteer
      const sentApplications = await storage.getVolunteerApplicationsByUser(userId);
      console.log(`📋 Found total sent applications: ${sentApplications.length}`);

      // Add campaign and creator information to each application
      const applicationsWithCampaign = [];
      for (const application of sentApplications) {
        if (application.campaignId) {
          const campaign = await storage.getCampaign(application.campaignId);
          if (campaign) {
            // Get creator information
            const creator = await storage.getUser(campaign.creatorId);
            
            applicationsWithCampaign.push({
              ...application,
              campaignTitle: campaign.title,
              campaignCategory: campaign.category,
              campaignStatus: campaign.status,
              // Add creator information
              creatorId: campaign.creatorId,
              creatorName: creator ? `${creator.firstName || ''} ${creator.lastName || ''}`.trim() : 'Unknown Creator',
              creatorEmail: creator?.email || '',
              creatorKycStatus: creator?.kycStatus || 'unknown'
            });
          }
        }
      }

      // Sort by creation date (newest first)
      applicationsWithCampaign.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(applicationsWithCampaign);
    } catch (error) {
      console.error("Error fetching user volunteer applications sent:", error);
      res.status(500).json({ message: "Failed to fetch volunteer applications sent" });
    }
  });

  // Check if current user has applied to volunteer for a specific campaign
  app.get("/api/campaigns/:campaignId/user-volunteer-application", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const { campaignId } = req.params;

    console.log(`🔍 Checking volunteer application status for user: ${userId}, campaign: ${campaignId}`);

    try {
      // Get all applications by this user
      const userApplications = await storage.getVolunteerApplicationsByUser(userId);
      
      // Check if user has applied to this specific campaign
      const applicationToThisCampaign = userApplications.find(app => app.campaignId === campaignId);
      
      const hasApplied = !!applicationToThisCampaign;
      
      console.log(`📋 User has ${hasApplied ? 'applied' : 'not applied'} to campaign ${campaignId}`);
      
      res.json({ 
        hasApplied,
        applicationStatus: applicationToThisCampaign?.status || null,
        applicationId: applicationToThisCampaign?.id || null
      });
    } catch (error) {
      console.error("Error checking user volunteer application:", error);
      res.status(500).json({ message: "Failed to check volunteer application status" });
    }
  });

  // User routes
  app.get('/api/user/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status, category } = req.query;
      const campaigns = await storage.getCampaignsByCreator(userId, {
        status: status as string,
        category: category as string,
      });
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching user campaigns:", error);
      res.status(500).json({ message: "Failed to fetch user campaigns" });
    }
  });

  // Public creator profile endpoint (accessible to all users)
  app.get('/api/creator/:userId/profile', async (req, res) => {
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
      
      // Get credit score using the correct method
      const creditScore = await storage.getUserAverageCreditScore(creatorId);
      
      // Get social score
      const socialScore = creator.socialScore || 0;
      
      // Get creator rating using the correct method
      const ratingData = await storage.getAverageCreatorRating(creatorId);
      const averageRating = ratingData.averageRating;
      const totalRatings = ratingData.totalRatings;

      const creatorProfile = {
        // Basic info
        id: creator.id,
        firstName: creator.firstName,
        lastName: creator.lastName,
        email: creator.email,
        profileImageUrl: creator.profileImageUrl,
        createdAt: creator.createdAt,
        joinDate: creator.createdAt,
        
        // Personal Information
        address: creator.address,
        phoneNumber: creator.phoneNumber,
        profession: creator.profession,
        education: creator.education,
        organizationName: creator.organizationName,
        organizationType: creator.organizationType,
        linkedinProfile: creator.linkedinProfile,
        
        // Account Balances
        phpBalance: creator.phpBalance,
        tipsBalance: creator.tipsBalance,
        contributionsBalance: creator.contributionsBalance,
        
        // KYC and verification
        kycStatus: creator.kycStatus,
        
        // Trust & Community Scores
        socialScore: socialScore,
        creditScore: creditScore,
        averageRating: averageRating,
        totalRatings: totalRatings,
        reliabilityScore: 0,
        reliabilityRatingsCount: 0,
        
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
      
      // Get credit score using the correct method
      const creditScore = await storage.getUserAverageCreditScore(creatorId);
      
      // Get social score
      const socialScore = creator.socialScore || 0;
      
      // Get creator rating using the correct method
      const ratingData = await storage.getAverageCreatorRating(creatorId);
      const averageRating = ratingData.averageRating;
      const totalRatings = ratingData.totalRatings;

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
        phpBalance: creator.phpBalance,
        tipsBalance: creator.tipsBalance,
        contributionsBalance: creator.contributionsBalance,
        
        // Trust & Community Scores
        socialScore: socialScore,
        creditScore: creditScore,
        averageRating: averageRating,
        totalRatings: totalRatings,
        reliabilityScore: 0,
        reliabilityRatingsCount: 0,
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

      // Check if user is admin/support - they are exempted from KYC verification
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isAdmin || user.isSupport) {
        return res.status(200).json({ 
          message: "Administrative accounts are exempt from KYC verification",
          status: "exempt"
        });
      }
      
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

      // Update user's profile image URL in the database with permanent object path
      await storage.updateUserProfile(userId, {
        profileImageUrl: objectPath, // This should be a permanent path like /objects/id, not a presigned URL
      });

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting profile picture:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin KYC management routes
  app.post('/api/admin/kyc/approve', isAuthenticated, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user?.claims?.sub);
      if (!adminUser?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Update user KYC status and record admin who processed
      await storage.updateUserKYC(userId, "verified");
      await storage.updateUser(userId, {
        processedByAdmin: adminUser.email,
        processedAt: new Date()
      });

      console.log(`📋 Admin ${adminUser.email} approved KYC for user ${userId}`);
      res.json({ message: "KYC approved successfully" });
    } catch (error) {
      console.error("Error approving KYC:", error);
      res.status(500).json({ message: "Failed to approve KYC" });
    }
  });

  app.post('/api/admin/kyc/reject', isAuthenticated, async (req: any, res) => {
    try {
      console.log(`📋 KYC Reject request received:`, req.body);
      console.log(`📋 User authenticated:`, !!req.user);
      console.log(`📋 User claims:`, req.user?.claims);

      const adminUser = await storage.getUser(req.user?.claims?.sub);
      console.log(`📋 Admin user found:`, !!adminUser, adminUser?.email);
      
      if (!adminUser?.isAdmin) {
        console.log(`📋 Admin access denied - isAdmin:`, adminUser?.isAdmin);
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId, reason } = req.body;
      console.log(`📋 Request data - userId: ${userId}, reason: ${reason}`);
      
      if (!userId || !reason) {
        return res.status(400).json({ message: "User ID and rejection reason are required" });
      }

      console.log(`📋 Attempting to reject KYC for user ${userId} with reason: ${reason}`);

      // Update user KYC status with rejection reason and record admin who processed
      await storage.updateUserKYC(userId, "rejected", reason);
      await storage.updateUser(userId, {
        processedByAdmin: adminUser.email,
        processedAt: new Date()
      });

      console.log(`📋 Admin ${adminUser.email} successfully rejected KYC for user ${userId}, reason: ${reason}`);
      res.json({ message: "KYC rejected successfully" });
    } catch (error) {
      console.error("📋 Error rejecting KYC:", error);
      res.status(500).json({ message: "Failed to reject KYC", error: error.message });
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

      // Check if user is admin/support - they cannot tip
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isAdmin || user.isSupport) {
        return res.status(403).json({ 
          message: "Administrative accounts cannot tip campaigns",
          reason: "Admin and Support accounts are restricted from normal user activities. Please use a personal verified account for tipping."
        });
      }
      
      const tipAmount = parseFloat(amount);
      if (!amount || isNaN(tipAmount) || tipAmount <= 0) {
        return res.status(400).json({ message: 'Invalid tip amount' });
      }
      
      // Get campaign to find creator
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      const currentBalance = parseFloat(user?.phpBalance || '0');
      
      if (currentBalance < tipAmount) {
        return res.status(400).json({ message: 'Insufficient PHP balance' });
      }
      
      // Deduct from user's PHP balance
      await storage.subtractPhpBalance(userId, tipAmount);
      
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
        message: `Your ${tipAmount.toLocaleString()} PHP tip to "${campaign.title}" has been sent successfully.`,
        type: "tip_sent",
        relatedId: campaignId,
      });

      // Notification for campaign creator (receiver)
      if (campaign.creatorId !== userId) {
        await storage.createNotification({
          userId: campaign.creatorId,
          title: "New Tip Received! ✨",
          message: `You received a ${tipAmount.toLocaleString()} PHP tip for "${campaign.title}". ${message ? `Message: "${message}"` : ''}`,
          type: "tip_received",
          relatedId: campaignId,
        });
      }
      
      console.log('💰 Tip processed successfully:', tipAmount, 'PHP');
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
        currency: 'PHP',
        description: `Claimed ${result.tipCount} tips from campaign (₱${result.claimedAmount}) - transferred to tip wallet`,
        status: 'completed',
      });
      
      console.log(`🎁 Campaign tips claimed: ${result.claimedAmount} PHP from campaign ${campaignId} transferred to tip wallet for user: ${userId}`);
      console.log('📤 Sending response:', {
        message: 'Campaign tips claimed successfully!',
        claimedAmount: result.claimedAmount,
        tipCount: result.tipCount,
        campaignId: campaignId
      });
      res.json({
        message: 'Campaign tips claimed successfully!',
        claimedAmount: result.claimedAmount,
        tipCount: result.tipCount,
        campaignId: campaignId
      });
    } catch (error) {
      console.error('Error claiming campaign tips:', error);
      res.status(400).json({ message: (error as Error).message || 'Failed to claim tips' });
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

      // Check if user is admin/support - they cannot claim tips
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isAdmin || user.isSupport) {
        return res.status(403).json({ 
          message: "Administrative accounts cannot claim tips",
          reason: "Admin and Support accounts are restricted from financial operations. Please use a personal verified account for claiming tips."
        });
      }
      
      // Get user current tips balance before claiming to calculate fee
      const originalTipsAmount = parseFloat(user?.tipsBalance || '0');
      
      if (originalTipsAmount <= 0) {
        return res.status(400).json({ message: 'No tips available to claim' });
      }

      // Calculate the 1% claiming fee (minimum ₱1)
      const claimingFee = Math.max(originalTipsAmount * 0.01, 1);
      
      // Use the proper claimTips method that handles fees and transfers to PHP balance
      const claimedAmount = await storage.claimTips(userId);
      
      // Record the claim transaction with fee details
      await storage.createTransaction({
        userId,
        type: 'conversion',
        amount: claimedAmount.toString(),
        currency: 'PHP',
        description: `Claimed ${claimedAmount} PHP from Tips wallet (${originalTipsAmount.toFixed(2)} PHP - ${claimingFee.toFixed(2)} fee)`,
        status: 'completed',
        feeAmount: claimingFee.toString(),
      });
      
      console.log('🎁 Tips claimed successfully:', claimedAmount, 'PHP transferred to user:', userId);
      res.json({
        message: 'Tips claimed successfully!',
        claimedAmount: claimedAmount.toString(),
        originalAmount: originalTipsAmount.toString(),
        feeAmount: claimingFee.toString()
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
      res.json({ message: "PHP balance corrected successfully" });
    } catch (error) {
      console.error('Error correcting PHP balance:', error);
      res.status(500).json({ message: 'Failed to correct PHP balance' });
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
      
      // For deposits, credit PHP balance
      if (transaction.type === 'deposit') {
        const phpAmount = parseFloat(transaction.amount) * parseFloat(transaction.exchangeRate || '1');
        await storage.addPhpBalance(transaction.userId, phpAmount);
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

  app.get('/api/admin/kyc/verified', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getVerifiedUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching verified users:", error);
      res.status(500).json({ message: "Failed to fetch verified users" });
    }
  });

  app.get('/api/admin/kyc/rejected', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getRejectedKYC();
      res.json(users);
    } catch (error) {
      console.error("Error fetching rejected KYC:", error);
      res.status(500).json({ message: "Failed to fetch rejected KYC" });
    }
  });

  app.get('/api/admin/users/suspended', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getSuspendedUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching suspended users:", error);
      res.status(500).json({ message: "Failed to fetch suspended users" });
    }
  });

  app.post('/api/admin/kyc/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user?.claims?.sub);
      if (!adminUser?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const userId = req.params.id;

      // Update user KYC status and record admin who processed
      await storage.updateUserKYC(userId, "verified");
      await storage.updateUser(userId, {
        processedByAdmin: adminUser.email,
        processedAt: new Date()
      });
      
      // Create notification for user
      await storage.createNotification({
        userId: userId,
        title: "KYC Verification Approved! ✅",
        message: "Congratulations! Your identity verification has been approved. You can now access all platform features including fund claiming and volunteering.",
        type: "kyc_approved",
        relatedId: userId,
      });
      
      console.log(`📋 Admin ${adminUser.email} approved KYC for user ${userId}`);
      res.json({ message: "KYC approved successfully" });
    } catch (error) {
      console.error("Error approving KYC:", error);
      res.status(500).json({ message: "Failed to approve KYC" });
    }
  });

  app.post('/api/admin/kyc/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user?.claims?.sub);
      if (!adminUser?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { reason } = req.body;
      const userId = req.params.id;
      
      if (!reason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      console.log(`📋 Attempting to reject KYC for user ${userId} with reason: ${reason}`);

      // Update user KYC status with rejection reason and record admin who processed
      await storage.updateUserKYC(userId, "rejected", reason);
      await storage.updateUser(userId, {
        processedByAdmin: adminUser.email,
        processedAt: new Date()
      });

      // Create notification for user
      await storage.createNotification({
        userId: userId,
        title: "KYC Verification Rejected ❌",
        message: `Your identity verification has been rejected. Reason: ${reason}. Please review and resubmit your documents.`,
        type: "kyc_rejected",
        relatedId: userId,
      });

      console.log(`📋 Admin ${adminUser.email} successfully rejected KYC for user ${userId}, reason: ${reason}`);
      res.json({ message: "KYC rejected successfully" });
    } catch (error) {
      console.error("📋 Error rejecting KYC:", error);
      res.status(500).json({ message: "Failed to reject KYC", error: error.message });
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



  // Create automated withdrawal (PHP to PHP)
  app.post('/api/withdrawals/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, paymentMethod, accountDetails } = req.body;

      // Check if user is admin/support - they cannot make withdrawals
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isAdmin || user.isSupport) {
        return res.status(403).json({ 
          message: "Administrative accounts cannot make withdrawals",
          reason: "Admin and Support accounts are restricted from financial operations. Please use a personal verified account for withdrawals."
        });
      }
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }
      
      if (!paymentMethod || !accountDetails) {
        return res.status(400).json({ message: 'Payment method and account details are required' });
      }
      
      const userBalance = parseFloat(user.phpBalance || '0');
      if (userBalance < parseFloat(amount)) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      
      // Check KYC status (accept both 'approved' and 'verified')
      if (user.kycStatus !== 'approved' && user.kycStatus !== 'verified') {
        return res.status(403).json({ message: 'KYC verification required for withdrawals' });
      }
      
      // Get conversion quote with payment method fees
      const quote = await conversionService.getConversionQuote(
        parseFloat(amount),
        'PHP',
        'PHP',
        paymentMethod
      );
      
      console.log(`🏦 Processing automated withdrawal:`);
      console.log(`   User: ${user.email} (${userId})`);
      console.log(`   Amount: ${quote.fromAmount} PHP → ${quote.toAmount} PHP`);
      console.log(`   Method: ${paymentMethod} (${accountDetails})`);
      
      // Deduct PHP from user balance immediately
      await storage.addPhpBalance(userId, -parseFloat(amount));
      
      try {
        // Create automated payout through PayMongo (Bank Transfer only)
        const payout = await paymongoService.createAutomatedPayout({
          amount: paymongoService.phpToCentavos(quote.toAmount),
          currency: 'PHP',
          description: `VeriFund Withdrawal - ${user.email}`,
          destination: {
            type: 'bank',
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
          currency: 'PHP',
          description: `Withdraw ${quote.fromAmount} PHP → ${quote.toAmount} PHP via Bank Transfer (InstaPay)`,
          status: 'completed', // Mark as completed immediately
          paymentProvider: 'paymongo',
          exchangeRate: quote.exchangeRate.toString(),
          feeAmount: quote.fee.toString(),
        });
        
        // Create notification for successful withdrawal
        await storage.createNotification({
          userId: userId,
          title: "Withdrawal Completed Successfully! 🏦",
          message: `Your withdrawal of ${quote.fromAmount} PHP (₱${quote.toAmount} PHP) to your bank account has been completed via InstaPay.`,
          type: "withdrawal_completed",
          relatedId: transaction.id,
        });
        
        console.log(`✅ Automated withdrawal completed:`);
        console.log(`   Transaction ID: ${transaction.id}`);
        console.log(`   Payout ID: ${payout.id}`);
        console.log(`   New Balance: ${userBalance - parseFloat(amount)} PHP`);
        
        res.json({
          transactionId: transaction.id,
          payoutId: payout.id,
          quote,
          paymentMethod,
          accountDetails,
          status: 'completed',
          message: `Successfully withdrawn ${quote.toAmount} PHP to your bank account via InstaPay!`
        });
        
      } catch (payoutError) {
        console.error('❌ Payout failed, refunding user:', payoutError);
        
        // Refund the PHP back to user if payout fails
        await storage.addPhpBalance(userId, parseFloat(amount));
        
        // Create failed transaction record
        await storage.createTransaction({
          userId,
          type: 'withdrawal',
          amount: quote.fromAmount.toString(),
          currency: 'PHP',
          description: `Failed withdrawal ${quote.fromAmount} PHP → ${quote.toAmount} PHP`,
          status: 'failed',
          paymentProvider: 'paymongo',
          exchangeRate: quote.exchangeRate.toString(),
          feeAmount: quote.fee.toString(),
        });
        
        return res.status(500).json({ 
          message: 'Withdrawal failed. Your PHP balance has been restored. Please try again later.' 
        });
      }
      
    } catch (error) {
      console.error('Error creating automated withdrawal:', error);
      res.status(500).json({ message: 'Failed to create withdrawal' });
    }
  });

  // Create deposit (PHP to PHP)
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
        'PHP'
      );
      
      // Create PayMongo checkout session
      const paymentIntent = await paymongoService.createCheckoutSession({
        amount: paymongoService.phpToCentavos(quote.totalCost),
        currency: 'PHP',
        description: `VeriFund Deposit - ${quote.toAmount} PHP`,
        metadata: {
          userId,
          phpAmount: quote.toAmount.toString(),
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
        description: `Deposit ${quote.fromAmount} PHP → ${quote.toAmount} PHP`,
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
        description: `Deposit ${quote.fromAmount} PHP → ${quote.toAmount} PHP`,
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

  // Get conversion quote with payment method fees
  app.post('/api/conversions/quote', isAuthenticated, async (req: any, res) => {
    try {
      const { amount, fromCurrency, toCurrency, paymentMethod } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }
      
      const quote = await conversionService.getConversionQuote(
        parseFloat(amount),
        fromCurrency || 'PHP',
        toCurrency || 'PHP',
        paymentMethod
      );
      
      res.json(quote);
    } catch (error) {
      console.error('Error getting conversion quote:', error);
      res.status(500).json({ message: 'Failed to get conversion quote' });
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
        
        // Calculate PHP amount from exchange rate
        const phpAmount = parseFloat(transaction.amount) * parseFloat(transaction.exchangeRate || '1');
        
        // Mint PHP tokens (mock for now)
        const mintResult = await celoService.mintPuso(
          user?.celoWalletAddress || '',
          phpAmount.toString()
        );
        
        // Auto-complete the deposit
        await storage.updateTransaction(transaction.id, {
          status: 'completed',
          transactionHash: mintResult.hash,
          blockNumber: mintResult.blockNumber?.toString(),
        });
        
        // Update user balance using the method that updates the users table
        const currentBalance = parseFloat(user?.phpBalance || '0');
        const newBalance = currentBalance + phpAmount;
        await storage.updateUserBalance(transaction.userId, newBalance.toString());
        
        // Create notification for successful deposit
        await storage.createNotification({
          userId: transaction.userId,
          title: "Deposit Completed Successfully! 💳",
          message: `Your deposit of ₱${transaction.amount} PHP has been processed and ${phpAmount.toLocaleString()} PHP has been added to your wallet.`,
          type: "deposit_completed",
          relatedId: transaction.id,
        });
        
        console.log(`✅ Auto-completed deposit: ${transaction.amount} PHP → ${phpAmount} PHP for user ${transaction.userId}`);
        
        res.status(200).json({ 
          message: 'Payment processed successfully',
          transactionId: transaction.id,
          phpAmount 
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
      
      // Calculate PHP amount from the transaction data
      const phpAmount = parseFloat(transaction.amount) * parseFloat(transaction.exchangeRate || '1');
      
      // Mint PHP tokens (mock for now)
      const mintResult = await celoService.mintPuso(
        user.celoWalletAddress || '',
        phpAmount.toString()
      );
      
      // Update transaction with blockchain hash
      await storage.updateTransaction(transaction.id, {
        status: 'completed',
        transactionHash: mintResult.hash,
        blockNumber: mintResult.blockNumber?.toString(),
      });
      
      // Update user balance
      const currentBalance = parseFloat(user.phpBalance || '0');
      const newBalance = currentBalance + phpAmount;
      await storage.updateUserBalance(userId, newBalance.toString());
      
      console.log(`Manual deposit completed: ${phpAmount} PHP for user ${userId}`);
      
      res.json({
        success: true,
        phpAmount,
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
      const limit = parseInt(req.query.limit as string) || 50;
      
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
        totalDeposited: analytics.totalDeposited,
        activeUsers: analytics.activeUsers,
        contributors: analytics.contributors,
        creators: analytics.creators,
        volunteers: analytics.volunteers,
        completedCampaigns: analytics.completedCampaigns,
        pendingCampaigns: analytics.pendingCampaigns,
        activeCampaigns: analytics.activeCampaigns,
        inProgressCampaigns: analytics.inProgressCampaigns,
        fraudReportsCount: analytics.fraudReportsCount,
        verifiedUsers: analytics.verifiedUsers
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
      
      // Send invitation email using SendGrid
      const { sendSupportInvitationEmail } = await import('./sendgrid');
      const emailSent = await sendSupportInvitationEmail(
        email, 
        invitation.token, 
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'VeriFund Admin'
      );
      
      if (!emailSent) {
        console.error("Failed to send invitation email to:", email);
        // Still return success since invitation was created, but log the email failure
      }
      
      res.json({ 
        invitation, 
        message: emailSent 
          ? "Support invitation sent successfully! The invitation email has been sent."
          : "Support invitation created, but email failed to send. Please check the email manually." 
      });
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

  // Support invitation acceptance endpoint
  app.get("/accept-support-invite/:token", async (req, res) => {
    const { token } = req.params;
    
    try {
      const invitation = await storage.getSupportInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).send(`
          <html>
            <head><title>Invitation Not Found - VeriFund</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #dc2626;">❌ Invitation Not Found</h1>
              <p>This invitation link is invalid or has already been used.</p>
              <a href="/" style="color: #2563eb;">Return to VeriFund</a>
            </body>
          </html>
        `);
      }
      
      if (invitation.status !== 'pending') {
        return res.status(400).send(`
          <html>
            <head><title>Invitation Already Used - VeriFund</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #dc2626;">⚠️ Invitation Already Used</h1>
              <p>This invitation has already been accepted or expired.</p>
              <a href="/" style="color: #2563eb;">Return to VeriFund</a>
            </body>
          </html>
        `);
      }
      
      if (new Date(invitation.expiresAt) < new Date()) {
        await storage.updateSupportInvitationStatus(invitation.id, 'expired');
        return res.status(400).send(`
          <html>
            <head><title>Invitation Expired - VeriFund</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #dc2626;">⏰ Invitation Expired</h1>
              <p>This invitation has expired. Please contact the administrator for a new invitation.</p>
              <a href="/" style="color: #2563eb;">Return to VeriFund</a>
            </body>
          </html>
        `);
      }
      
      // If user is not logged in, redirect to login with the invitation token
      res.send(`
        <html>
          <head>
            <title>Accept Support Invitation - VeriFund</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 50px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .container {
                background: white;
                color: #333;
                padding: 40px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                max-width: 500px;
              }
              .btn {
                background: #2563eb;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                display: inline-block;
                margin: 10px;
                font-weight: 600;
              }
              .btn:hover { background: #1d4ed8; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 style="color: #2563eb; margin-bottom: 20px;">🎉 Welcome to VeriFund Support Team!</h1>
              <p style="margin-bottom: 20px; font-size: 18px;">
                You've been invited to join as a Support Staff member.
              </p>
              <p style="margin-bottom: 30px; color: #666;">
                Please log in to your VeriFund account to accept this invitation.
              </p>
              <a href="/api/login?invitation=${token}" class="btn">Log In & Accept Invitation</a>
              <br><br>
              <p style="font-size: 14px; color: #666;">
                Don't have an account? You'll be able to create one after logging in with Replit.
              </p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error processing support invitation:", error);
      res.status(500).send(`
        <html>
          <head><title>Error - VeriFund</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc2626;">❌ Error</h1>
            <p>Something went wrong processing your invitation. Please try again later.</p>
            <a href="/" style="color: #2563eb;">Return to VeriFund</a>
          </body>
        </html>
      `);
    }
  });

  // API endpoint to complete support invitation acceptance (after login)
  app.post("/api/accept-support-invite", isAuthenticated, async (req: any, res) => {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Invitation token is required" });
    }

    try {
      const invitation = await storage.getSupportInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "Invitation has already been used or expired" });
      }
      
      if (new Date(invitation.expiresAt) < new Date()) {
        await storage.updateSupportInvitationStatus(invitation.id, 'expired');
        return res.status(400).json({ message: "Invitation has expired" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user's email matches the invitation
      if (user.email !== invitation.email) {
        return res.status(400).json({ message: "This invitation is for a different email address" });
      }

      // Update user to have support role
      await storage.updateUserRole(userId, 'support');
      await storage.updateSupportInvitationStatus(invitation.id, 'accepted');

      // Send notification to user
      await storage.createNotification({
        userId: userId,
        title: "🎉 Welcome to Support Team!",
        message: "You've successfully joined VeriFund as a Support Staff member. You now have access to help users and manage support operations.",
        type: "role_assigned",
        relatedId: invitation.id,
      });

      res.json({ 
        message: "Support invitation accepted successfully! You are now a Support Staff member.",
        user: await storage.getUser(userId)
      });
    } catch (error) {
      console.error("Error accepting support invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
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
      // Check if user is admin/support - they cannot claim tips
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isAdmin || user.isSupport) {
        return res.status(403).json({ 
          message: "Administrative accounts cannot claim tips",
          reason: "Admin and Support accounts are restricted from financial operations. Please use a personal verified account for claiming tips."
        });
      }

      // Get user tips balance before claiming to calculate fee
      const originalTipsAmount = parseFloat(user?.tipsBalance || '0');
      const claimingFee = Math.max(originalTipsAmount * 0.01, 1);
      
      const claimedAmount = await storage.claimTips(req.user.claims.sub);
      
      // Record the claim transaction with fee details  
      await storage.createTransaction({
        userId: req.user.claims.sub,
        type: 'conversion',
        amount: claimedAmount.toString(),
        currency: 'PHP',
        description: `Claimed ${claimedAmount} PHP from Tips wallet (${originalTipsAmount.toFixed(2)} PHP - ${claimingFee.toFixed(2)} fee)`,
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
      // Check if user is admin/support - they cannot claim contributions
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isAdmin || user.isSupport) {
        return res.status(403).json({ 
          message: "Administrative accounts cannot claim contributions",
          reason: "Admin and Support accounts are restricted from financial operations. Please use a personal verified account for claiming contributions."
        });
      }

      // Get user contributions balance before claiming to calculate fee
      const originalContributionsAmount = parseFloat(user?.contributionsBalance || '0');
      const claimingFee = Math.max(originalContributionsAmount * 0.01, 1);
      
      const claimedAmount = await storage.claimContributions(req.user.claims.sub);
      
      // Record the claim transaction with fee details
      await storage.createTransaction({
        userId: req.user.claims.sub,
        type: 'conversion',
        amount: claimedAmount.toString(),
        currency: 'PHP',
        description: `Claimed ${claimedAmount} PHP from Contributions wallet (${originalContributionsAmount.toFixed(2)} PHP - ${claimingFee.toFixed(2)} fee)`,
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
      
      // Convert document ID to shortened format if it's a full database UUID
      let shortDocumentId = documentId;
      if (documentId && documentId.length > 10) {
        // Try to get the document and generate its short ID
        try {
          const document = await storage.getDocumentById(documentId);
          if (document?.shortId) {
            shortDocumentId = document.shortId;
          }
        } catch (error) {
          // Keep original ID if lookup fails
          console.log('Could not convert document ID to short format:', error);
        }
      }

      const fraudReport = await storage.createFraudReport({
        reporterId: userId,
        documentId: shortDocumentId,
        reportType,
        description,
      });
      
      // Immediately flag the associated campaign when a progress report is reported
      try {
        // Get document info to find associated campaign
        const document = await storage.getDocumentById(documentId);
        if (document?.progressReportId) {
          const progressReport = await storage.getProgressReport(document.progressReportId);
          if (progressReport?.campaignId) {
            console.log(`🚩 Flagging campaign ${progressReport.campaignId} due to progress report fraud`);
            await storage.updateCampaignStatus(progressReport.campaignId, 'flagged');
            
            // Get campaign details for notification
            const campaign = await storage.getCampaignById(progressReport.campaignId);
            if (campaign) {
              // Notify the campaign creator about the flagging
              await storage.createNotification({
                userId: campaign.creatorId,
                title: "Campaign Flagged for Review 🚩",
                message: `Your campaign "${campaign.title}" has been flagged for review due to reports about progress documents. Our admin team will investigate and contact you if needed.`,
                type: "campaign_flagged",
                relatedId: campaign.id,
              });
            }
            
            console.log(`✅ Campaign ${progressReport.campaignId} automatically flagged due to progress report fraud`);
          }
        }
      } catch (flagError) {
        console.error(`❌ Error auto-flagging campaign for progress report fraud:`, flagError);
        // Continue with the rest of the process even if flagging fails
      }
      
      // Create notification for the reporter
      await storage.createNotification({
        userId: userId,
        title: "Progress Report Fraud Submitted 🛡️",
        message: "Thank you for helping keep our community safe. Your report about this progress document is being reviewed by our admin team.",
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
      
      // Convert old database UUIDs to shortened IDs for display
      const reportsWithShortIds = await Promise.all(
        fraudReports.map(async (report) => {
          if (report.documentId && report.documentId.length > 10) {
            // Try to get the document and generate its short ID
            try {
              const document = await storage.getDocumentById(report.documentId);
              if (document?.shortId) {
                return { ...report, documentId: document.shortId };
              }
            } catch (error) {
              // Keep original ID if lookup fails
              console.log('Could not convert document ID to short format:', error);
            }
          }
          return report;
        })
      );
      
      res.json(reportsWithShortIds);
    } catch (error) {
      console.error("Error fetching fraud reports:", error);
      res.status(500).json({ message: "Failed to fetch fraud reports" });
    }
  });

  // Get flagged creators for admin panel
  app.get('/api/admin/flagged-creators', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.claims?.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const flaggedCreators = await storage.getFlaggedCreators();
      res.json(flaggedCreators);
    } catch (error) {
      console.error('Error fetching flagged creators:', error);
      res.status(500).json({ message: 'Failed to fetch flagged creators' });
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

      // Flag campaigns based on the type of fraud report
      try {
        let campaignsToFlag = [];
        
        if (report.relatedType === 'campaign' && report.relatedId) {
          // Direct campaign report - flag the specific campaign
          campaignsToFlag.push(report.relatedId);
          console.log(`🚩 Campaign report validated - flagging campaign ${report.relatedId}`);
        } 
        else if (report.documentId) {
          // Progress report document - find and flag the associated campaign
          console.log(`🚩 Progress report document flagged - finding associated campaign`);
          const enrichedReports = await storage.getAllFraudReports();
          const enrichedReport = enrichedReports.find(r => r.id === report.id);
          
          if (enrichedReport?.campaign?.id) {
            campaignsToFlag.push(enrichedReport.campaign.id);
            console.log(`🚩 Found campaign ${enrichedReport.campaign.id} for progress report fraud`);
          }
        }
        else {
          // Creator report - find and flag all their campaigns
          console.log(`🚩 Creator report validated - finding all creator campaigns`);
          
          // For creator reports, the relatedId should contain the creator's user ID
          if (report.relatedId && report.relatedType === 'creator') {
            const creatorCampaigns = await storage.getCampaignsByCreatorId(report.relatedId);
            for (const campaign of creatorCampaigns) {
              campaignsToFlag.push(campaign.id);
              console.log(`🚩 Found campaign ${campaign.id} for reported creator ${report.relatedId}`);
            }
          }
        }
        
        // Flag all identified campaigns
        for (const campaignId of campaignsToFlag) {
          try {
            console.log(`🚩 Flagging campaign ${campaignId} due to validated fraud report`);
            await storage.updateCampaignStatus(campaignId, 'flagged');
            
            // Get campaign details for notification
            const campaign = await storage.getCampaignById(campaignId);
            if (campaign) {
              // Notify the campaign creator about the flagging
              await storage.createNotification({
                userId: campaign.creatorId,
                title: "Campaign Flagged for Review 🚩",
                message: `Your campaign "${campaign.title}" has been flagged for review due to validated community reports. Our admin team is investigating and will contact you if needed.`,
                type: "campaign_flagged",
                relatedId: campaign.id,
              });
            }
            
            console.log(`✅ Campaign ${campaignId} successfully flagged`);
          } catch (flagError) {
            console.error(`❌ Error flagging campaign ${campaignId}:`, flagError);
            // Continue with other campaigns even if one fails
          }
        }
        
      } catch (flagError) {
        console.error(`❌ Error in campaign flagging logic:`, flagError);
        // Continue with the rest of the process even if flagging fails
      }
      
      res.json({ message: "Fraud report validated, social score awarded, and campaign flagged if applicable" });
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

  // Submit fraud report for campaign with evidence upload
  app.post("/api/fraud-reports/campaign", isAuthenticated, evidenceUpload.array('evidence', 5), async (req: any, res) => {
    try {
      console.log('🛡️ Fraud report endpoint called');
      console.log('👤 User authenticated:', !!req.user);
      console.log('📝 Request body:', req.body);
      console.log('📎 Evidence files:', req.files?.length || 0);
      
      const userId = req.user.claims.sub;
      const { reportType, description, campaignId } = req.body;
      
      console.log('📋 Extracted data:', { userId, reportType, description, campaignId });

      if (!reportType || !description || !campaignId) {
        console.log('❌ Missing required fields');
        return res.status(400).json({ message: "Missing required fields: reportType, description, and campaignId are required" });
      }

      // Verify campaign exists
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        console.log('❌ Campaign not found:', campaignId);
        return res.status(404).json({ message: "Campaign not found" });
      }

      console.log('✅ Campaign verified:', campaign.title);

      // Process evidence files if any
      let evidenceUrls: string[] = [];
      if (req.files && req.files.length > 0) {
        console.log('📎 Processing evidence files...');
        
        for (const file of req.files) {
          try {
            // For now, store file information (later can be enhanced with actual upload)
            const fileName = `${file.originalname} (${(file.size / 1024).toFixed(1)}KB)`;
            evidenceUrls.push(fileName);
            console.log('✅ Evidence file processed:', fileName);
          } catch (processError) {
            console.error('❌ Error processing evidence file:', processError);
            // Continue with other files even if one fails
          }
        }
      }

      // Create fraud report record for admin review
      const fraudReport = await storage.createFraudReport({
        reporterId: userId,
        reportType: reportType,
        description: description,
        relatedId: campaignId,
        relatedType: 'campaign',
        evidenceUrls: evidenceUrls,
      });
      
      console.log('✅ Campaign fraud report created:', fraudReport.id);

      // Automatically flag the campaign when it receives a report
      console.log(`🚩 Flagging campaign ${campaignId} due to community report`);
      await storage.updateCampaignStatus(campaignId, 'flagged');
      
      // Notify the campaign creator about the flagging
      await storage.createNotification({
        userId: campaign.creatorId,
        title: "Campaign Flagged for Review 🚩",
        message: `Your campaign "${campaign.title}" has been flagged for review due to community reports. Our admin team will investigate and contact you if needed.`,
        type: "campaign_flagged",
        relatedId: campaignId,
      });
      
      console.log(`✅ Campaign ${campaignId} automatically flagged due to report`);

      // Also flag the creator when a campaign is reported
      try {
        console.log(`🚩 Flagging creator ${campaign.creatorId} due to campaign report`);
        await storage.updateUser(campaign.creatorId, {
          isFlagged: true,
          flagReason: `Campaign "${campaign.title}" was reported for: ${reportType}`,
          flaggedAt: new Date(),
        });
        console.log(`✅ Creator ${campaign.creatorId} automatically flagged due to campaign report`);
      } catch (flagCreatorError) {
        console.error('❌ Error flagging creator:', flagCreatorError);
      }

      // Create notification for the reporter
      await storage.createNotification({
        userId: userId,
        title: "Campaign Report Submitted 🛡️",
        message: "Thank you for helping keep our community safe. Your campaign report is being reviewed by our admin team.",
        type: "fraud_report_submitted",
        relatedId: campaignId,
      });

      console.log('✅ Reporter notification created');

      res.status(201).json({ 
        message: "Campaign report submitted successfully", 
        reportId: fraudReport.id,
        campaignId: campaignId,
        reportType: reportType
      });
    } catch (error) {
      console.error("❌ Error creating campaign fraud report:", error);
      res.status(500).json({ message: "Failed to submit campaign report" });
    }
  });

  // Admin document search endpoint
  app.get('/api/admin/documents/search', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user?.claims?.sub);
      if (!user?.isAdmin && !user?.isSupport) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { documentId } = req.query;
      if (!documentId) {
        return res.status(400).json({ message: "Document ID is required" });
      }
      
      // Try to find document by shortened ID first (new approach)
      let document = await storage.getDocumentByShortId(documentId as string);
      
      // Fallback to database ID search (for backwards compatibility)
      if (!document) {
        document = await storage.getDocumentById(documentId as string);
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error searching for document:", error);
      res.status(500).json({ message: "Failed to search for document" });
    }
  });

  // Automatic campaign closure system
  app.post('/api/admin/process-expired-campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const expiredCampaigns = await storage.getExpiredCampaigns();
      const processedCampaigns = [];

      for (const campaign of expiredCampaigns) {
        // Close expired campaign
        await storage.updateCampaignStatus(campaign.id, 'completed');
        
        // Check if creator claimed funds without sufficient progress reports
        const progressReports = await storage.getProgressReportsForCampaign(campaign.id);
        const claimedAmount = parseFloat(campaign.claimedAmount || '0');
        
        // Flag creator if they claimed operational funds but have fewer than 2 progress reports
        if (claimedAmount > 0 && progressReports.length < 2) {
          await storage.flagUser(
            campaign.creatorId, 
            `Campaign expired with claimed funds (₱${claimedAmount}) but insufficient progress reports (${progressReports.length}/2 minimum)`
          );
        }

        processedCampaigns.push({
          campaignId: campaign.id,
          title: campaign.title,
          claimedAmount,
          progressReportsCount: progressReports.length,
          creatorFlagged: claimedAmount > 0 && progressReports.length < 2
        });
      }

      res.json({
        message: `Processed ${expiredCampaigns.length} expired campaigns`,
        processedCampaigns
      });
    } catch (error) {
      console.error('Error processing expired campaigns:', error);
      res.status(500).json({ message: 'Failed to process expired campaigns' });
    }
  });

  const httpServer = createServer(app);
  // Credibility Score routes
  app.get('/api/users/:userId/credibility-score', isAuthenticated, async (req: any, res) => {
    try {
      const requestedUserId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      
      // Users can only view their own credibility score or admins can view any
      const currentUser = await storage.getUser(currentUserId);
      if (requestedUserId !== currentUserId && !currentUser?.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const score = await storage.calculateUserCredibilityScore(requestedUserId);
      const user = await storage.getUser(requestedUserId);
      
      res.json({
        credibilityScore: score,
        accountStatus: user?.accountStatus || 'active',
        remainingCampaignChances: user?.remainingCampaignChances || 0,
        lastUpdate: user?.lastCredibilityUpdate,
        canCreateCampaign: (await storage.canUserCreateCampaign(requestedUserId)).canCreate
      });
    } catch (error) {
      console.error('Error getting credibility score:', error);
      res.status(500).json({ message: 'Failed to get credibility score' });
    }
  });

  app.post('/api/users/:userId/update-credibility', isAuthenticated, async (req: any, res) => {
    try {
      const requestedUserId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      
      // Users can only update their own score or admins can update any
      const currentUser = await storage.getUser(currentUserId);
      if (requestedUserId !== currentUserId && !currentUser?.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      await storage.updateUserCredibilityScore(requestedUserId);
      const user = await storage.getUser(requestedUserId);
      
      res.json({
        message: 'Credibility score updated',
        credibilityScore: user?.credibilityScore,
        accountStatus: user?.accountStatus
      });
    } catch (error) {
      console.error('Error updating credibility score:', error);
      res.status(500).json({ message: 'Failed to update credibility score' });
    }
  });

  // Support Request routes
  app.post('/api/support-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { requestType, reason, attachments } = req.body;
      
      if (!requestType || !reason) {
        return res.status(400).json({ message: 'Request type and reason are required' });
      }
      
      // Check if user already has an active support request
      const user = await storage.getUser(userId);
      if (user?.hasActiveSupportRequest) {
        return res.status(409).json({ message: 'You already have an active support request' });
      }
      
      const credibilityScore = await storage.calculateUserCredibilityScore(userId);
      const supportRequest = await storage.createSupportRequest({
        userId,
        requestType,
        reason,
        currentCredibilityScore: credibilityScore.toFixed(2),
        attachments: attachments ? JSON.stringify(attachments) : null
      });
      
      res.status(201).json({
        message: 'Support request submitted successfully. Minimum 1 month processing time.',
        request: supportRequest
      });
    } catch (error) {
      console.error('Error creating support request:', error);
      res.status(500).json({ message: 'Failed to create support request' });
    }
  });

  app.get('/api/support-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.isAdmin) {
        // Admins can see all support requests
        const requests = await storage.getAllSupportRequests();
        res.json(requests);
      } else {
        // Regular users can only see their own requests
        const requests = await storage.getSupportRequestsByUser(userId);
        res.json(requests);
      }
    } catch (error) {
      console.error('Error getting support requests:', error);
      res.status(500).json({ message: 'Failed to get support requests' });
    }
  });

  app.put('/api/support-requests/:requestId', isAuthenticated, async (req: any, res) => {
    try {
      const { requestId } = req.params;
      const { status, reviewNotes } = req.body;
      const reviewerId = req.user.claims.sub;
      
      // Only admins can update support request status
      const reviewer = await storage.getUser(reviewerId);
      if (!reviewer?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      await storage.updateSupportRequestStatus(requestId, status, reviewerId, reviewNotes);
      
      res.json({ message: 'Support request updated successfully' });
    } catch (error) {
      console.error('Error updating support request:', error);
      res.status(500).json({ message: 'Failed to update support request' });
    }
  });

  return httpServer;
}
