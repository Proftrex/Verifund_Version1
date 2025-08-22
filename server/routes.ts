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

  // Claim campaign funds
  app.post('/api/campaigns/:id/claim', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.params.id;
      
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
      const minimumClaim = 50; // 50 PUSO minimum
      
      if (currentAmount < minimumClaim) {
        return res.status(400).json({ 
          message: `Minimum claim amount is ${minimumClaim} PUSO. Current: ${currentAmount.toLocaleString()} PUSO` 
        });
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
        amount: currentAmount.toString(),
        currency: 'PUSO',
        description: `Claimed ${currentAmount.toLocaleString()} PUSO from campaign: ${campaign.title}`,
        status: 'completed',
        transactionHash: `claim-${campaignId}-${Date.now()}`,
        campaignId: campaignId,
      });
      
      // Add PUSO balance to creator's wallet
      const currentUserBalance = parseFloat(user.pusoBalance || '0');
      const newUserBalance = currentUserBalance + currentAmount;
      await storage.updateUserBalance(userId, newUserBalance.toString());
      
      // Update campaign to claimed status and reset amount
      await storage.updateCampaignStatus(campaignId, 'claimed');
      await storage.updateCampaignAmount(campaignId, '0.00');
      
      console.log(`✅ Campaign funds claimed successfully:`);
      console.log(`   Campaign: ${campaign.title} (${campaignId})`);
      console.log(`   Claimed amount: ${currentAmount.toLocaleString()} PUSO`);
      console.log(`   Creator balance: ${currentUserBalance.toLocaleString()} → ${newUserBalance.toLocaleString()} PUSO`);
      console.log(`   Transaction ID: ${transaction.id}`);
      
      res.json({
        message: 'Funds claimed successfully! 🎉',
        claimedAmount: currentAmount,
        newUserBalance,
        transactionId: transaction.id
      });
    } catch (error) {
      console.error('Error claiming campaign funds:', error);
      res.status(500).json({ message: 'Failed to claim funds' });
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

      const application = await storage.updateCampaignVolunteerApplicationStatus(
        applicationId,
        "approved"
      );

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

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

      const application = await storage.updateCampaignVolunteerApplicationStatus(
        applicationId,
        "rejected",
        reason
      );

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

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
      const userId = req.user.claims.sub;
      
      const result = await storage.claimCampaignTips(userId, campaignId);
      
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
      
      await storage.updateCampaignStatus(req.params.id, "active");
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
      
      await storage.updateCampaignStatus(req.params.id, "rejected");
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

  const httpServer = createServer(app);
  return httpServer;
}
