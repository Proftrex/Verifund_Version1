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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import crypto from "crypto";
import { ObjectStorageService } from "./objectStorage";

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
  
  
  // Campaign operations
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaigns(filters?: { status?: string; category?: string; limit?: number }): Promise<Campaign[]>;
  updateCampaignStatus(id: string, status: string): Promise<void>;
  updateCampaignAmount(id: string, amount: string): Promise<void>;
  getCampaignsByCreator(creatorId: string): Promise<Campaign[]>;
  
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
  getFlaggedCampaigns(): Promise<Campaign[]>;
  
  // Transaction search for admin
  searchTransactions(params: {
    email?: string;
    transactionId?: string;
    amount?: string;
    type?: string;
  }): Promise<any[]>;
  
  // Balance operations - Multiple wallet types
  addPusoBalance(userId: string, amount: number): Promise<void>;
  subtractPusoBalance(userId: string, amount: number): Promise<void>;
  addTipsBalance(userId: string, amount: number): Promise<void>;
  addContributionsBalance(userId: string, amount: number): Promise<void>;
  claimTips(userId: string): Promise<number>;
  claimContributions(userId: string): Promise<number>;
  
  // Admin balance corrections
  correctPusoBalance(userId: string, newBalance: number, reason: string): Promise<void>;
  correctTipsBalance(userId: string, newBalance: number, reason: string): Promise<void>;
  correctContributionsBalance(userId: string, newBalance: number, reason: string): Promise<void>;
  updateTransactionStatus(transactionId: string, status: string, reason: string): Promise<void>;
  getTransactionById(transactionId: string): Promise<any>;

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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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

  async updateUserKYC(id: string, status: string, documents?: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        kycStatus: status, 
        kycDocuments: documents,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  async updateUserBalance(id: string, balance: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        pusoBalance: balance,
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

  // Campaign operations
  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
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

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
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

  async updateCampaignStatus(id: string, status: string): Promise<void> {
    await db
      .update(campaigns)
      .set({ 
        status,
        updatedAt: new Date() 
      })
      .where(eq(campaigns.id, id));
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

  async getCampaignsByCreator(creatorId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.creatorId, creatorId))
      .orderBy(desc(campaigns.createdAt));
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
  async addPusoBalance(userId: string, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentBalance = parseFloat(user.pusoBalance || '0');
    const newBalance = (currentBalance + amount).toFixed(2);
    
    await db
      .update(users)
      .set({
        pusoBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async subtractPusoBalance(userId: string, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentBalance = parseFloat(user.pusoBalance || '0');
    const newBalance = (currentBalance - amount).toFixed(2);
    
    if (parseFloat(newBalance) < 0) {
      throw new Error('Insufficient PUSO balance');
    }
    
    await db
      .update(users)
      .set({
        pusoBalance: newBalance,
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
    await this.addPusoBalance(userId, netAmount);
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
    await this.addPusoBalance(userId, netAmount);
    await db
      .update(users)
      .set({
        contributionsBalance: '0.00',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
      
    return netAmount; // Return net amount received
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
  }> {
    // Get withdrawal amounts
    const withdrawalResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`
      })
      .from(transactions)
      .where(and(
        eq(transactions.type, 'withdrawal'),
        eq(transactions.status, 'completed')
      ));
      
    // Get deposit amounts
    const depositResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`
      })
      .from(transactions)
      .where(and(
        eq(transactions.type, 'deposit'),
        eq(transactions.status, 'completed')
      ));
      
    // Get total tips collected (sum of all users' tips balances + claimed tips)
    const tipsResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${users.tipsBalance} AS DECIMAL)), 0)`
      })
      .from(users);
      
    // Get total contributions collected
    const contributionsResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${users.contributionsBalance} AS DECIMAL)), 0)`
      })
      .from(users);
    
    return {
      totalWithdrawn: parseFloat(withdrawalResult[0]?.total || '0'),
      totalTipsCollected: parseFloat(tipsResult[0]?.total || '0'),
      totalContributionsCollected: parseFloat(contributionsResult[0]?.total || '0'),
      totalDeposited: parseFloat(depositResult[0]?.total || '0'),
    };
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
    let query = db.select().from(volunteerOpportunities);
    
    if (filters?.status) {
      query = query.where(eq(volunteerOpportunities.status, filters.status));
    }
    
    query = query.orderBy(desc(volunteerOpportunities.startDate));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    return await query;
  }

  async applyForVolunteer(application: InsertVolunteerApplication): Promise<VolunteerApplication> {
    const [newApplication] = await db
      .insert(volunteerApplications)
      .values(application)
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
    message?: string; 
    status?: string 
  }): Promise<VolunteerApplication> {
    const [newApplication] = await db
      .insert(volunteerApplications)
      .values({
        campaignId: application.campaignId,
        volunteerId: application.applicantId,
        intent: application.intent,
        message: application.message || "",
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
        volunteerId: volunteerApplications.volunteerId,
        status: volunteerApplications.status,
        message: volunteerApplications.message,
        intent: volunteerApplications.intent,
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
  async getPendingCampaigns(): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
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

  async getFlaggedCampaigns(): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, "flagged"))
      .orderBy(desc(campaigns.createdAt));
  }

  // Blockchain-related operations
  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

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

  async getUserTransactions(userId: string, limit: number = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
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
        .select()
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

      return featuredCampaigns.map(row => row.campaigns || row);
    } catch (error) {
      console.error("Error in getFeaturedCampaigns:", error);
      // Fallback to recent active campaigns
      return await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.status, 'active'))
        .orderBy(desc(campaigns.createdAt))
        .limit(limit);
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
          .select()
          .from(campaigns)
          .where(eq(campaigns.status, 'active'))
          .orderBy(desc(campaigns.createdAt))
          .limit(limit);
      }

      // Get campaigns the user has contributed to
      const contributedCampaignIds = userContributions.map(c => c.campaignId);
      
      if (contributedCampaignIds.length === 0) {
        return await db
          .select()
          .from(campaigns)
          .where(eq(campaigns.status, 'active'))
          .orderBy(desc(campaigns.createdAt))
          .limit(limit);
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
          .select()
          .from(campaigns)
          .where(eq(campaigns.status, 'active'))
          .orderBy(desc(campaigns.createdAt))
          .limit(limit);
      }

      // Find campaigns in preferred categories
      return await db
        .select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.status, 'active'),
            sql`${campaigns.category} = ANY(ARRAY[${preferredCategories.map(cat => `'${cat}'`).join(',')}])`
          )
        )
        .orderBy(desc(campaigns.createdAt))
        .limit(limit);

    } catch (error) {
      console.error("Error in getRecommendedCampaigns:", error);
      // Fallback to recent active campaigns
      return await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.status, 'active'))
        .orderBy(desc(campaigns.createdAt))
        .limit(limit);
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
        userPusoBalance: users.pusoBalance,
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
        pusoBalance: result.userPusoBalance,
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
      
      for (const tip of campaignTips) {
        const tipAmount = parseFloat(tip.amount);
        if (amountToClaim + tipAmount <= requestedAmount) {
          amountToClaim += tipAmount;
          tipsToRemove.push(tip.id);
          
          if (amountToClaim === requestedAmount) {
            break;
          }
        }
      }

      // If we can't claim exact amount, round down to what's possible
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

      return {
        claimedAmount: amountToClaim,
        tipCount: tipsToRemove.length
      };
    });
  }

  // Admin balance correction methods
  async correctPusoBalance(userId: string, newBalance: number, reason: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Update user balance
      await tx
        .update(users)
        .set({ 
          pusoBalance: newBalance.toString(),
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
          pusoBalance: users.pusoBalance,
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

    // Use ObjectStorageService to normalize the URL to a proper object path
    const objectStorageService = new ObjectStorageService();
    const normalizedPath = objectStorageService.normalizeObjectEntityPath(document.fileUrl);

    return {
      ...document,
      // Use the normalized object serving endpoint instead of expired signed URL
      fileUrl: normalizedPath
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
        // Get reporter info
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

        if (documentInfo[0]?.campaignId) {
          // Get campaign info
          const campaignData = await db
            .select()
            .from(campaigns)
            .where(eq(campaigns.id, documentInfo[0].campaignId))
            .limit(1);

          if (campaignData[0]) {
            campaign = campaignData[0];
            
            // Get creator info
            const creatorData = await db
              .select()
              .from(users)
              .where(eq(users.id, campaign.creatorId))
              .limit(1);

            creator = creatorData[0] || null;
          }
        }

        return {
          ...report,
          reporter: reporter[0] || null,
          campaign: campaign ? {
            ...campaign,
            creator: creator
          } : null
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
}

export const storage = new DatabaseStorage();
