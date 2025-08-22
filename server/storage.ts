import {
  users,
  campaigns,
  contributions,
  transactions,
  volunteerOpportunities,
  volunteerApplications,
  campaignUpdates,
  paymentRecords,
  exchangeRates,
  blockchainConfig,
  supportInvitations,
  type User,
  type UpsertUser,
  type Campaign,
  type InsertCampaign,
  type Contribution,
  type InsertContribution,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or } from "drizzle-orm";
import crypto from "crypto";

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
        transaction: {
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
          metadata: transactions.metadata,
        },
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          pusoBalance: users.pusoBalance,
          tipsBalance: users.tipsBalance,
          contributionsBalance: users.contributionsBalance,
          kycStatus: users.kycStatus,
        },
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
      id: result.transaction.id,
      type: result.transaction.type,
      amount: result.transaction.amount,
      currency: result.transaction.currency,
      status: result.transaction.status,
      description: result.transaction.description,
      createdAt: result.transaction.createdAt,
      updatedAt: result.transaction.updatedAt,
      transactionHash: result.transaction.transactionHash,
      blockNumber: result.transaction.blockNumber,
      exchangeRate: result.transaction.exchangeRate,
      feeAmount: result.transaction.feeAmount,
      paymentProvider: result.transaction.paymentProvider,
      paymentProviderTxId: result.transaction.paymentProviderTxId,
      metadata: result.transaction.metadata,
      user: result.user,
      // Calculate PHP equivalent for display
      phpEquivalent: result.transaction.exchangeRate 
        ? (parseFloat(result.transaction.amount) * parseFloat(result.transaction.exchangeRate)).toFixed(2)
        : result.transaction.amount
    }));
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
}

export const storage = new DatabaseStorage();
