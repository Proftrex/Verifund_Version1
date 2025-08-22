import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // KYC and verification fields
  kycStatus: varchar("kyc_status").default("pending"), // pending, verified, rejected
  kycDocuments: text("kyc_documents"), // JSON string
  
  // Professional details for enhanced verification
  education: text("education"), // Educational background
  profession: varchar("profession"), // Current profession/job title
  workExperience: text("work_experience"), // Work experience details
  linkedinProfile: varchar("linkedin_profile"), // LinkedIn URL for professional verification
  organizationName: varchar("organization_name"), // Current organization/company
  organizationType: varchar("organization_type"), // Government, NGO, Private, etc.
  phoneNumber: varchar("phone_number"), // Contact number for verification
  address: text("address"), // Complete address
  
  // Account details - Multiple wallet types
  pusoBalance: decimal("puso_balance", { precision: 15, scale: 2 }).default("0.00"), // Main wallet for deposits/withdrawals
  tipsBalance: decimal("tips_balance", { precision: 15, scale: 2 }).default("0.00"), // Tips from contributors
  contributionsBalance: decimal("contributions_balance", { precision: 15, scale: 2 }).default("0.00"), // Claimable contributions
  
  // Role management
  isAdmin: boolean("is_admin").default(false),
  isSupport: boolean("is_support").default(false), // Support staff with limited admin access
  isProfileComplete: boolean("is_profile_complete").default(false),
  
  // Blockchain wallet integration
  celoWalletAddress: varchar("celo_wallet_address"), // User's Celo wallet address
  walletPrivateKey: text("wallet_private_key"), // Encrypted private key
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // emergency, education, healthcare, community, environment
  goalAmount: decimal("goal_amount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 15, scale: 2 }).default("0.00"),
  images: text("images"), // JSON array of image URLs
  status: varchar("status").default("pending"), // pending, active, completed, rejected, flagged
  tesVerified: boolean("tes_verified").default(false),
  duration: integer("duration").notNull(), // days
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contributions = pgTable("contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  contributorId: varchar("contributor_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  message: text("message"),
  isAnonymous: boolean("is_anonymous").default(false),
  transactionHash: varchar("transaction_hash"), // Mock blockchain hash
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  type: varchar("type").notNull(), // deposit, withdrawal, contribution, expense, conversion
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("PHP"), // PHP, PUSO
  description: text("description").notNull(),
  status: varchar("status").default("pending"), // pending, completed, failed
  
  // Blockchain data
  transactionHash: varchar("transaction_hash"), // Celo blockchain hash
  blockNumber: varchar("block_number"), // Block number
  
  // Payment provider data
  paymentProvider: varchar("payment_provider"), // paymongo, celo
  paymentProviderTxId: varchar("payment_provider_tx_id"), // PayMongo payment ID
  
  // Conversion data
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }), // PHP to PUSO rate
  feeAmount: decimal("fee_amount", { precision: 15, scale: 2 }).default("0.00"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const volunteerOpportunities = pgTable("volunteer_opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  slotsNeeded: integer("slots_needed").notNull(),
  slotsFilled: integer("slots_filled").default(0),
  status: varchar("status").default("active"), // active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

export const volunteerApplications = pgTable("volunteer_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  opportunityId: varchar("opportunity_id").notNull().references(() => volunteerOpportunities.id),
  volunteerId: varchar("volunteer_id").notNull().references(() => users.id),
  status: varchar("status").default("pending"), // pending, approved, rejected
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const campaignUpdates = pgTable("campaign_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  images: text("images"), // JSON array of image URLs
  createdAt: timestamp("created_at").defaultNow(),
});

// PayMongo payment records
export const paymentRecords = pgTable("payment_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  
  // PayMongo data
  paymongoPaymentId: varchar("paymongo_payment_id").unique(),
  paymongoPaymentIntentId: varchar("paymongo_payment_intent_id"),
  paymongoSourceId: varchar("paymongo_source_id"),
  
  // Payment details
  paymentMethod: varchar("payment_method"), // gcash, grabpay, card, bank_transfer
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency").default("PHP"),
  status: varchar("status").default("pending"), // pending, paid, failed, cancelled
  
  // Metadata
  description: text("description"),
  metadata: jsonb("metadata"), // Additional PayMongo data
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exchange rates for PHP to PUSO conversion
export const exchangeRates = pgTable("exchange_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromCurrency: varchar("from_currency").notNull(),
  toCurrency: varchar("to_currency").notNull(),
  rate: decimal("rate", { precision: 10, scale: 6 }).notNull(),
  source: varchar("source").default("manual"), // manual, api, oracle
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blockchain configuration
export const blockchainConfig = pgTable("blockchain_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  network: varchar("network").notNull(), // celo-mainnet, celo-alfajores
  contractAddress: varchar("contract_address"), // PUSO token contract
  contractAbi: jsonb("contract_abi"), // Contract ABI
  rpcUrl: varchar("rpc_url").notNull(),
  explorerUrl: varchar("explorer_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Support staff invitation system
export const supportInvitations = pgTable("support_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  invitedBy: varchar("invited_by").notNull().references(() => users.id), // Admin who sent invitation
  token: varchar("token").notNull().unique(),
  status: varchar("status").default("pending"), // pending, accepted, expired, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // 7 days from creation
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;
export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = typeof contributions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type VolunteerOpportunity = typeof volunteerOpportunities.$inferSelect;
export type InsertVolunteerOpportunity = typeof volunteerOpportunities.$inferInsert;
export type VolunteerApplication = typeof volunteerApplications.$inferSelect;
export type InsertVolunteerApplication = typeof volunteerApplications.$inferInsert;
export type CampaignUpdate = typeof campaignUpdates.$inferSelect;
export type InsertCampaignUpdate = typeof campaignUpdates.$inferInsert;
export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type InsertPaymentRecord = typeof paymentRecords.$inferInsert;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = typeof exchangeRates.$inferInsert;
export type BlockchainConfig = typeof blockchainConfig.$inferSelect;
export type InsertBlockchainConfig = typeof blockchainConfig.$inferInsert;
export type SupportInvitation = typeof supportInvitations.$inferSelect;
export type InsertSupportInvitation = typeof supportInvitations.$inferInsert;

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  currentAmount: true,
  status: true,
  tesVerified: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContributionSchema = createInsertSchema(contributions).omit({
  id: true,
  transactionHash: true,
  createdAt: true,
});

export const insertVolunteerApplicationSchema = createInsertSchema(volunteerApplications).omit({
  id: true,
  status: true,
  createdAt: true,
});
