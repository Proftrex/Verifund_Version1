import {
  users,
  campaigns,
  contributions,
  tips,
  transactions,
  volunteerOpportunities,
  volunteerApplications,
  campaignUpdates,
  paymentRecords,
  exchangeRates,
  blockchainConfig,
  supportInvitations,
  supportRequests,
  notifications,
  campaignReactions,
  campaignComments,
  commentReplies,
  commentVotes,
  replyVotes,
  progressReports,
  progressReportDocuments,
  userCreditScores,
  creatorRatings,
  fraudReports,
  volunteerReliabilityRatings,
  type User,
  type UpsertUser,
  type Campaign,
  type InsertCampaign,
  type Contribution,
  type InsertContribution,
  type Tip,
  type InsertTip,
  type Transaction,
  type InsertTransaction,
  type VolunteerOpportunity,
  type InsertVolunteerOpportunity,
  type VolunteerApplication,
  type InsertVolunteerApplication,
  type CampaignUpdate,
  type InsertCampaignUpdate,
  type PaymentRecord,
  type InsertPaymentRecord,
  type ExchangeRate,
  type InsertExchangeRate,
  type SupportInvitation,
  type InsertSupportInvitation,
  type SupportRequest,
  type InsertSupportRequest,
  type Notification,
  type InsertNotification,
  type CampaignReaction,
  type InsertCampaignReaction,
  type CampaignComment,
  type InsertCampaignComment,
  type CommentReply,
  type InsertCommentReply,
  type ProgressReport,
  type InsertProgressReport,
  type ProgressReportDocument,
  type InsertProgressReportDocument,
  type UserCreditScore,
  type InsertUserCreditScore,
  type CreatorRating,
  type InsertCreatorRating,
  type FraudReport,
  type InsertFraudReport,
  type VolunteerReliabilityRating,
  type InsertVolunteerReliabilityRating,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, gt, inArray, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import crypto from "crypto";
import { ObjectStorageService } from "./objectStorage";

// ID Generation utilities
function generateDisplayId(prefix: string, suffix: string): string {
  return `${prefix}-${suffix.padStart(6, '0')}`;
}

function generateRandomSuffix(): string {
  return Math.floor(Math.random() * 999999).toString().padStart(6, '0');
}

async function generateUniqueUserDisplayId(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const suffix = generateRandomSuffix();
    const displayId = generateDisplayId('USR', suffix);
    
    const existing = await db.select().from(users).where(eq(users.userDisplayId, displayId)).limit(1);
    if (existing.length === 0) {
      return displayId;
    }
    attempts++;
  }
  // Fallback to timestamp-based ID if random fails
  return generateDisplayId('USR', Date.now().toString().slice(-6));
}

async function generateUniqueTransactionDisplayId(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const suffix = generateRandomSuffix();
    const displayId = generateDisplayId('TXN', suffix);
    
    const existing = await db.select().from(transactions).where(eq(transactions.transactionDisplayId, displayId)).limit(1);
    if (existing.length === 0) {
      return displayId;
    }
    attempts++;
  }
  // Fallback to timestamp-based ID if random fails
  return generateDisplayId('TXN', Date.now().toString().slice(-6));
}

async function generateUniqueDocumentDisplayId(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const suffix = generateRandomSuffix();
    const displayId = generateDisplayId('DOC', suffix);
    
    const existing = await db.select().from(progressReportDocuments).where(eq(progressReportDocuments.documentDisplayId, displayId)).limit(1);
    if (existing.length === 0) {
      return displayId;
    }
    attempts++;
  }
  // Fallback to timestamp-based ID if random fails
  return generateDisplayId('DOC', Date.now().toString().slice(-6));
}

