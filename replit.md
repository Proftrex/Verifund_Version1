# VeriFund - Crowdfunding Platform

## Overview

VeriFund is a community-driven crowdfunding platform designed for the Philippines market. The platform enables transparent fundraising with blockchain-like transparency, allowing users to create campaigns, make contributions, and volunteer for causes. Key features include KYC verification, fee-based revenue model, admin controls, and real-time transaction tracking using the $PUSO token system.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**August 26, 2025 - Creator Details Standardization:**
- ✅ Standardized creator detail display across admin dashboard sections
- ✅ Updated MY WORK → Claimed Assignments → Campaigns to show comprehensive creator information
- ✅ Both Campaign Management and MY WORK sections now display identical detailed creator profiles
- ✅ Enhanced creator viewer with three-column layout: Personal Information, Platform Activity, Account Settings
- ✅ Comprehensive creator data including bio, interests, platform metrics, verification status, and account statistics
- ✅ Consistent user experience across all admin sections when viewing creator details

**August 26, 2025 - Admin Dashboard Enhancements:**
- ✅ Added comprehensive claim button functionality for reports with state management
- ✅ Implemented "Pending Campaigns" tab in MY WORK -> Claimed Assignments section  
- ✅ Fixed cache invalidation to properly reflect claimed reports across all tabs
- ✅ Enhanced report claiming workflow with visual feedback and disabled state management
- ✅ Integrated approval/reject actions for pending campaigns with detailed review interface
- ✅ Fixed API endpoint mismatch: added PATCH /api/admin/reports/:id/claim to match frontend calls
- ✅ Resolved Creator Reports tab showing empty - claimed reports now appear in MY WORK section
- ✅ Added "Claim" and "Assign" buttons directly to all Reports Management panel tabs
- ✅ Enhanced claim button state to track individual report IDs for better UX
- ✅ Unified admin actions across both Reports Management and Report Details modal

**August 26, 2025 - KYC Function Hoisting Issue Resolved:**
- ✅ Fixed critical JavaScript function hoisting error in admin panel KYC viewer
- ✅ Moved renderUserProfile function definition to proper location within MyWorksSection component
- ✅ Removed extensive duplicate and corrupted function definitions causing syntax errors
- ✅ Cleaned up 386 lines of orphaned JSX elements and malformed code structure
- ✅ Admin dashboard now loads successfully with full KYC management functionality restored
- ✅ All LSP diagnostics cleared - no syntax or type errors remaining

**August 26, 2025 - KYC Management Complete Standardization:**
- ✅ Enhanced KYC document viewing with professional DocumentViewer component integration
- ✅ Added comprehensive document display with Government ID and Proof of Address previews
- ✅ Implemented View Full, Download, and modal document viewer functionality
- ✅ Added visual Upload/Missing status badges for each document type
- ✅ Standardized admin actions: added both CLAIM and ASSIGN buttons to match other sections
- ✅ Fixed KYC workflow: claimed items now remain visible in Pending KYC until verified/rejected
- ✅ Enhanced claimed status display showing which admin claimed each KYC request
- ✅ Added direct Approve/Reject buttons for claimed KYC requests in the main pending list
- ✅ Completed admin action standardization across all three management sections
- ✅ Fixed user profile inconsistency: MY WORK section now uses same enhanced profile display as KYC Management
- ✅ Standardized user information display with avatar, email, and comprehensive document viewing across all sections
- ✅ Fixed completed KYC profile inconsistency: MY WORK -> Completed Assignments now uses standardized renderUserProfile
- ✅ All KYC sections now display identical comprehensive user information with enhanced DocumentViewer integration
- ✅ Fixed campaign information inconsistency: MY WORK -> Completed Campaigns now uses standardized renderCampaignDetails
- ✅ All campaign sections now display identical comprehensive campaign and creator information
- ✅ Enhanced document report display: MY WORK -> Completed Documents now shows comprehensive report information
- ✅ Added detailed report viewing with reporter information, evidence, and resolution details matching Reports Management
- ✅ Enhanced campaign report display: MY WORK -> Completed Campaign Reports now shows comprehensive report information
- ✅ Added detailed campaign report viewing with reporter information, campaign details, and resolution information matching Reports Management
- ✅ Enhanced volunteer report display: MY WORK -> Completed Volunteers now shows comprehensive report information
- ✅ Added detailed volunteer report viewing with reporter information, volunteer details, and resolution information matching Reports Management
- ✅ Enhanced creator report display: MY WORK -> Completed Creators now shows comprehensive report information
- ✅ Added detailed creator report viewing with reporter information, creator details, and resolution information matching Reports Management
- ✅ Completed full standardization: All MY WORK -> Completed Assignments sections now display comprehensive information matching their respective management sections
- ✅ Enhanced campaign claim display: Campaign Management now shows admin email/name when claimed, matching Reports Management standard
- ✅ Enhanced KYC claim display: KYC Management now shows comprehensive processing information with admin email/name and timestamps, matching other sections

