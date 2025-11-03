# FUN - Creator Super-App Platform

## Overview

FUN is a comprehensive creator platform for adult content that combines social media, live streaming, premium content monetization, and community features. The platform serves as a "super app" for adult creators, integrating the best aspects of TikTok (short-form content), OnlyFans (premium subscriptions), Chaturbate (live streaming), and social networking into a unified ecosystem.

The application enables creators to:
- Build and monetize their brand through tiered subscriptions
- Share content (images, videos) with watermarking and DRM protection
- Stream live with interactive chat features
- Engage with fans through direct messaging
- Participate in community forums
- Access detailed analytics and earnings dashboards

The platform emphasizes creator empowerment with transparent monetization, robust security features, and comprehensive tools for content management and audience engagement.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- Tailwind CSS with custom design system for styling
- Shadcn UI component library (New York style variant) for consistent UI patterns

**Design System:**
- Dark theme with purple/pink gradient accents (primary: `hsl(271 91% 65%)`, secondary: `hsl(330 81% 60%)`)
- Glass morphism effects with backdrop blur for modern aesthetics
- Custom CSS variables for theming flexibility
- Responsive design with mobile-first approach

**Key Frontend Features:**
- TikTok-style infinite scroll feed with lazy loading
- Real-time WebSocket connections for live streaming and chat
- File upload with Uppy for media content (images/videos)
- Stripe Elements integration for payment processing
- Authentication state management with automatic redirect handling
- Progressive enhancement with graceful error handling

**Rationale:** React with TypeScript provides strong typing and component reusability. Vite offers superior development experience with instant HMR. TanStack Query handles complex server state scenarios like caching, background refetching, and optimistic updates. The Shadcn UI approach (copy-paste components) allows full customization while maintaining consistency.

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js for REST API server
- TypeScript for type safety across the stack
- Drizzle ORM for database operations with type-safe queries
- WebSocket Server (ws library) for real-time features
- Passport.js with OpenID Connect strategy for authentication

**API Structure:**
- RESTful endpoints under `/api/*` namespace
- Authentication middleware protection for protected routes
- Request/response logging with performance tracking
- JSON body parsing with raw body preservation for webhook verification
- CORS and security headers configuration

**Authentication Flow:**
- Email/password authentication using Passport.js Local Strategy
- Session-based authentication with PostgreSQL session store
- Password hashing with bcrypt (10 salt rounds)
- Secure session cookies (httpOnly, secure in production)

**Real-time Communication:**
- WebSocket server mounted at `/ws` path
- Separate connection handling for live streams and chat
- Client identification and stream room management
- Message broadcasting to stream participants

**Rationale:** Express provides a mature, well-documented framework for building REST APIs. TypeScript ensures type safety across frontend and backend through shared schemas. Drizzle ORM offers excellent TypeScript integration and migration support. WebSockets enable real-time features like live streaming and instant messaging without polling overhead.

### Data Storage Architecture

**Database:**
- PostgreSQL as the primary relational database
- Neon Serverless for managed PostgreSQL hosting
- Connection pooling for efficient resource usage
- Drizzle ORM with migration support for schema evolution

**Schema Design:**
- `users` table (required by Replit Auth) stores core user information
- `creators` table extends users with creator-specific profiles
- `posts` table for content with visibility levels (free/premium/exclusive)
- `subscription_tiers` table for flexible pricing models
- `subscriptions` table tracking active user subscriptions
- `live_streams` table for streaming sessions with viewer counts
- `messages` table for direct messaging between users
- `forum_categories`, `forum_threads`, `forum_replies` for community features
- `likes` and `comments` tables for engagement tracking
- `analytics` table for creator metrics and insights
- `sessions` table for session storage (connect-pg-simple)

**Data Relationships:**
- One-to-one: User → Creator profile
- One-to-many: Creator → Posts, Subscription Tiers, Live Streams
- Many-to-many: Users ↔ Subscriptions (through subscriptions junction table)
- Tree structure: Forum Categories → Threads → Replies

**Object Storage:**
- Google Cloud Storage for media files (images, videos)
- Custom ACL (Access Control List) system for permission management
- Object metadata for watermark tracking and forensic identification
- Signed URLs for secure temporary access to premium content

**Rationale:** PostgreSQL provides ACID compliance, complex queries, and JSON support. The schema supports flexible content visibility rules and subscription tiers. Separating media storage from database reduces costs and improves performance. The custom ACL system allows fine-grained access control for premium content.

### External Dependencies

**Authentication & Identity:**
- Email/Password authentication with Passport.js Local Strategy
- Bcrypt for secure password hashing (10 salt rounds)
- Session management via `connect-pg-simple` with PostgreSQL backing

**Payment Processing:**
- Stripe - Subscription billing, one-time payments, and tips
- Stripe Elements for PCI-compliant payment form handling
- Webhook integration for subscription lifecycle events

**Media Storage & Processing:**
- Google Cloud Storage - Object storage for user-uploaded media
- Replit Object Storage Sidecar - Local development and authentication proxy
- Custom watermarking service for content protection

**Real-time Infrastructure:**
- WebSocket Server (ws) - Native WebSocket connections for live features
- Potential future integration with GetStream.io for scalable streaming

**UI Components:**
- Radix UI primitives - Accessible, unstyled component primitives
- Shadcn UI - Pre-built component patterns built on Radix
- Uppy - File upload with progress tracking and resumable uploads

**Development Tools:**
- Vite plugins for Replit integration (cartographer, dev banner, error modal)
- Drizzle Kit for database migrations
- ESBuild for production server bundling

**Environment Variables Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (required for secure sessions)
- `STRIPE_SECRET_KEY` - Stripe API key for backend (optional)
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key for frontend (optional)

**Rationale:** Email/password authentication provides full control and simplicity. Bcrypt with 10 salt rounds ensures secure password storage. Stripe handles payment compliance and international transactions. Google Cloud Storage provides enterprise-grade reliability for media assets. Radix UI ensures accessibility compliance, while Shadcn provides rapid development without vendor lock-in.