async function generateUniqueCampaignDisplayId(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const suffix = generateRandomSuffix();
    const displayId = generateDisplayId('CAM', suffix);
    
    const existing = await db.select().from(campaigns).where(eq(campaigns.campaignDisplayId, displayId)).limit(1);
    if (existing.length === 0) {
      return displayId;
    }
    attempts++;
  }
  // Fallback to timestamp-based ID if random fails
  return generateDisplayId('CAM', Date.now().toString().slice(-6));
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserKYC(id: string, status: string, documents?: string): Promise<void>;
  updateUserBalance(id: string, balance: string): Promise<void>;
  updateUserProfile(id: string, profileData: {
    education?: string;
    profession?: string;
    workExperience?: string;
    linkedinProfile?: string;
    organizationName?: string;
    organizationType?: string;
    phoneNumber?: string;
    address?: string;
    profileImageUrl?: string;
    isProfileComplete?: boolean;
  }): Promise<User>;
  updateUserWallet(userId: string, walletAddress: string, encryptedPrivateKey: string): Promise<void>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  
  
  // Campaign operations
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaigns(filters?: { status?: string; category?: string; limit?: number }): Promise<Campaign[]>;
  updateCampaignStatus(id: string, status: string): Promise<Campaign>;
  updateCampaignAmount(id: string, amount: string): Promise<void>;
  updateCampaignClaimedAmount(campaignId: string, claimedAmount: string): Promise<void>;
  getCampaignsByCreator(creatorId: string): Promise<Campaign[]>;
  getExpiredCampaigns(): Promise<Campaign[]>;
  flagUser(userId: string, reason: string): Promise<void>;
  
  // Contribution operations
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  getContributionsByCampaign(campaignId: string): Promise<Contribution[]>;
  getContributionsByUser(userId: string): Promise<Contribution[]>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByCampaign(campaignId: string): Promise<Transaction[]>;
  getRecentTransactions(limit?: number): Promise<Transaction[]>;
  
  // Volunteer operations
  createVolunteerOpportunity(opportunity: InsertVolunteerOpportunity): Promise<VolunteerOpportunity>;
  getVolunteerOpportunities(filters?: { status?: string; limit?: number }): Promise<VolunteerOpportunity[]>;
  applyForVolunteer(application: InsertVolunteerApplication): Promise<VolunteerApplication>;
  getVolunteerApplicationsByUser(userId: string): Promise<VolunteerApplication[]>;
  
  // Campaign volunteer operations
  getCampaignVolunteerApplication(campaignId: string, applicantId: string): Promise<VolunteerApplication | undefined>;
  createCampaignVolunteerApplication(application: { campaignId: string; applicantId: string; intent: string; message?: string; status?: string }): Promise<VolunteerApplication>;
  getCampaignVolunteerApplications(campaignId: string): Promise<VolunteerApplication[]>;
  updateCampaignVolunteerApplicationStatus(applicationId: string, status: string, rejectionReason?: string): Promise<VolunteerApplication | undefined>;
  incrementVolunteerSlotsFilledCount(campaignId: string): Promise<void>;
  
  // Campaign updates
  createCampaignUpdate(update: InsertCampaignUpdate): Promise<CampaignUpdate>;
  getCampaignUpdates(campaignId: string): Promise<CampaignUpdate[]>;
  
  // Admin operations
  getPendingCampaigns(): Promise<Campaign[]>;
  getPendingKYC(): Promise<User[]>;
  getVerifiedUsers(): Promise<User[]>;
  getRejectedKYC(): Promise<User[]>;
  getSuspendedUsers(): Promise<User[]>;
  getFlaggedCampaigns(): Promise<Campaign[]>;
  
  // Transaction search for admin
  searchTransactions(params: {
    email?: string;
    transactionId?: string;
    amount?: string;
    type?: string;
  }): Promise<any[]>;
  
  // Balance operations - Multiple wallet types
  addPhpBalance(userId: string, amount: number): Promise<void>;
  subtractPhpBalance(userId: string, amount: number): Promise<void>;
  addTipsBalance(userId: string, amount: number): Promise<void>;
  addContributionsBalance(userId: string, amount: number): Promise<void>;
  claimTips(userId: string): Promise<number>;
  claimContributions(userId: string): Promise<number>;
  
  // Admin balance corrections
  correctPhpBalance(userId: string, newBalance: number, reason: string): Promise<void>;
  correctTipsBalance(userId: string, newBalance: number, reason: string): Promise<void>;
  correctContributionsBalance(userId: string, newBalance: number, reason: string): Promise<void>;
  updateTransactionStatus(transactionId: string, status: string, reason: string): Promise<void>;
  getTransactionById(transactionId: string): Promise<any>;
  
  // Admin Financial Management methods
  getContributionsAndTips(): Promise<any[]>;
  getClaimedTips(): Promise<any[]>;
  getClaimedContributions(): Promise<any[]>;
  getAllTransactionHistories(): Promise<any[]>;
  getDepositTransactions(): Promise<any[]>;
  getWithdrawalTransactions(): Promise<any[]>;

  // Admin Claim System methods
  claimFraudReport(reportId: string, adminId: string): Promise<boolean>;
  claimSupportRequest(requestId: string, adminId: string): Promise<boolean>;
  getFraudReport(reportId: string): Promise<any>;
  getSupportRequest(requestId: string): Promise<any>;
  getAdminClaimedReports(adminId: string): Promise<{
    fraudReports: any[];
    supportRequests: any[];
  }>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  // Admin transaction processing
  processTransaction(transactionId: string): Promise<void>;
  rejectTransaction(transactionId: string): Promise<void>;

  // Tip operations
  createTip(tip: InsertTip): Promise<Tip>;
  getTipsByCreator(creatorId: string): Promise<Tip[]>;
  getTipsByCampaign(campaignId: string): Promise<Tip[]>;
  
  // Support staff operations
  createSupportInvitation(email: string, invitedBy: string): Promise<SupportInvitation>;
  getSupportInvitation(token: string): Promise<SupportInvitation | undefined>;
  acceptSupportInvitation(token: string): Promise<void>;
  getPendingSupportInvitations(): Promise<SupportInvitation[]>;
  
  // Analytics
  getAnalytics(): Promise<{
    totalWithdrawn: number;
    totalTipsCollected: number;
    totalContributionsCollected: number;
    totalDeposited: number;
    activeUsers: number;
    contributors: number;
    creators: number;
    volunteers: number;
    completedCampaigns: number;
    pendingCampaigns: number;
    activeCampaigns: number;
    inProgressCampaigns: number;
    fraudReportsCount: number;
    verifiedUsers: number;
  }>;

  // Campaign engagement operations
  toggleCampaignReaction(campaignId: string, userId: string, reactionType: string): Promise<CampaignReaction | null>;
  getCampaignReactions(campaignId: string): Promise<{ [key: string]: { count: number; users: string[] } }>;
  getCampaignReactionByUser(campaignId: string, userId: string): Promise<CampaignReaction | undefined>;
  
  // Campaign comment operations
  createCampaignComment(comment: InsertCampaignComment): Promise<CampaignComment>;
  getCampaignComments(campaignId: string): Promise<(CampaignComment & { user: User; replies: (CommentReply & { user: User })[] })[]>;
  updateCampaignComment(commentId: string, content: string, userId: string): Promise<CampaignComment | undefined>;
  deleteCampaignComment(commentId: string, userId: string): Promise<void>;
  
  // Comment reply operations
  createCommentReply(reply: InsertCommentReply): Promise<CommentReply>;
  getCommentReplies(commentId: string): Promise<(CommentReply & { user: User })[]>;
  updateCommentReply(replyId: string, content: string, userId: string): Promise<CommentReply | undefined>;
  deleteCommentReply(replyId: string, userId: string): Promise<void>;
  
  // Document search operations
  getDocumentById(documentId: string): Promise<any>;
  getDocumentByShortId(shortId: string): Promise<any>;
  generateDocumentShortId(fileUrl: string): string;

  // Volunteer reliability rating operations
  createVolunteerReliabilityRating(rating: InsertVolunteerReliabilityRating): Promise<VolunteerReliabilityRating>;
  getVolunteerReliabilityRating(volunteerId: string, campaignId: string): Promise<VolunteerReliabilityRating | undefined>;
  getVolunteerReliabilityRatings(volunteerId: string): Promise<(VolunteerReliabilityRating & { campaign: Campaign; rater: User })[]>;
  updateVolunteerReliabilityScore(volunteerId: string): Promise<void>;
  getVolunteersToRate(campaignId: string, creatorId: string): Promise<(User & { application: VolunteerApplication })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Generate user display ID if not provided
    if (!userData.userDisplayId) {
      userData.userDisplayId = await generateUniqueUserDisplayId();
    }
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserKYC(id: string, status: string, documentsOrReason?: string): Promise<void> {
    const updateData: any = { 
      kycStatus: status, 
      updatedAt: new Date() 
    };
    
    // If status is rejected, store the reason in rejectionReason field
    if (status === 'rejected' && documentsOrReason) {
      updateData.rejectionReason = documentsOrReason;
    } else if (documentsOrReason) {
      // For other statuses, treat as documents
      updateData.kycDocuments = documentsOrReason;
    }
    
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id));
  }

  async updateUserBalance(id: string, balance: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        phpBalance: balance,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  async updateUserTipBalance(id: string, balance: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        tipsBalance: balance,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  async updateUserWallet(userId: string, walletAddress: string, encryptedPrivateKey: string): Promise<void> {
    await db
      .update(users)
      .set({
        celoWalletAddress: walletAddress,
        walletPrivateKey: encryptedPrivateKey,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(id: string, profileData: {
    education?: string;
    profession?: string;
    workExperience?: string;
    linkedinProfile?: string;
    organizationName?: string;
    organizationType?: string;
    phoneNumber?: string;
    address?: string;
    profileImageUrl?: string;
    isProfileComplete?: boolean;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...profileData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Campaign operations
  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    // Generate campaign display ID if not provided
    if (!campaign.campaignDisplayId) {
      campaign.campaignDisplayId = await generateUniqueCampaignDisplayId();
    }
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + campaign.duration);
    
    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        ...campaign,
        endDate,
        volunteerSlotsFilledCount: 0, // Initialize volunteer filled count
      })
      .returning();
    return newCampaign;
  }

  async updateCampaignClaimedAmount(campaignId: string, claimedAmount: string): Promise<void> {
    await db
      .update(campaigns)
      .set({ claimedAmount })
      .where(eq(campaigns.id, campaignId));
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async getCampaignWithCreator(id: string): Promise<any | undefined> {
    const [campaign] = await db
      .select({
        // Campaign fields
        id: campaigns.id,
        creatorId: campaigns.creatorId,
        title: campaigns.title,
        description: campaigns.description,
        category: campaigns.category,
        goalAmount: campaigns.goalAmount,
        minimumAmount: campaigns.minimumAmount,
        currentAmount: campaigns.currentAmount,
        claimedAmount: campaigns.claimedAmount,
        images: campaigns.images,
        status: campaigns.status,
        tesVerified: campaigns.tesVerified,
        duration: campaigns.duration,
        street: campaigns.street,
        barangay: campaigns.barangay,
        city: campaigns.city,
        province: campaigns.province,
        region: campaigns.region,
        zipcode: campaigns.zipcode,
        landmark: campaigns.landmark,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        needsVolunteers: campaigns.needsVolunteers,
        volunteerSlots: campaigns.volunteerSlots,
        volunteerSlotsFilledCount: campaigns.volunteerSlotsFilledCount,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        // Creator fields
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
        creatorEmail: users.email,
        creatorKycStatus: users.kycStatus,
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .where(eq(campaigns.id, id));
    return campaign;
  }

  async getCampaigns(filters?: { status?: string; category?: string; limit?: number }): Promise<Campaign[]> {
    let query = db.select().from(campaigns);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(campaigns.status, filters.status));
    }
    if (filters?.category) {
      conditions.push(eq(campaigns.category, filters.category));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(campaigns.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    return await query;
  }

  async getCampaignsWithCreators(filters?: { status?: string; category?: string; limit?: number }): Promise<any[]> {
    try {
      console.log("🔍 Fetching campaigns with creators...");
      
      // Build where conditions
      const whereConditions = [];
      if (filters?.status) {
        whereConditions.push(eq(campaigns.status, filters.status));
      }
      if (filters?.category) {
        whereConditions.push(eq(campaigns.category, filters.category));
      }
      
      const campaignsData = await db
        .select({
          // Campaign fields
          id: campaigns.id,
          creatorId: campaigns.creatorId,
          title: campaigns.title,
          description: campaigns.description,
          category: campaigns.category,
          goalAmount: campaigns.goalAmount,
          minimumAmount: campaigns.minimumAmount,
          currentAmount: campaigns.currentAmount,
          claimedAmount: campaigns.claimedAmount,
          images: campaigns.images,
          status: campaigns.status,
          tesVerified: campaigns.tesVerified,
          duration: campaigns.duration,
          street: campaigns.street,
          barangay: campaigns.barangay,
          city: campaigns.city,
          province: campaigns.province,
          region: campaigns.region,
          zipcode: campaigns.zipcode,
          landmark: campaigns.landmark,
          startDate: campaigns.startDate,
          endDate: campaigns.endDate,
          needsVolunteers: campaigns.needsVolunteers,
          volunteerSlots: campaigns.volunteerSlots,
          volunteerSlotsFilledCount: campaigns.volunteerSlotsFilledCount,
          createdAt: campaigns.createdAt,
          updatedAt: campaigns.updatedAt,
          // Creator fields
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
          creatorKycStatus: users.kycStatus,
        })
        .from(campaigns)
        .leftJoin(users, eq(campaigns.creatorId, users.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(campaigns.createdAt))
        .limit(filters?.limit || 1000);
      
      console.log(`✅ Found ${campaignsData.length} campaigns with creator data`);
      return campaignsData;
    } catch (error) {
      console.error("❌ Error in getCampaignsWithCreators:", error);
      
      // Instead of falling back to regular campaigns, let's try a simpler approach
      try {
        console.log("🔄 Attempting fallback approach...");
        const basicCampaigns = await this.getCampaigns(filters);
        
        // Manually add creator information
        const campaignsWithCreators = await Promise.all(
          basicCampaigns.map(async (campaign) => {
            try {
              const creator = await this.getUser(campaign.creatorId);
              return {
                ...campaign,
                creatorFirstName: creator?.firstName || null,
                creatorLastName: creator?.lastName || null,
                creatorEmail: creator?.email || null,
                creatorKycStatus: creator?.kycStatus || null,
              };
            } catch (userError) {
              console.error(`Error fetching creator for campaign ${campaign.id}:`, userError);
              return {
                ...campaign,
                creatorFirstName: null,
                creatorLastName: null,
                creatorEmail: null,
                creatorKycStatus: null,
              };
            }
          })
        );
        
        console.log(`✅ Fallback successful: ${campaignsWithCreators.length} campaigns with creator data`);
        return campaignsWithCreators;
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
        return await this.getCampaigns(filters);
      }
    }
  }

  async updateCampaignStatus(id: string, status: string): Promise<Campaign> {
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({ 
        status,
        updatedAt: new Date() 
      })
      .where(eq(campaigns.id, id))
      .returning();
    
    if (!updatedCampaign) {
      throw new Error("Campaign not found");
    }
    
    return updatedCampaign;
  }

  async updateCampaignAmount(id: string, amount: string): Promise<void> {
    await db
      .update(campaigns)
      .set({ 
        currentAmount: amount,
        updatedAt: new Date() 
      })
      .where(eq(campaigns.id, id));
  }

  async getCampaignsByCreator(creatorId: string, filters?: { status?: string; category?: string }): Promise<any[]> {
    const conditions = [eq(campaigns.creatorId, creatorId)];
    
    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(campaigns.status, filters.status));
    }

    if (filters?.category && filters.category !== 'all') {
      conditions.push(eq(campaigns.category, filters.category));
    }

    const campaignsData = await db
      .select({
        // Campaign fields
        id: campaigns.id,
        creatorId: campaigns.creatorId,
        title: campaigns.title,
        description: campaigns.description,
        category: campaigns.category,
        goalAmount: campaigns.goalAmount,
        minimumAmount: campaigns.minimumAmount,
        currentAmount: campaigns.currentAmount,
        claimedAmount: campaigns.claimedAmount,
        images: campaigns.images,
        status: campaigns.status,
        tesVerified: campaigns.tesVerified,
        duration: campaigns.duration,
        street: campaigns.street,
        barangay: campaigns.barangay,
        city: campaigns.city,
        province: campaigns.province,
        region: campaigns.region,
        zipcode: campaigns.zipcode,
        landmark: campaigns.landmark,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        needsVolunteers: campaigns.needsVolunteers,
        volunteerSlots: campaigns.volunteerSlots,
        volunteerSlotsFilledCount: campaigns.volunteerSlotsFilledCount,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        // Creator fields
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
        creatorEmail: users.email,
        creatorKycStatus: users.kycStatus,
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(campaigns.createdAt));

    return campaignsData;
  }

  // Contribution operations
  async createContribution(contribution: InsertContribution): Promise<Contribution> {
    const transactionHash = `0x${Math.random().toString(16).substr(2, 40)}`;
    
    const [newContribution] = await db
      .insert(contributions)
      .values({
        ...contribution,
        transactionHash,
      })
      .returning();

    // Check if contribution pushes campaign to minimum operational amount
    const campaign = await this.getCampaign(contribution.campaignId);
    if (campaign) {
      const newTotal = parseFloat(campaign.currentAmount) + parseFloat(contribution.amount);
      const minimumAmount = parseFloat(campaign.minimumAmount);
      
      // If we've reached minimum amount and campaign is still active, change to on_progress
      if (newTotal >= minimumAmount && campaign.status === 'active') {
        await this.updateCampaignStatus(contribution.campaignId, 'on_progress');
        
        // Create notification for campaign creator
        await this.createNotification({
          userId: campaign.creatorId,
          title: "Campaign Ready for Progress! 🚀",
          message: `Your campaign "${campaign.title}" has reached the minimum operational amount. You can now start uploading progress reports!`,
          type: "campaign_status_update",
          relatedId: contribution.campaignId,
        });
      }
    }
    
    return newContribution;
  }

  async getContributionsByCampaign(campaignId: string): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.campaignId, campaignId))
      .orderBy(desc(contributions.createdAt));
  }

  async getContributionsByUser(userId: string): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.contributorId, userId))
      .orderBy(desc(contributions.createdAt));
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    // Generate transaction display ID if not provided
    if (!transaction.transactionDisplayId) {
      transaction.transactionDisplayId = await generateUniqueTransactionDisplayId();
    }
    
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getTransactionsByCampaign(campaignId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.campaignId, campaignId))
      .orderBy(desc(transactions.createdAt));
  }

  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getTransactionByPaymongoId(paymongoId: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.paymentProviderTxId, paymongoId));
    return transaction;
  }

  // Multiple wallet operations
  async addPhpBalance(userId: string, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentBalance = parseFloat(user.phpBalance || '0');
    const newBalance = (currentBalance + amount).toFixed(2);
    
    await db
      .update(users)
      .set({
        phpBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async subtractPhpBalance(userId: string, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentBalance = parseFloat(user.phpBalance || '0');
    const newBalance = (currentBalance - amount).toFixed(2);
    
    if (parseFloat(newBalance) < 0) {
      throw new Error('Insufficient PHP balance');
    }
    
    await db
      .update(users)
      .set({
        phpBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async addTipsBalance(userId: string, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentBalance = parseFloat(user.tipsBalance || '0');
    const newBalance = (currentBalance + amount).toFixed(2);
    
    await db
      .update(users)
      .set({
        tipsBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async addContributionsBalance(userId: string, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentBalance = parseFloat(user.contributionsBalance || '0');
    const newBalance = (currentBalance + amount).toFixed(2);
    
    await db
      .update(users)
      .set({
        contributionsBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async claimTips(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const tipsAmount = parseFloat(user.tipsBalance || '0');
    if (tipsAmount <= 0) {
      throw new Error('No tips available to claim');
    }
    
    // Apply 1% claiming fee
    const claimingFee = Math.max(tipsAmount * 0.01, 1); // 1% with ₱1 minimum
    const netAmount = tipsAmount - claimingFee;
    
    // Transfer net tips to PUSO balance (after fee) and reset tips balance
    await this.addPhpBalance(userId, netAmount);
    await db
      .update(users)
      .set({
        tipsBalance: '0.00',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
      
    return netAmount; // Return net amount received
  }

  async claimContributions(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const contributionsAmount = parseFloat(user.contributionsBalance || '0');
    if (contributionsAmount <= 0) {
      throw new Error('No contributions available to claim');
    }
    
    // Apply 1% claiming fee  
    const claimingFee = Math.max(contributionsAmount * 0.01, 1); // 1% with ₱1 minimum
    const netAmount = contributionsAmount - claimingFee;
    
    // Transfer net contributions to PUSO balance (after fee) and reset contributions balance
    await this.addPhpBalance(userId, netAmount);
    await db
      .update(users)
      .set({
        contributionsBalance: '0.00',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
      
    return netAmount; // Return net amount received
  }

  // Get all contributions for a campaign (both claimed and unclaimed)
  async getAllContributionsForCampaign(campaignId: string): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.campaignId, campaignId))
      .orderBy(desc(contributions.createdAt));
  }

  // Subtract from user's contributions balance
  async subtractUserContributionsBalance(userId: string, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentBalance = parseFloat(user.contributionsBalance || '0');
    if (currentBalance < amount) {
      throw new Error('Insufficient contributions balance');
    }
    
    const newBalance = (currentBalance - amount).toFixed(2);
    
    await db
      .update(users)
      .set({
        contributionsBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Mark contribution as refunded
  async markContributionAsRefunded(contributionId: string): Promise<void> {
    await db
      .update(contributions)
      .set({
        status: 'refunded',
        updatedAt: new Date(),
      })
      .where(eq(contributions.id, contributionId));
  }

  // Support staff invitation system
  async createSupportInvitation(email: string, invitedBy: string): Promise<SupportInvitation> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    const [invitation] = await db
      .insert(supportInvitations)
      .values({
        email,
        invitedBy,
        token,
        expiresAt,
      })
      .returning();
      
    return invitation;
  }

  async getSupportInvitation(token: string): Promise<SupportInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(supportInvitations)
      .where(eq(supportInvitations.token, token))
      .limit(1);
      
    return invitation;
  }

  async getSupportInvitationByToken(token: string): Promise<SupportInvitation | undefined> {
    return await this.getSupportInvitation(token);
  }

  async updateSupportInvitationStatus(invitationId: string, status: 'pending' | 'accepted' | 'expired'): Promise<void> {
    await db
      .update(supportInvitations)
      .set({ status })
      .where(eq(supportInvitations.id, invitationId));
  }

  async updateUserRole(userId: string, role: 'support' | 'admin'): Promise<void> {
    if (role === 'support') {
      await db
        .update(users)
        .set({ isSupport: true })
        .where(eq(users.id, userId));
    } else if (role === 'admin') {
      await db
        .update(users)
        .set({ isAdmin: true })
        .where(eq(users.id, userId));
    }
  }

  async acceptSupportInvitation(token: string): Promise<void> {
    const invitation = await this.getSupportInvitation(token);
    if (!invitation) {
      throw new Error('Invalid invitation token');
    }
    
    if (invitation.status !== 'pending') {
      throw new Error('Invitation has already been processed');
    }
    
    if (new Date() > invitation.expiresAt) {
      throw new Error('Invitation has expired');
    }
    
    // Update user to support role
    await db
      .update(users)
      .set({ isSupport: true })
      .where(eq(users.email, invitation.email));
      
    // Mark invitation as accepted
    await db
      .update(supportInvitations)
      .set({ status: 'accepted' })
      .where(eq(supportInvitations.token, token));
  }

  async getPendingSupportInvitations(): Promise<SupportInvitation[]> {
    return await db
      .select()
      .from(supportInvitations)
      .where(eq(supportInvitations.status, 'pending'))
      .orderBy(desc(supportInvitations.createdAt));
  }

  // Analytics dashboard
  async getAnalytics(): Promise<{
    totalWithdrawn: number;
    totalTipsCollected: number;
    totalContributionsCollected: number;
    totalDeposited: number;
    activeUsers: number;
    contributors: number;
    creators: number;
    volunteers: number;
    completedCampaigns: number;
    pendingCampaigns: number;
    activeCampaigns: number;
    inProgressCampaigns: number;
    fraudReportsCount: number;
    verifiedUsers: number;
  }> {
    try {
      // Simple queries to get real data
      const allUsers = await db.select().from(users);
      const allCampaigns = await db.select().from(campaigns);
      const allContributions = await db.select().from(contributions);
      const allTips = await db.select().from(tips);
      const allTransactions = await db.select().from(transactions);
      const allFraudReports = await db.select().from(fraudReports);
      const allVolunteerApps = await db.select().from(volunteerApplications);

      // Calculate counts
      const totalUsers = allUsers.length;
      const activeCampaigns = allCampaigns.filter(c => c.status === 'active').length;
      const completedCampaigns = allCampaigns.filter(c => c.status === 'completed').length;
      const pendingCampaigns = allCampaigns.filter(c => c.status === 'pending').length;
      
      // Get unique contributors and creators
      const uniqueContributors = [...new Set(allContributions.map(c => c.userId))].length;
      const uniqueCreators = [...new Set(allCampaigns.map(c => c.creatorId))].length;
      const uniqueVolunteers = [...new Set(allVolunteerApps.map(v => v.volunteerId))].length;
      
      // Get verified users
      const verifiedUsers = allUsers.filter(u => u.kycStatus === 'verified').length;
      
      // Calculate financial totals
      const totalContributions = allContributions.reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);
      const totalTips = allTips.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
      const totalDeposits = allTransactions
        .filter(t => t.type === 'deposit' && t.status === 'completed')
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
      const totalWithdrawals = allTransactions
        .filter(t => t.type === 'withdrawal' && t.status === 'completed')
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

      return {
        totalWithdrawn: totalWithdrawals,
        totalTipsCollected: totalTips,
        totalContributionsCollected: totalContributions,
        totalDeposited: totalDeposits,
        activeUsers: totalUsers,
        contributors: uniqueContributors,
        creators: uniqueCreators,
        volunteers: uniqueVolunteers,
        completedCampaigns: completedCampaigns,
        pendingCampaigns: pendingCampaigns,
        activeCampaigns: activeCampaigns,
        inProgressCampaigns: activeCampaigns, // Same as active
        fraudReportsCount: allFraudReports.length,
        verifiedUsers: verifiedUsers,
      };
    } catch (error) {
      console.error('Analytics query error:', error);
      // Return zeros if there's any error
      return {
        totalWithdrawn: 0,
        totalTipsCollected: 0,
        totalContributionsCollected: 0,
        totalDeposited: 0,
        activeUsers: 0,
        contributors: 0,
        creators: 0,
        volunteers: 0,
        completedCampaigns: 0,
        pendingCampaigns: 0,
        activeCampaigns: 0,
        inProgressCampaigns: 0,
        fraudReportsCount: 0,
        verifiedUsers: 0,
      };
    }
  }

  async getPendingTransactions(type: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.type, type),
        eq(transactions.status, 'pending')
      ))
      .orderBy(desc(transactions.createdAt));
  }

  async getUserTransactions(userId: string, limit: number = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  // Volunteer operations
  async createVolunteerOpportunity(opportunity: InsertVolunteerOpportunity): Promise<VolunteerOpportunity> {
    const [newOpportunity] = await db
      .insert(volunteerOpportunities)
      .values(opportunity)
      .returning();
    return newOpportunity;
  }

  async getVolunteerOpportunities(filters?: { status?: string; limit?: number }): Promise<VolunteerOpportunity[]> {
    // Get campaigns that have volunteer slots and need volunteers
    let campaignQuery = db.select().from(campaigns)
      .where(and(
        gt(campaigns.volunteerSlots, 0), // Has volunteer slots
        eq(campaigns.status, 'active') // Campaign is active
      ));
    
    if (filters?.limit) {
      campaignQuery = campaignQuery.limit(filters.limit);
    }
    
    const campaignsWithVolunteerSlots = await campaignQuery.orderBy(desc(campaigns.createdAt));
    
    // Convert campaigns to volunteer opportunities format
    const volunteerOpportunities: VolunteerOpportunity[] = campaignsWithVolunteerSlots.map(campaign => ({
      id: `volunteer-${campaign.id}`, // Prefix to distinguish from regular volunteer opportunities
      campaignId: campaign.id,
      title: `Volunteer for: ${campaign.title}`,
      description: campaign.description,
      location: campaign.location || 'Location TBD',
      startDate: campaign.createdAt, // Use campaign creation as start
      endDate: campaign.endDate,
      slotsNeeded: campaign.volunteerSlots,
      slotsFilled: campaign.volunteerSlotsFilledCount,
      status: campaign.status,
      createdAt: campaign.createdAt,
      // Add category and duration from campaign
      category: campaign.category,
      duration: campaign.duration,
    }));
    
    return volunteerOpportunities;
  }

  async applyForVolunteer(application: InsertVolunteerApplication): Promise<VolunteerApplication> {
    // For campaign-based volunteer applications, set opportunityId to null
    // since these don't exist in the volunteer_opportunities table
    const applicationData = {
      ...application,
      opportunityId: application.opportunityId?.startsWith('volunteer-') ? null : application.opportunityId
    };
    
    const [newApplication] = await db
      .insert(volunteerApplications)
      .values(applicationData)
      .returning();
    return newApplication;
  }

  async getVolunteerApplicationsByUser(userId: string): Promise<VolunteerApplication[]> {
    return await db
      .select()
      .from(volunteerApplications)
      .where(eq(volunteerApplications.volunteerId, userId))
      .orderBy(desc(volunteerApplications.createdAt));
  }

  // Campaign volunteer operations
  async getCampaignVolunteerApplication(campaignId: string, applicantId: string): Promise<VolunteerApplication | undefined> {
    const [application] = await db
      .select()
      .from(volunteerApplications)
      .where(
        and(
          eq(volunteerApplications.campaignId, campaignId),
          eq(volunteerApplications.volunteerId, applicantId)
        )
      );
    return application;
  }

  async createCampaignVolunteerApplication(application: { 
    campaignId: string; 
    applicantId: string; 
    intent: string; 
    telegramDisplayName: string;
    telegramUsername: string;
    status?: string 
  }): Promise<VolunteerApplication> {
    const [newApplication] = await db
      .insert(volunteerApplications)
      .values({
        campaignId: application.campaignId,
        volunteerId: application.applicantId,
        intent: application.intent,
        telegramDisplayName: application.telegramDisplayName,
        telegramUsername: application.telegramUsername,
        status: application.status || "pending",
        // Note: opportunityId is optional for campaign applications
      })
      .returning();
    return newApplication;
  }

  async getCampaignVolunteerApplications(campaignId: string): Promise<VolunteerApplication[]> {
    return await db
      .select({
        id: volunteerApplications.id,
        campaignId: volunteerApplications.campaignId,
        opportunityId: volunteerApplications.opportunityId,
        volunteerId: volunteerApplications.volunteerId,
        status: volunteerApplications.status,
        message: volunteerApplications.message,
        intent: volunteerApplications.intent,
        telegramDisplayName: volunteerApplications.telegramDisplayName,
        telegramUsername: volunteerApplications.telegramUsername,
        rejectionReason: volunteerApplications.rejectionReason,
        createdAt: volunteerApplications.createdAt,
        // Include applicant basic details
        applicantName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('applicantName'),
        applicantEmail: users.email,
        applicantKycStatus: users.kycStatus,
        applicantProfileImageUrl: users.profileImageUrl,
        // Complete volunteer profile information
        volunteerProfile: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
          phoneNumber: users.phoneNumber,
          address: users.address,
          education: users.education,
          profession: users.profession,
          workExperience: users.workExperience,
          linkedinProfile: users.linkedinProfile,
          organizationName: users.organizationName,
          organizationType: users.organizationType,
          kycStatus: users.kycStatus,
          isProfileComplete: users.isProfileComplete,
          createdAt: users.createdAt,
        }
      })
      .from(volunteerApplications)
      .innerJoin(users, eq(volunteerApplications.volunteerId, users.id))
      .where(eq(volunteerApplications.campaignId, campaignId))
      .orderBy(desc(volunteerApplications.createdAt));
  }

  async updateCampaignVolunteerApplicationStatus(
    applicationId: string, 
    status: string, 
    rejectionReason?: string
  ): Promise<VolunteerApplication | undefined> {
    const [updatedApplication] = await db
      .update(volunteerApplications)
      .set({ 
        status,
        rejectionReason: rejectionReason || null 
      })
      .where(eq(volunteerApplications.id, applicationId))
      .returning();
    return updatedApplication;
  }

  async incrementVolunteerSlotsFilledCount(campaignId: string): Promise<void> {
    await db
      .update(campaigns)
      .set({
        volunteerSlotsFilledCount: sql`${campaigns.volunteerSlotsFilledCount} + 1`
      })
      .where(eq(campaigns.id, campaignId));
  }

  // Campaign updates
  async createCampaignUpdate(update: InsertCampaignUpdate): Promise<CampaignUpdate> {
    const [newUpdate] = await db
      .insert(campaignUpdates)
      .values(update)
      .returning();
    return newUpdate;
  }

  async getCampaignUpdates(campaignId: string): Promise<CampaignUpdate[]> {
    return await db
      .select()
      .from(campaignUpdates)
      .where(eq(campaignUpdates.campaignId, campaignId))
      .orderBy(desc(campaignUpdates.createdAt));
  }

  // Admin operations
  async getPendingCampaigns(): Promise<any[]> {
    return await db
      .select({
        // Campaign fields
        id: campaigns.id,
        creatorId: campaigns.creatorId,
        title: campaigns.title,
        description: campaigns.description,
        category: campaigns.category,
        goalAmount: campaigns.goalAmount,
        minimumAmount: campaigns.minimumAmount,
        currentAmount: campaigns.currentAmount,
        claimedAmount: campaigns.claimedAmount,
        images: campaigns.images,
        status: campaigns.status,
        tesVerified: campaigns.tesVerified,
        duration: campaigns.duration,
        street: campaigns.street,
        barangay: campaigns.barangay,
        city: campaigns.city,
        province: campaigns.province,
        region: campaigns.region,
        zipcode: campaigns.zipcode,
        landmark: campaigns.landmark,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        needsVolunteers: campaigns.needsVolunteers,
        volunteerSlots: campaigns.volunteerSlots,
        volunteerSlotsFilledCount: campaigns.volunteerSlotsFilledCount,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        // Creator fields
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
        creatorEmail: users.email,
        creatorKycStatus: users.kycStatus,
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .where(eq(campaigns.status, "pending"))
      .orderBy(desc(campaigns.createdAt));
  }

  async getPendingKYC(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.kycStatus, "pending"))
      .orderBy(desc(users.createdAt));
  }

  async getVerifiedUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.kycStatus, "verified"))
      .orderBy(desc(users.updatedAt));
  }

  async getRejectedKYC(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.kycStatus, "rejected"))
      .orderBy(desc(users.updatedAt));
  }

  async getSuspendedUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.kycStatus, "suspended"))
      .orderBy(desc(users.updatedAt));
  }

  async getFlaggedCampaigns(): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, "flagged"))
      .orderBy(desc(campaigns.createdAt));
  }

  async getFlaggedCreators(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isFlagged, true))
      .orderBy(desc(users.flaggedAt));
  }

  async getCampaignsByCreatorId(creatorId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.creatorId, creatorId))
      .orderBy(desc(campaigns.createdAt));
  }

  // Blockchain-related operations

  async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<void> {
    await db
      .update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactions.id, transactionId));
  }

  async getTransaction(transactionId: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId));
    return transaction;
  }

  // Payment record operations
  async createPaymentRecord(paymentData: InsertPaymentRecord): Promise<PaymentRecord> {
    const [payment] = await db
      .insert(paymentRecords)
      .values(paymentData)
      .returning();
    return payment;
  }

  async updatePaymentRecord(paymentId: string, updates: Partial<PaymentRecord>): Promise<void> {
    await db
      .update(paymentRecords)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentRecords.id, paymentId));
  }

  async getPaymentRecordByPaymongoId(paymongoId: string): Promise<PaymentRecord | undefined> {
    const [payment] = await db
      .select()
      .from(paymentRecords)
      .where(eq(paymentRecords.paymongoPaymentId, paymongoId));
    return payment;
  }

  // Exchange rate operations
  async createExchangeRate(rateData: InsertExchangeRate): Promise<ExchangeRate> {
    const [rate] = await db
      .insert(exchangeRates)
      .values(rateData)
      .returning();
    return rate;
  }

  async getActiveExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | undefined> {
    const [rate] = await db
      .select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.fromCurrency, fromCurrency),
          eq(exchangeRates.toCurrency, toCurrency),
          eq(exchangeRates.isActive, true)
        )
      )
      .orderBy(desc(exchangeRates.createdAt))
      .limit(1);
    return rate;
  }

  // Featured campaigns - high credibility creators
  async getFeaturedCampaigns(limit: number = 10): Promise<Campaign[]> {
    try {
      // For simplicity, return active campaigns with highest current amounts for now
      // This represents "successful" campaigns that are gaining traction
      const featuredCampaigns = await db
        .select({
          ...campaigns,
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
        })
        .from(campaigns)
        .leftJoin(users, eq(campaigns.creatorId, users.id))
        .where(eq(campaigns.status, 'active'))
        .orderBy(
          sql`
            CASE WHEN ${users.kycStatus} = 'verified' THEN 1 ELSE 0 END DESC,
            CAST(${campaigns.currentAmount} AS DECIMAL) DESC,
            ${campaigns.createdAt} DESC
          `
        )
        .limit(limit);

      return featuredCampaigns as any;
    } catch (error) {
      console.error("Error in getFeaturedCampaigns:", error);
      // Fallback to recent active campaigns with creator info
      return await db
        .select({
          ...campaigns,
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
        })
        .from(campaigns)
        .leftJoin(users, eq(campaigns.creatorId, users.id))
        .where(eq(campaigns.status, 'active'))
        .orderBy(desc(campaigns.createdAt))
        .limit(limit) as any;
    }
  }

  // Recommended campaigns based on user interests
  async getRecommendedCampaigns(userId: string, limit: number = 10): Promise<Campaign[]> {
    try {
      // Get user's contribution history to determine interests
      const userContributions = await this.getContributionsByUser(userId);
      
      if (userContributions.length === 0) {
        // If no contribution history, return recent active campaigns
        return await db
          .select({
            ...campaigns,
            creatorFirstName: users.firstName,
            creatorLastName: users.lastName,
            creatorEmail: users.email,
          })
          .from(campaigns)
          .leftJoin(users, eq(campaigns.creatorId, users.id))
          .where(eq(campaigns.status, 'active'))
          .orderBy(desc(campaigns.createdAt))
          .limit(limit) as any;
      }

      // Get campaigns the user has contributed to
      const contributedCampaignIds = userContributions.map(c => c.campaignId);
      
      if (contributedCampaignIds.length === 0) {
        return await db
          .select({
            ...campaigns,
            creatorFirstName: users.firstName,
            creatorLastName: users.lastName,
            creatorEmail: users.email,
          })
          .from(campaigns)
          .leftJoin(users, eq(campaigns.creatorId, users.id))
          .where(eq(campaigns.status, 'active'))
          .orderBy(desc(campaigns.createdAt))
          .limit(limit) as any;
      }

      // Get the categories of campaigns user has contributed to
      const contributedCampaigns = await db
        .select()
        .from(campaigns)
        .where(sql`${campaigns.id} = ANY(ARRAY[${contributedCampaignIds.map(id => `'${id}'`).join(',')}])`);

      // Calculate category preferences based on contribution amounts
      const categoryPreferences: Record<string, number> = {};
      for (const contribution of userContributions) {
        const campaign = contributedCampaigns.find(c => c.id === contribution.campaignId);
        if (campaign) {
          const amount = parseFloat(contribution.amount || '0');
          categoryPreferences[campaign.category] = (categoryPreferences[campaign.category] || 0) + amount;
        }
      }

      // Get top preferred categories
      const preferredCategories = Object.entries(categoryPreferences)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([category]) => category);

      if (preferredCategories.length === 0) {
        // Fallback to recent active campaigns
        return await db
          .select({
            ...campaigns,
            creatorFirstName: users.firstName,
            creatorLastName: users.lastName,
            creatorEmail: users.email,
          })
          .from(campaigns)
          .leftJoin(users, eq(campaigns.creatorId, users.id))
          .where(eq(campaigns.status, 'active'))
          .orderBy(desc(campaigns.createdAt))
          .limit(limit) as any;
      }

      // Find campaigns in preferred categories
      return await db
        .select({
          ...campaigns,
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
        })
        .from(campaigns)
        .leftJoin(users, eq(campaigns.creatorId, users.id))
        .where(
          and(
            eq(campaigns.status, 'active'),
            sql`${campaigns.category} = ANY(ARRAY[${preferredCategories.map(cat => `'${cat}'`).join(',')}])`
          )
        )
        .orderBy(desc(campaigns.createdAt))
        .limit(limit) as any;

    } catch (error) {
      console.error("Error in getRecommendedCampaigns:", error);
      // Fallback to recent active campaigns
      return await db
        .select({
          ...campaigns,
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
        })
        .from(campaigns)
        .leftJoin(users, eq(campaigns.creatorId, users.id))
        .where(eq(campaigns.status, 'active'))
        .orderBy(desc(campaigns.createdAt))
        .limit(limit) as any;
    }
  }

  // Admin transaction search functionality
  async searchTransactions(params: {
    email?: string;
    transactionId?: string;
    amount?: string;
    type?: string;
  }): Promise<any[]> {
    let query = db
      .select({
        // Transaction fields
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        description: transactions.description,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        transactionHash: transactions.transactionHash,
        blockNumber: transactions.blockNumber,
        exchangeRate: transactions.exchangeRate,
        feeAmount: transactions.feeAmount,
        paymentProvider: transactions.paymentProvider,
        paymentProviderTxId: transactions.paymentProviderTxId,
        userId: transactions.userId,
        // User fields with aliases to avoid conflicts
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userPusoBalance: users.phpBalance,
        userTipsBalance: users.tipsBalance,
        userContributionsBalance: users.contributionsBalance,
        userKycStatus: users.kycStatus,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id));

    const conditions = [];

    // Search by email
    if (params.email) {
      conditions.push(eq(users.email, params.email));
    }

    // Search by transaction ID
    if (params.transactionId) {
      conditions.push(eq(transactions.id, params.transactionId));
    }

    // Search by amount
    if (params.amount) {
      conditions.push(eq(transactions.amount, params.amount));
    }

    // Filter by transaction type - now includes ALL types
    if (params.type) {
      conditions.push(eq(transactions.type, params.type));
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(transactions.createdAt))
      .limit(50); // Limit results for performance

    // Format results for frontend with full backend details
    return results.map(result => ({
      id: result.id,
      type: result.type,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      description: result.description,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      exchangeRate: result.exchangeRate,
      feeAmount: result.feeAmount,
      paymentProvider: result.paymentProvider,
      paymentProviderTxId: result.paymentProviderTxId,
      user: {
        id: result.userId,
        email: result.userEmail,
        firstName: result.userFirstName,
        lastName: result.userLastName,
        phpBalance: result.userPusoBalance,
        tipsBalance: result.userTipsBalance,
        contributionsBalance: result.userContributionsBalance,
        kycStatus: result.userKycStatus,
      },
      // Calculate PHP equivalent for display
      phpEquivalent: result.exchangeRate 
        ? (parseFloat(result.amount) * parseFloat(result.exchangeRate)).toFixed(2)
        : result.amount
    }));
  }

  // Admin transaction processing methods
  async processTransaction(transactionId: string): Promise<void> {
    try {
      // Update transaction status to completed
      await db.update(transactions)
        .set({ 
          status: 'completed',
          updatedAt: new Date()
        })
        .where(eq(transactions.id, transactionId));
      
      console.log('   Transaction marked as completed:', transactionId);
    } catch (error) {
      console.error('Error processing transaction:', error);
      throw error;
    }
  }

  async rejectTransaction(transactionId: string): Promise<void> {
    try {
      // Update transaction status to failed/rejected
      await db.update(transactions)
        .set({ 
          status: 'failed',
          updatedAt: new Date()
        })
        .where(eq(transactions.id, transactionId));
      
      console.log('   Transaction marked as rejected/failed:', transactionId);
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      throw error;
    }
  }

  // Tip operations
  async createTip(tipData: InsertTip): Promise<Tip> {
    const [tip] = await db.insert(tips).values(tipData).returning();
    
    // Also add to the creator's tips balance
    await this.addTipsBalance(tipData.creatorId, parseFloat(tipData.amount));
    
    // Create transaction record for the tip
    await this.createTransaction({
      userId: tipData.tipperId,
      campaignId: tipData.campaignId,
      type: 'tip',
      amount: tipData.amount,
      currency: 'PUSO',
      description: `Tip to creator: ${tipData.amount} PUSO`,
      status: 'completed',
    });
    
    console.log('💰 Tip created:', tip.amount, 'PUSO to creator:', tipData.creatorId);
    return tip;
  }

  async getTipsByCreator(creatorId: string): Promise<Tip[]> {
    return await db.select().from(tips).where(eq(tips.creatorId, creatorId)).orderBy(desc(tips.createdAt));
  }

  async getTipsByCampaign(campaignId: string): Promise<Tip[]> {
    return await db.select().from(tips).where(eq(tips.campaignId, campaignId)).orderBy(desc(tips.createdAt));
  }

  // Claim tips for a specific campaign to tip wallet
  async claimCampaignTips(userId: string, campaignId: string, requestedAmount: number): Promise<{ claimedAmount: number; tipCount: number }> {
    return await db.transaction(async (tx) => {
      // Get tips for this campaign that belong to this user
      const campaignTips = await tx
        .select()
        .from(tips)
        .where(and(eq(tips.campaignId, campaignId), eq(tips.creatorId, userId)))
        .orderBy(desc(tips.createdAt));

      if (campaignTips.length === 0) {
        throw new Error('No tips available to claim for this campaign');
      }

      // Calculate total available tips
      const totalAvailableTips = campaignTips.reduce((sum, tip) => sum + parseFloat(tip.amount), 0);
      
      // Validate requested amount
      if (requestedAmount > totalAvailableTips) {
        throw new Error(`Cannot claim ₱${requestedAmount}. Only ₱${totalAvailableTips} available in tips for this campaign.`);
      }

      // Select tips to claim up to the requested amount
      let amountToClaim = 0;
      let tipsToRemove: string[] = [];
      let partialTipId: string | null = null;
      let partialTipRemainder = 0;
      
      for (const tip of campaignTips) {
        const tipAmount = parseFloat(tip.amount);
        
        if (amountToClaim + tipAmount <= requestedAmount) {
          // Can claim the whole tip
          amountToClaim += tipAmount;
          tipsToRemove.push(tip.id);
          
          if (amountToClaim === requestedAmount) {
            break;
          }
        } else if (amountToClaim < requestedAmount) {
          // Claim partial amount from this tip
          const remainingToClaimable = requestedAmount - amountToClaim;
          amountToClaim += remainingToClaimable;
          partialTipId = tip.id;
          partialTipRemainder = tipAmount - remainingToClaimable;
          break;
        }
      }

      // Ensure we can claim at least something
      if (amountToClaim === 0) {
        // If we can't claim exact amount, claim as much as possible
        amountToClaim = Math.min(requestedAmount, totalAvailableTips);
        if (amountToClaim > 0) {
          // Just claim from the first tip available
          const firstTip = campaignTips[0];
          const firstTipAmount = parseFloat(firstTip.amount);
          if (firstTipAmount >= amountToClaim) {
            partialTipId = firstTip.id;
            partialTipRemainder = firstTipAmount - amountToClaim;
          } else {
            amountToClaim = firstTipAmount;
            tipsToRemove.push(firstTip.id);
          }
        }
      }

      if (amountToClaim === 0) {
        throw new Error('No tips can be claimed for the requested amount');
      }

      // Add to user's tip wallet balance
      const user = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length === 0) {
        throw new Error('User not found');
      }

      const currentTipsBalance = parseFloat(user[0].tipsBalance || '0');
      const newTipsBalance = currentTipsBalance + amountToClaim;

      await tx
        .update(users)
        .set({
          tipsBalance: newTipsBalance.toString(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Remove the claimed tips
      if (tipsToRemove.length > 0) {
        await tx.delete(tips).where(inArray(tips.id, tipsToRemove));
      }

      // Update partial tip if applicable
      if (partialTipId && partialTipRemainder > 0) {
        await tx
          .update(tips)
          .set({
            amount: partialTipRemainder.toString()
          })
          .where(eq(tips.id, partialTipId));
      } else if (partialTipId) {
        // If remainder is 0, delete the tip
        await tx.delete(tips).where(eq(tips.id, partialTipId));
      }

      return {
        claimedAmount: amountToClaim,
        tipCount: tipsToRemove.length
      };
    });
  }

  // Admin balance correction methods
  async correctPhpBalance(userId: string, newBalance: number, reason: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Update user balance
      await tx
        .update(users)
        .set({ 
          phpBalance: newBalance.toString(),
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId));

      // Record the correction transaction
      await tx.insert(transactions).values({
        userId,
        type: 'balance_correction',
        amount: newBalance.toString(),
        status: 'completed',
        description: `Admin balance correction: ${reason}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }

  async correctTipsBalance(userId: string, newBalance: number, reason: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ 
          tipsBalance: newBalance.toString(),
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId));

      await tx.insert(transactions).values({
        userId,
        type: 'tips_correction',
        amount: newBalance.toString(),
        status: 'completed',
        description: `Admin tips balance correction: ${reason}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }

  async correctContributionsBalance(userId: string, newBalance: number, reason: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ 
          contributionsBalance: newBalance.toString(),
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId));

      await tx.insert(transactions).values({
        userId,
        type: 'contributions_correction',
        amount: newBalance.toString(),
        status: 'completed',
        description: `Admin contributions balance correction: ${reason}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }

  async updateTransactionStatus(transactionId: string, status: string, reason: string): Promise<void> {
    await db
      .update(transactions)
      .set({ 
        status,
        description: reason ? `${reason}` : undefined,
        updatedAt: new Date() 
      })
      .where(eq(transactions.id, transactionId));
  }

  async getTransactionById(transactionId: string): Promise<any> {
    const [result] = await db
      .select({
        transaction: {
          id: transactions.id,
          type: transactions.type,
          amount: transactions.amount,
          status: transactions.status,
          description: transactions.description,
          createdAt: transactions.createdAt,
          updatedAt: transactions.updatedAt,
          transactionHash: transactions.transactionHash,
          exchangeRate: transactions.exchangeRate,
          feeAmount: transactions.feeAmount,
          paymentProvider: transactions.paymentProvider,
        },
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phpBalance: users.phpBalance,
          tipsBalance: users.tipsBalance,
          contributionsBalance: users.contributionsBalance,
        },
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.id, transactionId));

    if (!result) return null;

    return {
      id: result.transaction.id,
      type: result.transaction.type,
      amount: result.transaction.amount,
      status: result.transaction.status,
      description: result.transaction.description,
      createdAt: result.transaction.createdAt,
      updatedAt: result.transaction.updatedAt,
      transactionHash: result.transaction.transactionHash,
      exchangeRate: result.transaction.exchangeRate,
      feeAmount: result.transaction.feeAmount,
      paymentProvider: result.transaction.paymentProvider,
      user: result.user,
      phpAmount: result.transaction.type === 'withdrawal' 
        ? (parseFloat(result.transaction.amount) * parseFloat(result.transaction.exchangeRate || '1')).toFixed(2)
        : result.transaction.amount
    };
  }

  async getDepositTransactions(): Promise<any[]> {
    const result = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        description: transactions.description,
        paymentProvider: transactions.paymentProvider,
        paymentProviderTxId: transactions.paymentProviderTxId,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.type, 'deposit'))
      .orderBy(desc(transactions.createdAt));

    return result;
  }

  async getWithdrawalTransactions(): Promise<any[]> {
    const result = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        description: transactions.description,
        paymentProvider: transactions.paymentProvider,
        paymentProviderTxId: transactions.paymentProviderTxId,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.type, 'withdrawal'))
      .orderBy(desc(transactions.createdAt));

    return result;
  }

  // Admin Financial Management implementations

  async claimFraudReport(reportId: string, adminId: string): Promise<boolean> {
    const result = await db
      .update(fraudReports)
      .set({
        claimedBy: adminId,
        claimedAt: new Date(),
        status: 'claimed',
      })
      .where(
        and(
          eq(fraudReports.id, reportId),
          or(
            isNull(fraudReports.claimedBy),
            eq(fraudReports.claimedBy, adminId)
          ),
          inArray(fraudReports.status, ['pending', 'investigating'])
        )
      )
      .returning({ id: fraudReports.id });
    
    return result.length > 0;
  }

  async claimSupportRequest(requestId: string, adminId: string): Promise<boolean> {
    const result = await db
      .update(supportRequests)
      .set({
        claimedBy: adminId,
        claimedAt: new Date(),
        status: 'claimed',
      })
      .where(
        and(
          eq(supportRequests.id, requestId),
          or(
            isNull(supportRequests.claimedBy),
            eq(supportRequests.claimedBy, adminId)
          ),
          inArray(supportRequests.status, ['pending', 'investigating'])
        )
      )
      .returning({ id: supportRequests.id });
    
    return result.length > 0;
  }

  async getFraudReport(reportId: string): Promise<any> {
    const [report] = await db
      .select()
      .from(fraudReports)
      .where(eq(fraudReports.id, reportId))
      .limit(1);
    return report;
  }

  async getSupportRequest(requestId: string): Promise<any> {
    const [request] = await db
      .select()
      .from(supportRequests)
      .where(eq(supportRequests.id, requestId))
      .limit(1);
    return request;
  }

  async getAdminClaimedReports(adminId: string): Promise<{
    fraudReports: any[];
    supportRequests: any[];
  }> {
    // Get claimed fraud reports
    const claimedFraudReports = await db
      .select({
        id: fraudReports.id,
        reportType: fraudReports.reportType,
        description: fraudReports.description,
        status: fraudReports.status,
        relatedId: fraudReports.relatedId,
        relatedType: fraudReports.relatedType,
        evidenceUrls: fraudReports.evidenceUrls,
        claimedAt: fraudReports.claimedAt,
        createdAt: fraudReports.createdAt,
        reporter: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(fraudReports)
      .leftJoin(users, eq(fraudReports.reporterId, users.id))
      .where(eq(fraudReports.claimedBy, adminId))
      .orderBy(desc(fraudReports.claimedAt));

    // Get claimed support requests
    const claimedSupportRequests = await db
      .select({
        id: supportRequests.id,
        requestType: supportRequests.requestType,
        reason: supportRequests.reason,
        status: supportRequests.status,
        currentCredibilityScore: supportRequests.currentCredibilityScore,
        attachments: supportRequests.attachments,
        claimedAt: supportRequests.claimedAt,
        submittedAt: supportRequests.submittedAt,
        eligibleForReviewAt: supportRequests.eligibleForReviewAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(supportRequests)
      .leftJoin(users, eq(supportRequests.userId, users.id))
      .where(eq(supportRequests.claimedBy, adminId))
      .orderBy(desc(supportRequests.claimedAt));

    return {
      fraudReports: claimedFraudReports,
      supportRequests: claimedSupportRequests,
    };
  }

  async getContributionsAndTips(): Promise<any[]> {
    // Get contributions
    const contributionsResult = await db
      .select({
        id: contributions.id,
        type: sql<string>`'contribution'`,
        amount: contributions.amount,
        message: contributions.message,
        isAnonymous: contributions.isAnonymous,
        transactionHash: contributions.transactionHash,
        createdAt: contributions.createdAt,
        contributor: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
          creatorId: campaigns.creatorId,
        }
      })
      .from(contributions)
      .leftJoin(users, eq(contributions.contributorId, users.id))
      .leftJoin(campaigns, eq(contributions.campaignId, campaigns.id))
      .orderBy(desc(contributions.createdAt));

    // Get tips
    const tipsResult = await db
      .select({
        id: tips.id,
        type: sql<string>`'tip'`,
        amount: tips.amount,
        message: tips.message,
        isAnonymous: tips.isAnonymous,
        transactionHash: sql<string>`NULL`,
        createdAt: tips.createdAt,
        contributor: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
          creatorId: campaigns.creatorId,
        }
      })
      .from(tips)
      .leftJoin(users, eq(tips.tipperId, users.id))
      .leftJoin(campaigns, eq(tips.campaignId, campaigns.id))
      .orderBy(desc(tips.createdAt));

    // Combine and sort
    const combined = [...contributionsResult, ...tipsResult];
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return combined;
  }

  async getClaimedTips(): Promise<any[]> {
    const result = await db
      .select({
        transaction: {
          id: transactions.id,
          type: transactions.type,
          amount: transactions.amount,
          description: transactions.description,
          status: transactions.status,
          createdAt: transactions.createdAt,
        },
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          tipsBalance: users.tipsBalance,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(sql`${transactions.type} IN ('tip', 'conversion') AND ${transactions.description} LIKE '%tip%'`)
      .orderBy(desc(transactions.createdAt));
    
    return result;
  }

  async getClaimedContributions(): Promise<any[]> {
    const result = await db
      .select({
        transaction: {
          id: transactions.id,
          type: transactions.type,
          amount: transactions.amount,
          description: transactions.description,
          status: transactions.status,
          createdAt: transactions.createdAt,
        },
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          contributionsBalance: users.contributionsBalance,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(campaigns, eq(transactions.campaignId, campaigns.id))
      .where(sql`${transactions.type} IN ('contribution', 'conversion') AND ${transactions.description} LIKE '%contribution%'`)
      .orderBy(desc(transactions.createdAt));
    
    return result;
  }

  async getAllTransactionHistories(): Promise<any[]> {
    const result = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        description: transactions.description,
        status: transactions.status,
        transactionHash: transactions.transactionHash,
        blockNumber: transactions.blockNumber,
        paymentProvider: transactions.paymentProvider,
        paymentProviderTxId: transactions.paymentProviderTxId,
        exchangeRate: transactions.exchangeRate,
        feeAmount: transactions.feeAmount,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phpBalance: users.phpBalance,
          tipsBalance: users.tipsBalance,
          contributionsBalance: users.contributionsBalance,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(campaigns, eq(transactions.campaignId, campaigns.id))
      .orderBy(desc(transactions.createdAt));
    
    return result;
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return result;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  // Campaign engagement operations
  async toggleCampaignReaction(campaignId: string, userId: string, reactionType: string): Promise<CampaignReaction | null> {
    // Check if reaction already exists
    const [existingReaction] = await db
      .select()
      .from(campaignReactions)
      .where(and(
        eq(campaignReactions.campaignId, campaignId),
        eq(campaignReactions.userId, userId)
      ));

    if (existingReaction) {
      if (existingReaction.reactionType === reactionType) {
        // Same reaction - remove it
        await db
          .delete(campaignReactions)
          .where(eq(campaignReactions.id, existingReaction.id));
        return null;
      } else {
        // Different reaction - update it
        const [updated] = await db
          .update(campaignReactions)
          .set({ reactionType, createdAt: new Date() })
          .where(eq(campaignReactions.id, existingReaction.id))
          .returning();
        return updated;
      }
    } else {
      // No existing reaction - create new one
      const [newReaction] = await db
        .insert(campaignReactions)
        .values({ campaignId, userId, reactionType })
        .returning();
      return newReaction;
    }
  }

  async getCampaignReactions(campaignId: string): Promise<{ [key: string]: { count: number; users: string[] } }> {
    const reactions = await db
      .select({
        reactionType: campaignReactions.reactionType,
        userId: campaignReactions.userId,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(campaignReactions)
      .leftJoin(users, eq(campaignReactions.userId, users.id))
      .where(eq(campaignReactions.campaignId, campaignId));

    const grouped: { [key: string]: { count: number; users: string[] } } = {};
    
    reactions.forEach(reaction => {
      if (!grouped[reaction.reactionType]) {
        grouped[reaction.reactionType] = { count: 0, users: [] };
      }
      grouped[reaction.reactionType].count++;
      const userName = `${reaction.firstName || ''} ${reaction.lastName || ''}`.trim() || 'Anonymous';
      grouped[reaction.reactionType].users.push(userName);
    });

    return grouped;
  }

  async getCampaignReactionByUser(campaignId: string, userId: string): Promise<CampaignReaction | undefined> {
    const [reaction] = await db
      .select()
      .from(campaignReactions)
      .where(and(
        eq(campaignReactions.campaignId, campaignId),
        eq(campaignReactions.userId, userId)
      ));
    return reaction;
  }

  // Campaign comment operations
  async createCampaignComment(comment: InsertCampaignComment): Promise<CampaignComment> {
    const [result] = await db
      .insert(campaignComments)
      .values(comment)
      .returning();
    return result;
  }

  async getCampaignComments(campaignId: string): Promise<(CampaignComment & { user: User; replies: (CommentReply & { user: User })[] })[]> {
    const comments = await db
      .select({
        comment: campaignComments,
        user: users,
      })
      .from(campaignComments)
      .leftJoin(users, eq(campaignComments.userId, users.id))
      .where(eq(campaignComments.campaignId, campaignId))
      .orderBy(desc(campaignComments.createdAt));

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async ({ comment, user }) => {
        const replies = await this.getCommentReplies(comment.id);
        return {
          ...comment,
          user: user!,
          replies,
        };
      })
    );

    return commentsWithReplies;
  }

  async updateCampaignComment(commentId: string, content: string, userId: string): Promise<CampaignComment | undefined> {
    const [updated] = await db
      .update(campaignComments)
      .set({ content, isEdited: true, updatedAt: new Date() })
      .where(and(
        eq(campaignComments.id, commentId),
        eq(campaignComments.userId, userId)
      ))
      .returning();
    return updated;
  }

  async deleteCampaignComment(commentId: string, userId: string): Promise<void> {
    // Delete all replies first
    await db
      .delete(commentReplies)
      .where(eq(commentReplies.commentId, commentId));

    // Delete the comment
    await db
      .delete(campaignComments)
      .where(and(
        eq(campaignComments.id, commentId),
        eq(campaignComments.userId, userId)
      ));
  }

  // Comment reply operations
  async createCommentReply(reply: InsertCommentReply): Promise<CommentReply> {
    const [result] = await db
      .insert(commentReplies)
      .values(reply)
      .returning();
    return result;
  }

  async getCommentReplies(commentId: string): Promise<(CommentReply & { user: User })[]> {
    const replies = await db
      .select({
        reply: commentReplies,
        user: users,
      })
      .from(commentReplies)
      .leftJoin(users, eq(commentReplies.userId, users.id))
      .where(eq(commentReplies.commentId, commentId))
      .orderBy(commentReplies.createdAt);

    return replies.map(({ reply, user }) => ({
      ...reply,
      user: user!,
    }));
  }

  async updateCommentReply(replyId: string, content: string, userId: string): Promise<CommentReply | undefined> {
    const [updated] = await db
      .update(commentReplies)
      .set({ content, isEdited: true, updatedAt: new Date() })
      .where(and(
        eq(commentReplies.id, replyId),
        eq(commentReplies.userId, userId)
      ))
      .returning();
    return updated;
  }

  async deleteCommentReply(replyId: string, userId: string): Promise<void> {
    await db
      .delete(commentReplies)
      .where(and(
        eq(commentReplies.id, replyId),
        eq(commentReplies.userId, userId)
      ));
  }

  // Progress Report operations
  async getProgressReportsForCampaign(campaignId: string): Promise<ProgressReport[]> {
    const reports = await db.select().from(progressReports)
      .where(eq(progressReports.campaignId, campaignId))
      .orderBy(desc(progressReports.reportDate));

    const reportsWithDetails = await Promise.all(
      reports.map(async (report) => {
        const createdBy = await this.getUser(report.createdById);
        const documents = await this.getProgressReportDocuments(report.id);
        const creditScore = await this.getProgressReportCreditScore(report.id);
        return { ...report, createdBy, documents, creditScore };
      })
    );

    return reportsWithDetails;
  }

  async createProgressReport(report: InsertProgressReport): Promise<ProgressReport> {
    const [newReport] = await db
      .insert(progressReports)
      .values(report)
      .returning();

    const createdBy = await this.getUser(newReport.createdById);
    return { ...newReport, createdBy, documents: [], creditScore: null };
  }

  async getProgressReport(reportId: string): Promise<ProgressReport | null> {
    const [report] = await db.select().from(progressReports)
      .where(eq(progressReports.id, reportId))
      .limit(1);

    if (!report) {
      return null;
    }

    const createdBy = await this.getUser(report.createdById);
    const documents = await this.getProgressReportDocuments(report.id);
    const creditScore = await this.getProgressReportCreditScore(report.id);
    return { ...report, createdBy, documents, creditScore };
  }

  async updateProgressReport(reportId: string, updates: Partial<InsertProgressReport>): Promise<ProgressReport> {
    const [updatedReport] = await db
      .update(progressReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(progressReports.id, reportId))
      .returning();

    const createdBy = await this.getUser(updatedReport.createdById);
    const documents = await this.getProgressReportDocuments(updatedReport.id);
    const creditScore = await this.getProgressReportCreditScore(updatedReport.id);
    return { ...updatedReport, createdBy, documents, creditScore };
  }

  async deleteProgressReport(reportId: string): Promise<void> {
    // Delete related documents and credit scores first
    await db.delete(progressReportDocuments).where(eq(progressReportDocuments.progressReportId, reportId));
    await db.delete(userCreditScores).where(eq(userCreditScores.progressReportId, reportId));
    await db.delete(progressReports).where(eq(progressReports.id, reportId));
  }

  // Progress Report Document operations
  async getProgressReportDocuments(reportId: string): Promise<ProgressReportDocument[]> {
    return await db.select().from(progressReportDocuments)
      .where(eq(progressReportDocuments.progressReportId, reportId))
      .orderBy(progressReportDocuments.createdAt);
  }

  async createProgressReportDocument(document: InsertProgressReportDocument): Promise<ProgressReportDocument> {
    const [newDocument] = await db
      .insert(progressReportDocuments)
      .values(document)
      .returning();

    // Update credit score after adding document
    await this.updateProgressReportCreditScore(document.progressReportId);
    
    return newDocument;
  }

  async deleteProgressReportDocument(documentId: string): Promise<void> {
    const document = await db.select({ progressReportId: progressReportDocuments.progressReportId })
      .from(progressReportDocuments)
      .where(eq(progressReportDocuments.id, documentId))
      .limit(1);

    await db.delete(progressReportDocuments).where(eq(progressReportDocuments.id, documentId));

    // Update credit score after removing document
    if (document[0]) {
      await this.updateProgressReportCreditScore(document[0].progressReportId);
    }
  }

  // Generate a shortened ID from a file URL (like Facebook's approach)
  generateDocumentShortId(fileUrl: string): string {
    // Extract meaningful part from the URL and create a short hash
    const urlPath = fileUrl.split('/').pop() || fileUrl;
    const hash = crypto.createHash('md5').update(urlPath).digest('hex');
    return hash.substring(0, 8).toUpperCase(); // 8-character uppercase ID
  }

  async getDocumentById(documentId: string): Promise<any> {
    const [document] = await db
      .select({
        id: progressReportDocuments.id,
        fileName: progressReportDocuments.fileName,
        fileUrl: progressReportDocuments.fileUrl,
        fileSize: progressReportDocuments.fileSize,
        documentType: progressReportDocuments.documentType,
        description: progressReportDocuments.description,
        createdAt: progressReportDocuments.createdAt,
        progressReport: {
          id: progressReports.id,
          title: progressReports.title,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
          creator: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        },
      })
      .from(progressReportDocuments)
      .leftJoin(progressReports, eq(progressReportDocuments.progressReportId, progressReports.id))
      .leftJoin(campaigns, eq(progressReports.campaignId, campaigns.id))
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .where(eq(progressReportDocuments.id, documentId))
      .limit(1);
    
    if (!document) return null;

    // Convert the signed URL to a proper streaming endpoint path
    const objectStorageService = new ObjectStorageService();
    const normalizedPath = objectStorageService.normalizeObjectEntityPath(document.fileUrl);

    return {
      ...document,
      shortId: this.generateDocumentShortId(document.fileUrl),
      // Use the streaming endpoint instead of expired signed URL
      viewUrl: normalizedPath
    };
  }

  async getDocumentByShortId(shortId: string): Promise<any> {
    // Get all documents and find the one that matches the short ID
    const documents = await db
      .select({
        id: progressReportDocuments.id,
        fileName: progressReportDocuments.fileName,
        fileUrl: progressReportDocuments.fileUrl,
        fileSize: progressReportDocuments.fileSize,
        documentType: progressReportDocuments.documentType,
        description: progressReportDocuments.description,
        createdAt: progressReportDocuments.createdAt,
        progressReport: {
          id: progressReports.id,
          title: progressReports.title,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
          creator: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        },
      })
      .from(progressReportDocuments)
      .leftJoin(progressReports, eq(progressReportDocuments.progressReportId, progressReports.id))
      .leftJoin(campaigns, eq(progressReports.campaignId, campaigns.id))
      .leftJoin(users, eq(campaigns.creatorId, users.id));
    
    // Find document that matches the short ID
    const matchingDocument = documents.find(doc => 
      this.generateDocumentShortId(doc.fileUrl) === shortId.toUpperCase()
    );
    
    if (!matchingDocument) return null;

    // Convert the signed URL to a proper streaming endpoint path
    const objectStorageService = new ObjectStorageService();
    const normalizedPath = objectStorageService.normalizeObjectEntityPath(matchingDocument.fileUrl);

    return {
      ...matchingDocument,
      shortId: shortId.toUpperCase(),
      // Use the streaming endpoint instead of expired signed URL
      viewUrl: normalizedPath
    };
  }

  // Credit Score operations
  async getProgressReportCreditScore(reportId: string): Promise<UserCreditScore | null> {
    const [creditScore] = await db.select().from(userCreditScores)
      .where(eq(userCreditScores.progressReportId, reportId))
      .limit(1);

    return creditScore || null;
  }

  async updateProgressReportCreditScore(reportId: string): Promise<UserCreditScore> {
    // Get report details
    const [report] = await db.select().from(progressReports)
      .where(eq(progressReports.id, reportId))
      .limit(1);

    if (!report) {
      throw new Error('Progress report not found');
    }

    // Get all documents for this report
    const documents = await this.getProgressReportDocuments(reportId);
    
    // Calculate unique document types completed
    const completedTypes = [...new Set(documents.map(doc => doc.documentType))];
    
    // Required document types for 100% score
    const requiredTypes = [
      'image', 'video_link', 'official_receipt', 
      'acknowledgement_receipt', 'expense_summary',
      'invoice', 'contract', 'other'
    ];
    
    // Calculate score percentage
    const scorePercentage = Math.round((completedTypes.length / requiredTypes.length) * 100);
    
    // Check if credit score already exists
    const [existingScore] = await db.select().from(userCreditScores)
      .where(eq(userCreditScores.progressReportId, reportId))
      .limit(1);

    if (existingScore) {
      // Update existing score
      const [updatedScore] = await db
        .update(userCreditScores)
        .set({
          scorePercentage,
          completedDocumentTypes: completedTypes,
          totalRequiredTypes: requiredTypes.length,
          updatedAt: new Date()
        })
        .where(eq(userCreditScores.id, existingScore.id))
        .returning();
      
      return updatedScore;
    } else {
      // Create new score
      const [newScore] = await db
        .insert(userCreditScores)
        .values({
          userId: report.createdById,
          campaignId: report.campaignId,
          progressReportId: reportId,
          scorePercentage,
          completedDocumentTypes: completedTypes,
          totalRequiredTypes: requiredTypes.length,
        })
        .returning();
      
      return newScore;
    }
  }

  async getUserAverageCreditScore(userId: string): Promise<number> {
    const scores = await db.select({ scorePercentage: userCreditScores.scorePercentage })
      .from(userCreditScores)
      .where(eq(userCreditScores.userId, userId));

    if (scores.length === 0) {
      return 0;
    }

    const totalScore = scores.reduce((sum, score) => sum + score.scorePercentage, 0);
    return Math.round(totalScore / scores.length);
  }

  // Creator Rating operations
  async createCreatorRating(rating: InsertCreatorRating): Promise<CreatorRating> {
    const [newRating] = await db
      .insert(creatorRatings)
      .values(rating)
      .onConflictDoUpdate({
        target: [creatorRatings.raterId, creatorRatings.progressReportId],
        set: {
          rating: rating.rating,
          comment: rating.comment,
          updatedAt: new Date(),
        },
      })
      .returning();
    return newRating;
  }

  async getCreatorRatingsByProgressReport(progressReportId: string): Promise<CreatorRating[]> {
    return await db
      .select()
      .from(creatorRatings)
      .where(eq(creatorRatings.progressReportId, progressReportId))
      .orderBy(desc(creatorRatings.createdAt));
  }

  async getUserRatingForProgressReport(raterId: string, progressReportId: string): Promise<CreatorRating | undefined> {
    const [rating] = await db
      .select()
      .from(creatorRatings)
      .where(and(
        eq(creatorRatings.raterId, raterId),
        eq(creatorRatings.progressReportId, progressReportId)
      ))
      .limit(1);
    return rating;
  }

  // Get creator ratings for a specific creator
  async getCreatorRatings(creatorId: string) {
    const ratings = await db
      .select({
        id: creatorRatings.id,
        rating: creatorRatings.rating,
        comment: creatorRatings.comment,
        createdAt: creatorRatings.createdAt,
        campaignTitle: campaigns.title,
        campaignId: creatorRatings.campaignId,
        raterId: creatorRatings.raterId,
      })
      .from(creatorRatings)
      .leftJoin(campaigns, eq(creatorRatings.campaignId, campaigns.id))
      .where(eq(creatorRatings.creatorId, creatorId))
      .orderBy(desc(creatorRatings.createdAt));
    
    return ratings;
  }

  async getAverageCreatorRating(creatorId: string): Promise<{ averageRating: number; totalRatings: number }> {
    const result = await db
      .select({
        averageRating: sql<number>`COALESCE(AVG(CAST(${creatorRatings.rating} AS FLOAT)), 0)`,
        totalRatings: sql<number>`COUNT(${creatorRatings.id})`
      })
      .from(creatorRatings)
      .where(eq(creatorRatings.creatorId, creatorId));
    
    return {
      averageRating: parseFloat(result[0]?.averageRating.toString() || '0'),
      totalRatings: result[0]?.totalRatings || 0
    };
  }

  // Fraud Report operations - for community safety
  async createFraudReport(data: InsertFraudReport): Promise<FraudReport> {
    const [fraudReport] = await db
      .insert(fraudReports)
      .values(data)
      .returning();
    
    return fraudReport;
  }

  async getFraudReportsByStatus(status: string): Promise<FraudReport[]> {
    return await db.select()
      .from(fraudReports)
      .where(eq(fraudReports.status, status))
      .orderBy(desc(fraudReports.createdAt));
  }

  async getAllFraudReports(): Promise<any[]> {
    // Get basic fraud reports first
    const fraudReportsList = await db
      .select()
      .from(fraudReports)
      .orderBy(desc(fraudReports.createdAt));

    // Enrich each fraud report with related data
    const enrichedReports = await Promise.all(
      fraudReportsList.map(async (report) => {
        // Get reporter info with complete profile
        const reporter = await db
          .select()
          .from(users)
          .where(eq(users.id, report.reporterId))
          .limit(1);

        // Get document and campaign info
        const documentInfo = await db
          .select({
            documentId: progressReportDocuments.id,
            progressReportId: progressReportDocuments.progressReportId,
            campaignId: progressReports.campaignId,
          })
          .from(progressReportDocuments)
          .leftJoin(progressReports, eq(progressReportDocuments.progressReportId, progressReports.id))
          .where(eq(progressReportDocuments.id, report.documentId))
          .limit(1);

        let campaign = null;
        let creator = null;
        let reportedUserProfile = null;

        if (documentInfo[0]?.campaignId) {
          // Get campaign info
          const campaignData = await db
            .select()
            .from(campaigns)
            .where(eq(campaigns.id, documentInfo[0].campaignId))
            .limit(1);

          if (campaignData[0]) {
            campaign = campaignData[0];
            
            // Get creator info with complete profile
            const creatorData = await db
              .select()
              .from(users)
              .where(eq(users.id, campaign.creatorId))
              .limit(1);

            if (creatorData[0]) {
              creator = creatorData[0];
              
              // Build complete profile of the reported creator
              const [
                creatorCampaigns,
                creatorContributions,
                creatorTips,
                creatorRatings,
                previousReports,
                volunteerApplications
              ] = await Promise.all([
                // Creator's campaigns
                db.select().from(campaigns).where(eq(campaigns.creatorId, creator.id)),
                // Creator's contributions to other campaigns
                db.select().from(contributions).where(eq(contributions.userId, creator.id)),
                // Tips received by creator
                db.select().from(tips).where(eq(tips.recipientId, creator.id)),
                // Ratings given to creator
                db.select().from(creatorRatings).where(eq(creatorRatings.creatorId, creator.id)),
                // Previous fraud reports against this creator
                db.select().from(fraudReports).where(eq(fraudReports.relatedId, creator.id)),
                // Volunteer applications by this creator
                db.select().from(volunteerApplications).where(eq(volunteerApplications.volunteerId, creator.id))
              ]);

              // Calculate statistics
              const totalCampaignsCreated = creatorCampaigns.length;
              const totalFundsRaised = creatorCampaigns.reduce((sum, camp) => sum + parseFloat(camp.currentAmount || '0'), 0);
              const totalTipsReceived = creatorTips.reduce((sum, tip) => sum + parseFloat(tip.amount || '0'), 0);
              const averageRating = creatorRatings.length > 0 
                ? creatorRatings.reduce((sum, rating) => sum + rating.rating, 0) / creatorRatings.length 
                : 0;
              const totalPreviousReports = previousReports.length;
              const accountAge = Math.floor((Date.now() - new Date(creator.createdAt).getTime()) / (1000 * 60 * 60 * 24)); // days

              reportedUserProfile = {
                ...creator,
                statistics: {
                  totalCampaignsCreated,
                  totalFundsRaised,
                  totalTipsReceived,
                  averageRating,
                  totalRatings: creatorRatings.length,
                  totalPreviousReports,
                  accountAge,
                  totalVolunteerApplications: volunteerApplications.length
                },
                campaignHistory: creatorCampaigns.map(camp => ({
                  id: camp.id,
                  title: camp.title,
                  status: camp.status,
                  currentAmount: camp.currentAmount,
                  goalAmount: camp.goalAmount,
                  createdAt: camp.createdAt
                })),
                recentRatings: creatorRatings.slice(-5).map(rating => ({
                  rating: rating.rating,
                  comment: rating.comment,
                  createdAt: rating.createdAt
                })),
                previousReports: previousReports.map(prevReport => ({
                  id: prevReport.id,
                  reportType: prevReport.reportType,
                  status: prevReport.status,
                  createdAt: prevReport.createdAt
                }))
              };
            }
          }
        }

        // If this is a campaign report (not document report), get reported campaign creator profile
        if (report.relatedType === 'campaign' && report.relatedId) {
          const reportedCampaign = await db
            .select()
            .from(campaigns)
            .where(eq(campaigns.id, report.relatedId))
            .limit(1);

          if (reportedCampaign[0]) {
            const reportedCreator = await db
              .select()
              .from(users)
              .where(eq(users.id, reportedCampaign[0].creatorId))
              .limit(1);

            if (reportedCreator[0]) {
              // Build complete profile of the reported creator (same as above)
              const [
                creatorCampaigns,
                creatorContributions,
                creatorTips,
                creatorRatings,
                previousReports,
                volunteerApplications
              ] = await Promise.all([
                db.select().from(campaigns).where(eq(campaigns.creatorId, reportedCreator[0].id)),
                db.select().from(contributions).where(eq(contributions.userId, reportedCreator[0].id)),
                db.select().from(tips).where(eq(tips.recipientId, reportedCreator[0].id)),
                db.select().from(creatorRatings).where(eq(creatorRatings.creatorId, reportedCreator[0].id)),
                db.select().from(fraudReports).where(eq(fraudReports.relatedId, reportedCreator[0].id)),
                db.select().from(volunteerApplications).where(eq(volunteerApplications.volunteerId, reportedCreator[0].id))
              ]);

              const totalCampaignsCreated = creatorCampaigns.length;
              const totalFundsRaised = creatorCampaigns.reduce((sum, camp) => sum + parseFloat(camp.currentAmount || '0'), 0);
              const totalTipsReceived = creatorTips.reduce((sum, tip) => sum + parseFloat(tip.amount || '0'), 0);
              const averageRating = creatorRatings.length > 0 
                ? creatorRatings.reduce((sum, rating) => sum + rating.rating, 0) / creatorRatings.length 
                : 0;
              const totalPreviousReports = previousReports.length;
              const accountAge = Math.floor((Date.now() - new Date(reportedCreator[0].createdAt).getTime()) / (1000 * 60 * 60 * 24));

              reportedUserProfile = {
                ...reportedCreator[0],
                statistics: {
                  totalCampaignsCreated,
                  totalFundsRaised,
                  totalTipsReceived,
                  averageRating,
                  totalRatings: creatorRatings.length,
                  totalPreviousReports,
                  accountAge,
                  totalVolunteerApplications: volunteerApplications.length
                },
                campaignHistory: creatorCampaigns.map(camp => ({
                  id: camp.id,
                  title: camp.title,
                  status: camp.status,
                  currentAmount: camp.currentAmount,
                  goalAmount: camp.goalAmount,
                  createdAt: camp.createdAt
                })),
                recentRatings: creatorRatings.slice(-5).map(rating => ({
                  rating: rating.rating,
                  comment: rating.comment,
                  createdAt: rating.createdAt
                })),
                previousReports: previousReports.map(prevReport => ({
                  id: prevReport.id,
                  reportType: prevReport.reportType,
                  status: prevReport.status,
                  createdAt: prevReport.createdAt
                }))
              };
            }
          }
        }

        return {
          ...report,
          reporter: reporter[0] || null,
          campaign: campaign ? {
            ...campaign,
            creator: creator
          } : null,
          reportedUserProfile: reportedUserProfile
        };
      })
    );

    return enrichedReports;
  }

  async updateFraudReportStatus(
    id: string, 
    status: string, 
    adminNotes?: string, 
    validatedBy?: string, 
    socialPointsAwarded?: number
  ): Promise<void> {
    await db.update(fraudReports)
      .set({
        status,
        adminNotes,
        validatedBy,
        socialPointsAwarded,
        updatedAt: new Date(),
      })
      .where(eq(fraudReports.id, id));
  }

  async awardSocialScore(userId: string, points: number): Promise<void> {
    await db.update(users)
      .set({
        socialScore: sql`${users.socialScore} + ${points}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Comment and Reply Voting System (Social Score)
  async voteOnComment(userId: string, commentId: string, voteType: 'upvote' | 'downvote'): Promise<void> {
    await db.transaction(async (tx) => {
      // First, handle the user's vote record
      await tx
        .insert(commentVotes)
        .values({ userId, commentId, voteType })
        .onConflictDoUpdate({
          target: [commentVotes.userId, commentVotes.commentId],
          set: { voteType, createdAt: new Date() }
        });

      // Then update vote counts on the comment
      const [upvoteCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(commentVotes)
        .where(and(eq(commentVotes.commentId, commentId), eq(commentVotes.voteType, 'upvote')));

      const [downvoteCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(commentVotes)
        .where(and(eq(commentVotes.commentId, commentId), eq(commentVotes.voteType, 'downvote')));

      await tx
        .update(campaignComments)
        .set({
          upvotes: upvoteCount.count,
          downvotes: downvoteCount.count,
          updatedAt: new Date()
        })
        .where(eq(campaignComments.id, commentId));

      // Award social score to comment author (1 point per net upvote)
      const [comment] = await tx
        .select({ userId: campaignComments.userId })
        .from(campaignComments)
        .where(eq(campaignComments.id, commentId));

      if (comment) {
        const netScore = upvoteCount.count - downvoteCount.count;
        await tx
          .update(users)
          .set({
            socialScore: sql`GREATEST(0, COALESCE(${users.socialScore}, 0) + ${netScore} - COALESCE((SELECT upvotes - downvotes FROM ${campaignComments} WHERE id = ${commentId} AND user_id = ${comment.userId}), 0) + ${netScore})`,
            updatedAt: new Date()
          })
          .where(eq(users.id, comment.userId));
      }
    });
  }

  async voteOnReply(userId: string, replyId: string, voteType: 'upvote' | 'downvote'): Promise<void> {
    await db.transaction(async (tx) => {
      // First, handle the user's vote record
      await tx
        .insert(replyVotes)
        .values({ userId, replyId, voteType })
        .onConflictDoUpdate({
          target: [replyVotes.userId, replyVotes.replyId],
          set: { voteType, createdAt: new Date() }
        });

      // Then update vote counts on the reply
      const [upvoteCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(replyVotes)
        .where(and(eq(replyVotes.replyId, replyId), eq(replyVotes.voteType, 'upvote')));

      const [downvoteCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(replyVotes)
        .where(and(eq(replyVotes.replyId, replyId), eq(replyVotes.voteType, 'downvote')));

      await tx
        .update(commentReplies)
        .set({
          upvotes: upvoteCount.count,
          downvotes: downvoteCount.count,
          updatedAt: new Date()
        })
        .where(eq(commentReplies.id, replyId));

      // Award social score to reply author (1 point per net upvote)
      const [reply] = await tx
        .select({ userId: commentReplies.userId })
        .from(commentReplies)
        .where(eq(commentReplies.id, replyId));

      if (reply) {
        const netScore = upvoteCount.count - downvoteCount.count;
        await tx
          .update(users)
          .set({
            socialScore: sql`GREATEST(0, COALESCE(${users.socialScore}, 0) + ${netScore} - COALESCE((SELECT upvotes - downvotes FROM ${commentReplies} WHERE id = ${replyId} AND user_id = ${reply.userId}), 0) + ${netScore})`,
            updatedAt: new Date()
          })
          .where(eq(users.id, reply.userId));
      }
    });
  }

  async getUserVoteOnComment(userId: string, commentId: string): Promise<{ voteType: string } | undefined> {
    const [vote] = await db
      .select({ voteType: commentVotes.voteType })
      .from(commentVotes)
      .where(and(eq(commentVotes.userId, userId), eq(commentVotes.commentId, commentId)))
      .limit(1);
    return vote;
  }

  async getUserVoteOnReply(userId: string, replyId: string): Promise<{ voteType: string } | undefined> {
    const [vote] = await db
      .select({ voteType: replyVotes.voteType })
      .from(replyVotes)
      .where(and(eq(replyVotes.userId, userId), eq(replyVotes.replyId, replyId)))
      .limit(1);
    return vote;
  }

  async getExpiredCampaigns(): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(
        and(
          or(
            eq(campaigns.status, 'active'),
            eq(campaigns.status, 'on_progress')
          ),
          gt(sql`now()`, campaigns.endDate)
        )
      );
  }

  async flagUser(userId: string, reason: string): Promise<void> {
    await db.update(users)
      .set({
        isFlagged: true,
        flagReason: reason,
        flaggedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
  // Credibility Score System Methods
  async calculateUserCredibilityScore(userId: string): Promise<number> {
    // Get all completed campaigns with progress reports
    const userCampaigns = await db
      .select()
      .from(campaigns)
      .where(and(
        eq(campaigns.creatorId, userId),
        or(
          eq(campaigns.status, 'completed'),
          eq(campaigns.status, 'closed_with_refund'),
          eq(campaigns.status, 'flagged')
        )
      ));

    if (userCampaigns.length === 0) {
      return 100; // Default score for new users
    }

    let totalScore = 0;
    let scoredCampaigns = 0;

    for (const campaign of userCampaigns) {
      const progressReports = await db
        .select()
        .from(progressReports)
        .where(eq(progressReports.campaignId, campaign.id));
      
      if (progressReports.length > 0) {
        // Calculate average rating for this campaign
        const ratings = await db
          .select()
          .from(creatorRatings)
          .where(eq(creatorRatings.campaignId, campaign.id));
        
        const avgRating = ratings.length > 0 
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 3; // Default if no ratings (middle ground)
        
        // Convert 1-5 rating to percentage (20% per point)
        const progressScore = Math.min(100, avgRating * 20);
        totalScore += progressScore;
        scoredCampaigns++;
      }
    }

    return scoredCampaigns > 0 ? totalScore / scoredCampaigns : 100;
  }

  async updateUserCredibilityScore(userId: string): Promise<void> {
    const credibilityScore = await this.calculateUserCredibilityScore(userId);
    
    // Update account status based on credibility score
    let accountStatus: string;
    let remainingCampaignChances: number;
    
    if (credibilityScore <= 65) {
      accountStatus = 'blocked';
      remainingCampaignChances = 0;
    } else if (credibilityScore >= 65.01 && credibilityScore < 75) {
      accountStatus = 'suspended';
      remainingCampaignChances = 0;
    } else if (credibilityScore >= 75 && credibilityScore <= 80) {
      accountStatus = 'limited';
      remainingCampaignChances = 2;
    } else {
      accountStatus = 'active';
      remainingCampaignChances = 999; // Unlimited
    }
    
    await db
      .update(users)
      .set({ 
        credibilityScore: credibilityScore.toFixed(2),
        accountStatus,
        remainingCampaignChances,
        lastCredibilityUpdate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async canUserCreateCampaign(userId: string): Promise<{canCreate: boolean, reason?: string}> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return { canCreate: false, reason: 'User not found' };
    }

    // Check if user is flagged or suspended from fraud
    if (user.isFlagged || user.isSuspended) {
      return { canCreate: false, reason: 'Account is flagged or suspended for fraudulent activity' };
    }

    // Check account status based on credibility score
    switch (user.accountStatus) {
      case 'blocked':
        return { canCreate: false, reason: `Account blocked due to low credibility score (${user.credibilityScore}%). Submit support request for reactivation.` };
      case 'suspended':
        return { canCreate: false, reason: `Account suspended due to credibility score (${user.credibilityScore}%). Submit support request for reactivation.` };
      case 'limited':
        if (user.remainingCampaignChances <= 0) {
          return { canCreate: false, reason: `Campaign creation limit reached. Need 80%+ credibility score for unlimited access.` };
        }
        return { canCreate: true };
      case 'active':
        return { canCreate: true };
      default:
        return { canCreate: true };
    }
  }

  async decrementUserCampaignChances(userId: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user && user.accountStatus === 'limited' && user.remainingCampaignChances > 0) {
      await db
        .update(users)
        .set({ 
          remainingCampaignChances: user.remainingCampaignChances - 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
  }

  // Support Request Methods
  async createSupportRequest(supportRequestData: any): Promise<any> {
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    
    const [supportRequest] = await db
      .insert(supportRequests)
      .values({
        ...supportRequestData,
        eligibleForReviewAt: oneMonthFromNow,
      })
      .returning();
    
    // Update user to mark active support request
    await db
      .update(users)
      .set({
        hasActiveSupportRequest: true,
        supportRequestSubmittedAt: new Date(),
        supportRequestReason: supportRequestData.reason,
        updatedAt: new Date(),
      })
      .where(eq(users.id, supportRequestData.userId));
    
    return supportRequest;
  }

  async getSupportRequestsByUser(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(supportRequests)
      .where(eq(supportRequests.userId, userId))
      .orderBy(desc(supportRequests.createdAt));
  }

  async getAllSupportRequests(): Promise<any[]> {
    return await db
      .select({
        request: supportRequests,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          credibilityScore: users.credibilityScore,
          accountStatus: users.accountStatus,
        }
      })
      .from(supportRequests)
      .leftJoin(users, eq(supportRequests.userId, users.id))
      .orderBy(desc(supportRequests.createdAt));
  }

  async updateSupportRequestStatus(requestId: string, status: string, reviewedBy?: string, reviewNotes?: string): Promise<void> {
    const [request] = await db
      .select()
      .from(supportRequests)
      .where(eq(supportRequests.id, requestId));
    
    if (!request) return;
    
    await db
      .update(supportRequests)
      .set({
        status,
        reviewedBy,
        reviewNotes,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportRequests.id, requestId));
    
    // If approved, reactivate user account
    if (status === 'approved') {
      await db
        .update(users)
        .set({
          accountStatus: 'active',
          remainingCampaignChances: 999,
          hasActiveSupportRequest: false,
          supportRequestSubmittedAt: null,
          supportRequestReason: null,
          // Reset fraud flags if applicable
          isFlagged: false,
          isSuspended: false,
          flagReason: null,
          suspensionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, request.userId));
    } else if (status === 'rejected') {
      await db
        .update(users)
        .set({
          hasActiveSupportRequest: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, request.userId));
    }
  }

  // === VOLUNTEER RELIABILITY RATING OPERATIONS ===

  async createVolunteerReliabilityRating(rating: InsertVolunteerReliabilityRating): Promise<VolunteerReliabilityRating> {
    const [newRating] = await db
      .insert(volunteerReliabilityRatings)
      .values(rating)
      .returning();
    return newRating;
  }

  async getVolunteerReliabilityRating(volunteerId: string, campaignId: string): Promise<VolunteerReliabilityRating | undefined> {
    const [rating] = await db
      .select()
      .from(volunteerReliabilityRatings)
      .where(
        and(
          eq(volunteerReliabilityRatings.volunteerId, volunteerId),
          eq(volunteerReliabilityRatings.campaignId, campaignId)
        )
      );
    return rating;
  }

  async getVolunteerReliabilityRatings(volunteerId: string): Promise<(VolunteerReliabilityRating & { campaign: Campaign; rater: User })[]> {
    const ratings = await db
      .select({
        id: volunteerReliabilityRatings.id,
        raterId: volunteerReliabilityRatings.raterId,
        volunteerId: volunteerReliabilityRatings.volunteerId,
        campaignId: volunteerReliabilityRatings.campaignId,
        volunteerApplicationId: volunteerReliabilityRatings.volunteerApplicationId,
        rating: volunteerReliabilityRatings.rating,
        feedback: volunteerReliabilityRatings.feedback,
        createdAt: volunteerReliabilityRatings.createdAt,
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
          category: campaigns.category,
          status: campaigns.status,
        },
        rater: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(volunteerReliabilityRatings)
      .leftJoin(campaigns, eq(volunteerReliabilityRatings.campaignId, campaigns.id))
      .leftJoin(users, eq(volunteerReliabilityRatings.raterId, users.id))
      .where(eq(volunteerReliabilityRatings.volunteerId, volunteerId))
      .orderBy(desc(volunteerReliabilityRatings.createdAt));

    return ratings as (VolunteerReliabilityRating & { campaign: Campaign; rater: User })[];
  }

  async updateVolunteerReliabilityScore(volunteerId: string): Promise<void> {
    // Calculate the average reliability score for this volunteer
    const result = await db
      .select({
        avgRating: sql<number>`AVG(${volunteerReliabilityRatings.rating})`,
        count: sql<number>`COUNT(${volunteerReliabilityRatings.rating})`,
      })
      .from(volunteerReliabilityRatings)
      .where(eq(volunteerReliabilityRatings.volunteerId, volunteerId));

    const { avgRating, count } = result[0];
    const averageScore = Number(avgRating) || 0;
    const ratingsCount = Number(count) || 0;

    // Update the user's reliability score and ratings count
    await db
      .update(users)
      .set({
        reliabilityScore: averageScore.toFixed(2),
        reliabilityRatingsCount: ratingsCount,
        updatedAt: new Date(),
      })
      .where(eq(users.id, volunteerId));
  }

  async getVolunteersToRate(campaignId: string, creatorId: string): Promise<(User & { application: VolunteerApplication })[]> {
    // Get approved volunteers for this campaign who haven't been rated yet
    const volunteers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        reliabilityScore: users.reliabilityScore,
        reliabilityRatingsCount: users.reliabilityRatingsCount,
        application: {
          id: volunteerApplications.id,
          intent: volunteerApplications.intent,
          telegramDisplayName: volunteerApplications.telegramDisplayName,
          telegramUsername: volunteerApplications.telegramUsername,
          status: volunteerApplications.status,
          createdAt: volunteerApplications.createdAt,
        },
      })
      .from(volunteerApplications)
      .innerJoin(users, eq(volunteerApplications.volunteerId, users.id))
      .leftJoin(
        volunteerReliabilityRatings,
        and(
          eq(volunteerReliabilityRatings.volunteerId, users.id),
          eq(volunteerReliabilityRatings.campaignId, campaignId)
        )
      )
      .where(
        and(
          eq(volunteerApplications.campaignId, campaignId),
          eq(volunteerApplications.status, 'approved'),
          sql`${volunteerReliabilityRatings.id} IS NULL` // Not rated yet
        )
      )
      .orderBy(desc(volunteerApplications.createdAt));

    return volunteers as (User & { application: VolunteerApplication })[];
  }

  async getAllVolunteerReliabilityRatings(): Promise<any[]> {
    const allUsers = alias(users, 'volunteer_users');
    
    const ratings = await db
      .select({
        id: volunteerReliabilityRatings.id,
        raterId: volunteerReliabilityRatings.raterId,
        volunteerId: volunteerReliabilityRatings.volunteerId,
        campaignId: volunteerReliabilityRatings.campaignId,
        volunteerApplicationId: volunteerReliabilityRatings.volunteerApplicationId,
        rating: volunteerReliabilityRatings.rating,
        feedback: volunteerReliabilityRatings.feedback,
        createdAt: volunteerReliabilityRatings.createdAt,
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
          category: campaigns.category,
          status: campaigns.status,
        },
        rater: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        volunteer: {
          id: allUsers.id,
          firstName: allUsers.firstName,
          lastName: allUsers.lastName,
          email: allUsers.email,
          profileImageUrl: allUsers.profileImageUrl,
        },
      })
      .from(volunteerReliabilityRatings)
      .leftJoin(campaigns, eq(volunteerReliabilityRatings.campaignId, campaigns.id))
      .leftJoin(users, eq(volunteerReliabilityRatings.raterId, users.id))
      .leftJoin(allUsers, eq(volunteerReliabilityRatings.volunteerId, allUsers.id))
      .orderBy(desc(volunteerReliabilityRatings.createdAt));

    return ratings;
  }

  async getReportedVolunteers(): Promise<any[]> {
    // For now, return empty array as we haven't implemented volunteer reports yet
    // This could be extended to include actual volunteer reports in the future
    // The structure would be similar to fraud reports but for volunteers
    return [];
  }

  async getDocumentReports(): Promise<any[]> {
    try {
      // Get all fraud reports related to documents (KYC docs, progress reports, etc.)
      const allFraudReports = await this.getAllFraudReports();
      const documentReports = allFraudReports.filter((report: any) => 
        report.documentId || 
        report.reportType?.toLowerCase().includes('document') ||
        report.reportType?.toLowerCase().includes('kyc') ||
        report.reportType?.toLowerCase().includes('progress')
      );

      return documentReports.map((report: any) => ({
        ...report,
        reportCategory: 'Document Issues',
        severity: report.reportType?.toLowerCase().includes('kyc') ? 'High' : 'Medium'
      }));
    } catch (error) {
      console.error('Error fetching document reports:', error);
      return [];
    }
  }

  async getCampaignReports(): Promise<any[]> {
    try {
      // Get all fraud reports related to campaigns
      const allFraudReports = await this.getAllFraudReports();
      const campaignReports = allFraudReports.filter((report: any) => 
        report.relatedType === 'campaign' || 
        report.campaignId ||
        report.reportType?.toLowerCase().includes('campaign')
      );

      return campaignReports.map((report: any) => ({
        ...report,
        reportCategory: 'Campaign Issues',
        severity: 'High'
      }));
    } catch (error) {
      console.error('Error fetching campaign reports:', error);
      return [];
    }
  }

  async getVolunteerReports(): Promise<any[]> {
    try {
      // Get all fraud reports related to volunteers
      const allFraudReports = await this.getAllFraudReports();
      const volunteerReports = allFraudReports.filter((report: any) => 
        report.relatedType === 'volunteer' ||
        report.reportType?.toLowerCase().includes('volunteer')
      );

      return volunteerReports.map((report: any) => ({
        ...report,
        reportCategory: 'Volunteer Issues',
        severity: 'Medium'
      }));
    } catch (error) {
      console.error('Error fetching volunteer reports:', error);
      return [];
    }
  }

  async getCreatorReports(): Promise<any[]> {
    try {
      // Get all fraud reports related to creators
      const allFraudReports = await this.getAllFraudReports();
      const creatorReports = allFraudReports.filter((report: any) => 
        report.relatedType === 'creator' ||
        report.reportType?.toLowerCase().includes('creator') ||
        report.reportType?.toLowerCase().includes('user')
      );

      return creatorReports.map((report: any) => ({
        ...report,
        reportCategory: 'Creator Issues',
        severity: 'High'
      }));
    } catch (error) {
      console.error('Error fetching creator reports:', error);
      return [];
    }
  }

  async getTransactionReports(): Promise<any[]> {
    try {
      // Get all fraud reports related to transactions and payments
      const allFraudReports = await this.getAllFraudReports();
      const transactionReports = allFraudReports.filter((report: any) => 
        report.reportType?.toLowerCase().includes('transaction') ||
        report.reportType?.toLowerCase().includes('payment') ||
        report.reportType?.toLowerCase().includes('financial') ||
        report.description?.toLowerCase().includes('payment') ||
        report.description?.toLowerCase().includes('money')
      );

      return transactionReports.map((report: any) => ({
        ...report,
        reportCategory: 'Transaction Issues',
        severity: 'High'
      }));
    } catch (error) {
      console.error('Error fetching transaction reports:', error);
      return [];
    }
  }

  async getUserReports(): Promise<any[]> {
    try {
      // Get all fraud reports related to users
      const allFraudReports = await this.getAllFraudReports();
      const userReports = allFraudReports.filter((report: any) => 
        report.relatedType === 'user' ||
        report.reportType?.toLowerCase().includes('spam') ||
        report.reportType?.toLowerCase().includes('scam') ||
        report.reportType?.toLowerCase().includes('malicious') ||
        report.reportType?.toLowerCase().includes('inappropriate') ||
        report.reportType?.toLowerCase().includes('harassment') ||
        report.reportType?.toLowerCase().includes('abuse')
      );

      return userReports.map((report: any) => ({
        ...report,
        reportCategory: 'User Behavior Issues',
        severity: report.reportType?.toLowerCase().includes('scam') || 
                 report.reportType?.toLowerCase().includes('malicious') ? 'High' : 'Medium'
      }));
    } catch (error) {
      console.error('Error fetching user reports:', error);
      return [];
    }
  }

  async getAllVolunteerApplicationsForAdmin(): Promise<any[]> {
    try {
      // Get all volunteer applications with volunteer and campaign information
      const applications = await db
        .select({
          id: volunteerApplications.id,
          opportunityId: volunteerApplications.opportunityId,
          campaignId: volunteerApplications.campaignId,
          volunteerId: volunteerApplications.volunteerId,
          status: volunteerApplications.status,
          message: volunteerApplications.message,
          intent: volunteerApplications.intent,
          telegramDisplayName: volunteerApplications.telegramDisplayName,
          telegramUsername: volunteerApplications.telegramUsername,
          rejectionReason: volunteerApplications.rejectionReason,
          createdAt: volunteerApplications.createdAt,
          // Volunteer information
          volunteerFirstName: users.firstName,
          volunteerLastName: users.lastName,
          volunteerEmail: users.email,
          volunteerProfileImageUrl: users.profileImageUrl,
          // Campaign information
          campaignTitle: campaigns.title,
          campaignCategory: campaigns.category,
          campaignStatus: campaigns.status,
        })
        .from(volunteerApplications)
        .leftJoin(users, eq(volunteerApplications.volunteerId, users.id))
        .leftJoin(campaigns, eq(volunteerApplications.campaignId, campaigns.id))
        .orderBy(desc(volunteerApplications.createdAt));

      return applications.map(app => ({
        ...app,
        volunteer: {
          id: app.volunteerId,
          firstName: app.volunteerFirstName,
          lastName: app.volunteerLastName,
          email: app.volunteerEmail,
          profileImageUrl: app.volunteerProfileImageUrl,
        },
        campaign: {
          id: app.campaignId,
          title: app.campaignTitle,
          category: app.campaignCategory,
          status: app.campaignStatus,
        }
      }));
    } catch (error) {
      console.error('Error fetching all volunteer applications for admin:', error);
      return [];
    }
  }

  async getAllVolunteerOpportunitiesForAdmin(): Promise<any[]> {
    try {
      // Get all volunteer opportunities with campaign and creator information
      const opportunities = await db
        .select({
          id: campaigns.id,
          title: campaigns.title,
          description: campaigns.description,
          location: campaigns.location,
          category: campaigns.category,
          status: campaigns.status,
          volunteerSlots: campaigns.volunteerSlots,
          volunteerSlotsFilledCount: campaigns.volunteerSlotsFilledCount,
          needsVolunteers: campaigns.needsVolunteers,
          createdAt: campaigns.createdAt,
          endDate: campaigns.endDate,
          // Creator information
          creatorId: campaigns.creatorId,
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
          creatorProfileImageUrl: users.profileImageUrl,
        })
        .from(campaigns)
        .leftJoin(users, eq(campaigns.creatorId, users.id))
        .where(eq(campaigns.needsVolunteers, true))
        .orderBy(desc(campaigns.createdAt));

      return opportunities.map(opp => ({
        id: `volunteer-${opp.id}`,
        campaignId: opp.id,
        title: `Volunteer for: ${opp.title}`,
        description: opp.description,
        location: opp.location || 'Location TBD',
        category: opp.category,
        status: opp.status,
        slotsNeeded: opp.volunteerSlots,
        slotsFilled: opp.volunteerSlotsFilledCount || 0,
        createdAt: opp.createdAt,
        endDate: opp.endDate,
        creator: {
          id: opp.creatorId,
          firstName: opp.creatorFirstName,
          lastName: opp.creatorLastName,
          email: opp.creatorEmail,
          profileImageUrl: opp.creatorProfileImageUrl,
        }
      }));
    } catch (error) {
      console.error('Error fetching all volunteer opportunities for admin:', error);
      return [];
    }
  }

  // ID Assignment Methods
  async assignDisplayIdsToExistingRecords(): Promise<void> {
    try {
      console.log('🆔 Starting ID assignment process...');
      
      // Assign User Display IDs
      const usersWithoutDisplayId = await db
        .select()
        .from(users)
        .where(isNull(users.userDisplayId));
      
      console.log(`Found ${usersWithoutDisplayId.length} users without display IDs`);
      
      for (const user of usersWithoutDisplayId) {
        const displayId = await generateUniqueUserDisplayId();
        await db
          .update(users)
          .set({ userDisplayId: displayId })
          .where(eq(users.id, user.id));
        console.log(`✅ Assigned user ID ${displayId} to user ${user.email}`);
      }
      
      // Assign Transaction Display IDs
      const transactionsWithoutDisplayId = await db
        .select()
        .from(transactions)
        .where(isNull(transactions.transactionDisplayId));
      
      console.log(`Found ${transactionsWithoutDisplayId.length} transactions without display IDs`);
      
      for (const transaction of transactionsWithoutDisplayId) {
        const displayId = await generateUniqueTransactionDisplayId();
        await db
          .update(transactions)
          .set({ transactionDisplayId: displayId })
          .where(eq(transactions.id, transaction.id));
        console.log(`✅ Assigned transaction ID ${displayId} to transaction ${transaction.id}`);
      }
      
      // Assign Document Display IDs
      const documentsWithoutDisplayId = await db
        .select()
        .from(progressReportDocuments)
        .where(isNull(progressReportDocuments.documentDisplayId));
      
      console.log(`Found ${documentsWithoutDisplayId.length} documents without display IDs`);
      
      for (const document of documentsWithoutDisplayId) {
        const displayId = await generateUniqueDocumentDisplayId();
        await db
          .update(progressReportDocuments)
          .set({ documentDisplayId: displayId })
          .where(eq(progressReportDocuments.id, document.id));
        console.log(`✅ Assigned document ID ${displayId} to document ${document.fileName}`);
      }
      
      // Assign Campaign Display IDs
      const campaignsWithoutDisplayId = await db
        .select()
        .from(campaigns)
        .where(isNull(campaigns.campaignDisplayId));
      
      console.log(`Found ${campaignsWithoutDisplayId.length} campaigns without display IDs`);
      
      for (const campaign of campaignsWithoutDisplayId) {
        const displayId = await generateUniqueCampaignDisplayId();
        await db
          .update(campaigns)
          .set({ campaignDisplayId: displayId })
          .where(eq(campaigns.id, campaign.id));
        console.log(`✅ Assigned campaign ID ${displayId} to campaign ${campaign.title}`);
      }
      
      console.log('🎉 ID assignment process completed successfully!');
    } catch (error) {
      console.error('❌ Error during ID assignment process:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