**August 26, 2025 - Manager Role Implementation:**
- ✅ Added Manager role to user schema with database column `is_manager`
- ✅ Updated admin dashboard authentication to include Manager access
- ✅ Enhanced role display badge to show Admin/Manager/Support status
- ✅ Updated Reports Management ASSIGN button access: Admin and Manager can assign reports
- ✅ Updated Campaign and KYC ASSIGN button access: Admin and Manager only (enhanced security model)
- ✅ Consistent ASSIGN access control: All assignment functions now require Admin or Manager privileges

**August 26, 2025 - Support System Complete Implementation:**
- ✅ Implemented comprehensive Support Ticket Management interface in admin panel
- ✅ Added ticket overview dashboard with pending, in-progress, and resolved counts
- ✅ Enhanced ticket listing with priority badges, category icons, and status indicators
- ✅ Created detailed ticket view modal with complete information display
- ✅ Integrated ticket claiming functionality for support staff workflow
- ✅ Added role-based access control: Admin, Manager, and Support can access tickets
- ✅ Maintained consistent ASSIGN button permissions (Admin/Manager only)
- ✅ Connected frontend interface with existing backend API endpoints
- ✅ Support ticket system now fully operational from user submission to admin management

**August 26, 2025 - Success Stories Management Complete Implementation:**
- ✅ Implemented comprehensive Success Stories Management interface replacing placeholder
- ✅ Added story overview dashboard with published, draft, and archived counts plus total views
- ✅ Created three-tab system: Published Stories, Drafts, Archived Stories with filtering
- ✅ Built professional story creation form with title, excerpt, cover media, and content fields
- ✅ Added detailed story viewing modal with metadata, engagement stats, and admin actions
- ✅ Integrated real-time story publishing with immediate appearance in Latest News section
- ✅ Connected frontend to existing robust backend API infrastructure
- ✅ Added story deletion functionality with confirmation dialog
- ✅ Role-based access control: Admin and Support staff can manage stories
- ✅ Professional loading states, error handling, and user feedback notifications
- ✅ Stories system now fully operational: Admin publishes → Appears on landing page Latest News

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Single-page application using React with TypeScript for type safety
- **Wouter**: Lightweight client-side routing library instead of React Router
- **TanStack Query**: Server state management and caching for API calls
- **shadcn/ui Components**: Pre-built UI component library with Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Form Management**: React Hook Form with Zod validation for type-safe forms

### Backend Architecture
- **Express.js**: Node.js web framework serving both API endpoints and static files
- **TypeScript**: Full-stack TypeScript implementation with ES modules
- **Session-based Authentication**: Express sessions with PostgreSQL storage
- **RESTful API**: Structured API endpoints for campaigns, contributions, users, and admin functions

### Database Layer
- **PostgreSQL**: Primary database with Neon serverless PostgreSQL
- **Drizzle ORM**: Type-safe database operations with schema-first approach
- **Shared Schema**: Common TypeScript types and database schema shared between client and server

### Authentication System
- **Replit Authentication**: OpenID Connect integration for user authentication
- **Role-based Access**: Admin and regular user roles with protected routes
- **KYC Verification**: Built-in identity verification system for campaign creators

### Project Structure
- **Monorepo Design**: Client, server, and shared code in single repository
- **Path Aliases**: TypeScript path mapping for clean imports (@/, @shared/)
- **Build Process**: Vite for frontend bundling, esbuild for server compilation

### Data Models
The system manages five core entities:
- **Users**: Authentication, KYC status, PUSO balance, admin privileges
- **Campaigns**: Fundraising campaigns with goals, categories, and status tracking
- **Contributions**: User donations to campaigns with amount tracking
- **Transactions**: Financial transaction history for transparency
- **Volunteer Systems**: Opportunity listings and application management

### Revenue Model Integration
- **Multi-point Fee Structure**: Platform fees, conversion fees, withdrawal fees, and tip fees
- **Transparent Pricing**: Fee calculator component for user transparency
- **PUSO Token System**: Internal currency for contributions and withdrawals

### Security Features
- **Admin Panel**: Secure backend dashboard for platform management
- **Fraud Detection**: Campaign flagging and review systems
- **Data Validation**: Zod schemas for runtime type checking
- **Session Security**: HTTP-only cookies with secure configuration

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Platform**: Integrated development and hosting environment with authentication
- **Node.js Runtime**: Server-side JavaScript execution environment

### Frontend Libraries
- **Radix UI**: Unstyled, accessible UI component primitives
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for managing component variants
- **Date-fns**: Date manipulation and formatting library

### Development Tools
- **Vite**: Frontend build tool with hot module replacement
- **ESBuild**: Fast JavaScript bundler for server compilation
- **TypeScript**: Static type checking and compilation
- **PostCSS**: CSS processing with Tailwind CSS integration

### Authentication & Session Management
- **OpenID Client**: Integration with Replit's authentication system
- **Passport.js**: Authentication middleware for Express
- **Connect-pg-simple**: PostgreSQL session store for Express sessions

### Database & ORM
- **Drizzle Kit**: Database migration and schema management tools
- **WebSocket Support**: Real-time connection capabilities for database operations