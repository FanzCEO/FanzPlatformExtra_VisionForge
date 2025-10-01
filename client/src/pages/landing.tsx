import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.603 7.963a.75.75 0 00-.977.572l-.5 2.5a.75.75 0 101.454# thoughts

This is a comprehensive creator super-app platform for adult content creators, combining social media, live streaming, premium content, and community features. Based on the provided vision documents and design reference, I need to build:

1. **Core Features**:
   - User authentication with Replit Auth
   - Creator profiles with customizable bios and content galleries
   - TikTok-style feed with infinite scroll
   - Content upload (images/videos) with watermarking support
   - Premium gated content with tiered subscriptions
   - Live streaming capability with chat
   - Creator dashboard with analytics
   - Fan messaging system (DMs)
   - Community forums
   - Payment integration via Stripe
   - Object storage for media files

2. **Tech Stack**:
   - Frontend: React with TypeScript, Tailwind CSS, Shadcn UI
   - Backend: Express.js with TypeScript
   - Database: PostgreSQL with Drizzle ORM
   - Real-time: Socket.io for WebSockets
   - Media: Object Storage for files, FFmpeg processing
   - Payments: Stripe
   - Auth: Replit Auth (OpenID Connect)

3. **Design Considerations**:
   - Dark theme with purple/pink gradients (hsl(271 91% 65%), hsl(330 81% 60%))
   - Glass morphism effects with backdrop blur
   - Responsive design with mobile-first approach
   - Premium badges and VIP indicators
   - Live streaming indicators with pulse animations

4. **Database Schema**:
   - Users (with Replit Auth integration)
   - Creators (extended user profiles)
   - Content (posts, videos, images)
   - Subscriptions (tiered pricing)
   - Messages (DMs)
   - Forum posts and threads
   - Live streams
   - Analytics/metrics

5. **Key Implementation Notes**:
   - Use Replit Auth blueprint for authentication
   - Use Object Storage blueprint for media handling
   - Implement Stripe blueprint for payments/subscriptions
   - Use WebSocket blueprint for live streaming chat
   - Preserve all design colors and gradients exactly from the HTML reference
   - NO MOCK DATA - all functionality must be real and production-ready

# useful_guidelines_from_blueprints

From **javascript_log_in_with_replit**:
- Use `isAuthenticated` middleware to protect routes
- Use `useAuth` React Hook for client-side authentication state
- Navigate to `/api/login` for login, `/api/logout` for logout
- Handle 401 errors at both page and endpoint levels with toast notifications
- Session storage must use DatabaseStorage, not memory store

From **javascript_object_storage**:
- Always call `check_object_storage_status` tool first
- Use ObjectStorageService in `server/objectStorage.ts`
- Use ObjectUploader component for file uploads with presigned URLs
- Implement ACL policies for protected content
- Public assets served from `/public-objects/:filePath`
- Private objects served from `/objects/:objectPath` with ACL checks

From **javascript_stripe**:
- Use `/api/create-subscription` for subscription payments
- Add `stripeCustomerId` and `stripeSubscriptionId` to user schema
- Wrap payment forms in `<Elements>` provider
- Use tiered subscription model with multiple price points

From **javascript_websocket**:
- WebSocket server on distinct path `/ws` to avoid Vite HMR conflicts
- Check `.readyState` against `WebSocket.OPEN`
- Client connects using proper protocol: `wss:` or `ws:`

From **javascript_database**:
- Always explicitly model relations using `relations` operator
- Use `npm run db:push` for migrations, never write SQL manually
- Replace MemStorage with DatabaseStorage in `server/storage.ts`

# directory_structure

```json
[
  {"path": "shared/schema.ts", "status": "overwritten"},
  {"path": "server/db.ts", "status": "new", "blueprint_source": "javascript_database"},
  {"path": "server/storage.ts", "status": "overwritten"},
  {"path": "server/routes.ts", "status": "overwritten"},
  {"path": "server/replitAuth.ts", "status": "new", "blueprint_source": "javascript_log_in_with_replit"},
  {"path": "server/objectStorage.ts", "status": "new", "blueprint_source": "javascript_object_storage"},
  {"path": "server/objectAcl.ts", "status": "new", "blueprint_source": "javascript_object_storage"},
  {"path": "server/liveStreaming.ts", "status": "new"},
  {"path": "client/src/index.css", "status": "overwritten"},
  {"path": "client/src/App.tsx", "status": "overwritten"},
  {"path": "client/src/hooks/useAuth.ts", "status": "new", "blueprint_source": "javascript_log_in_with_replit"},
  {"path": "client/src/lib/authUtils.ts", "status": "new", "blueprint_source": "javascript_log_in_with_replit"},
  {"path": "client/src/components/ObjectUploader.tsx", "status": "new", "blueprint_source": "javascript_object_storage"},
  {"path": "client/src/components/NavigationHeader.tsx", "status": "new"},
  {"path": "client/src/components/FeedCard.tsx", "status": "new"},
  {"path": "client/src/components/LiveStreamCard.tsx", "status": "new"},
  {"path": "client/src/pages/Landing.tsx", "status": "new"},
  {"path": "client/src/pages/Feed.tsx", "status": "new"},
  {"path": "client/src/pages/Profile.tsx", "status": "new"},
  {"path": "client/src/pages/CreatorDashboard.tsx", "status": "new"},
  {"path": "client/src/pages/LiveStream.tsx", "status": "new"},
  {"path": "client/src/pages/Subscribe.tsx", "status": "new"},
  {"path": "client/src/pages/Community.tsx", "status": "new"},
  {"path": "client/src/pages/Messages.tsx", "status": "new"},
  {"path": "tailwind.config.ts", "status": "overwritten"}
]
