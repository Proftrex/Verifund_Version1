# VeriFund - Crowdfunding Platform

## Overview

VeriFund is a community-driven crowdfunding platform designed for the Philippines market. The platform enables transparent fundraising with blockchain-like transparency, allowing users to create campaigns, make contributions, and volunteer for causes. Key features include KYC verification, fee-based revenue model, admin controls, and real-time transaction tracking using the $PUSO token system.

## User Preferences

Preferred communication style: Simple, everyday language.

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
  - **ACTIVE CAMPAIGNS**: 'active' and 'on_progress' statuses (visible to all users)
  - **INACTIVE CAMPAIGNS**: 'closed' and 'completed' statuses (campaign ended)
  - Other statuses: 'pending' (awaiting approval), 'cancelled', 'rejected', 'flagged', 'closed_with_refund'
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