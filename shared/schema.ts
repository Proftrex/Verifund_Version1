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
import { relations } from 'drizzle-orm';

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
  // Volunteer requirements
  needsVolunteers: boolean("needs_volunteers").default(false),
  volunteerSlots: integer("volunteer_slots").default(0),
  volunteerSlotsFilledCount: integer("volunteer_slots_filled_count").default(0),
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

export const tips = pgTable("tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  tipperId: varchar("tipper_id").notNull().references(() => users.id),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  message: text("message"),
  isAnonymous: boolean("is_anonymous").default(false),
  transactionHash: varchar("transaction_hash"), // Blockchain hash for tip transaction
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // volunteer_approved, volunteer_rejected, campaign_update, contribution_received, tip_received
  isRead: boolean("is_read").default(false),
  relatedId: varchar("related_id"), // ID of related entity (campaign, volunteer application, etc.)
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  type: varchar("type").notNull(), // deposit, withdrawal, contribution, tip, expense, conversion
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
  opportunityId: varchar("opportunity_id").references(() => volunteerOpportunities.id), // Made nullable for direct campaign applications
  campaignId: varchar("campaign_id").references(() => campaigns.id), // Link to campaign for direct volunteer applications
  volunteerId: varchar("volunteer_id").notNull().references(() => users.id),
  status: varchar("status").default("pending"), // pending, approved, rejected
  message: text("message"),
  intent: text("intent").notNull(), // Why they want to volunteer - required field
  rejectionReason: text("rejection_reason"), // Reason for rejection if applicable
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

// Campaign engagement features
export const campaignReactions = pgTable("campaign_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  reactionType: varchar("reaction_type").notNull(), // like, love, support, wow, sad, angry
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_campaign_reactions_campaign_user").on(table.campaignId, table.userId),
]);

export const campaignComments = pgTable("campaign_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const commentReplies = pgTable("comment_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull().references(() => campaignComments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;
export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = typeof contributions.$inferInsert;
export type Tip = typeof tips.$inferSelect;
export type InsertTip = typeof tips.$inferInsert;
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
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type CampaignReaction = typeof campaignReactions.$inferSelect;
export type InsertCampaignReaction = typeof campaignReactions.$inferInsert;
export type CampaignComment = typeof campaignComments.$inferSelect;
export type InsertCampaignComment = typeof campaignComments.$inferInsert;
export type CommentReply = typeof commentReplies.$inferSelect;
export type InsertCommentReply = typeof commentReplies.$inferInsert;

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

export const insertTipSchema = createInsertSchema(tips).omit({
  id: true,
  transactionHash: true,
  createdAt: true,
});

export const insertVolunteerApplicationSchema = createInsertSchema(volunteerApplications).omit({
  id: true,
  status: true,
  rejectionReason: true,
  createdAt: true,
});

// Enhanced schema for volunteer applications with intent requirement
export const volunteerApplicationFormSchema = insertVolunteerApplicationSchema.extend({
  intent: z.string().min(20, "Please provide at least 20 characters explaining why you want to volunteer"),
}).omit({ opportunityId: true, campaignId: true, volunteerId: true });

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignReactionSchema = createInsertSchema(campaignReactions).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignCommentSchema = createInsertSchema(campaignComments).omit({
  id: true,
  isEdited: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentReplySchema = createInsertSchema(commentReplies).omit({
  id: true,
  isEdited: true,
  createdAt: true,
  updatedAt: true,
});

// Progress Reports table
export const progressReports = pgTable("progress_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  reportDate: timestamp("report_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document types enum  
export const documentTypeEnum = [
  'image',
  'video_link', 
  'official_receipt',
  'acknowledgement_receipt',
  'expense_summary',
  'invoice',
  'contract',
  'other'
] as const;

// Progress Report Documents table
export const progressReportDocuments = pgTable("progress_report_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  progressReportId: varchar("progress_report_id").notNull().references(() => progressReports.id),
  documentType: varchar("document_type", { enum: documentTypeEnum }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Credit Scores table
export const userCreditScores = pgTable("user_credit_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  progressReportId: varchar("progress_report_id").notNull().references(() => progressReports.id),
  scorePercentage: integer("score_percentage").notNull().default(0),
  completedDocumentTypes: text("completed_document_types").array().notNull().default(sql`ARRAY[]::text[]`),
  totalRequiredTypes: integer("total_required_types").notNull().default(8),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for progress reports
export const insertProgressReportSchema = createInsertSchema(progressReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProgressReportDocumentSchema = createInsertSchema(progressReportDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertUserCreditScoreSchema = createInsertSchema(userCreditScores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Relations for progress reports
export const progressReportsRelations = relations(progressReports, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [progressReports.campaignId],
    references: [campaigns.id],
  }),
  createdBy: one(users, {
    fields: [progressReports.createdById],
    references: [users.id],
  }),
  documents: many(progressReportDocuments),
  creditScore: one(userCreditScores),
}));

export const progressReportDocumentsRelations = relations(progressReportDocuments, ({ one }) => ({
  progressReport: one(progressReports, {
    fields: [progressReportDocuments.progressReportId],
    references: [progressReports.id],
  }),
}));

export const userCreditScoresRelations = relations(userCreditScores, ({ one }) => ({
  user: one(users, {
    fields: [userCreditScores.userId],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [userCreditScores.campaignId],
    references: [campaigns.id],
  }),
  progressReport: one(progressReports, {
    fields: [userCreditScores.progressReportId],
    references: [progressReports.id],
  }),
}));

// Types
export type ProgressReport = typeof progressReports.$inferSelect;
export type InsertProgressReport = z.infer<typeof insertProgressReportSchema>;
export type ProgressReportDocument = typeof progressReportDocuments.$inferSelect;
export type InsertProgressReportDocument = z.infer<typeof insertProgressReportDocumentSchema>;
export type UserCreditScore = typeof userCreditScores.$inferSelect;
export type InsertUserCreditScore = z.infer<typeof insertUserCreditScoreSchema>;
