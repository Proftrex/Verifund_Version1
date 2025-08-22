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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
