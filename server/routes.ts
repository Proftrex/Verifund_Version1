import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCampaignSchema, insertContributionSchema, insertVolunteerApplicationSchema } from "@shared/schema";
import { z } from "zod";

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
      
      const contribution = await storage.createContribution(contributionData);
      
      // Update campaign amount
      const campaign = await storage.getCampaign(req.params.id);
      if (campaign) {
        const newAmount = (parseFloat(campaign.currentAmount) + parseFloat(contributionData.amount)).toString();
        await storage.updateCampaignAmount(req.params.id, newAmount);
        
        // Create transaction record
        await storage.createTransaction({
          campaignId: req.params.id,
          type: "contribution",
          amount: contributionData.amount,
          description: `Contribution from user ${userId}`,
          transactionHash: contribution.transactionHash!,
        });
      }
      
      res.json(contribution);
    } catch (error) {
      console.error("Error creating contribution:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contribution data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contribution" });
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

  // Admin routes
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

  const httpServer = createServer(app);
  return httpServer;
}
