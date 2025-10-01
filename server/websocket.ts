import { WebSocketServer, WebSocket } from "ws";
import { type Server } from "http";
import { type IStorage } from "./storage";

interface WebSocketClient extends WebSocket {
  userId?: string;
  streamId?: string;
}

export function setupWebSocket(httpServer: Server, storage: IStorage) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const clients = new Map<string, Set<WebSocketClient>>();

  wss.on("connection", (ws: WebSocketClient) => {
    console.log("WebSocket client connected");

    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case "auth":
            ws.userId = message.userId;
            break;

          case "join_stream":
            ws.streamId = message.streamId;
            if (!# thoughts

I need to build a comprehensive creator super-app platform combining social media, live streaming, premium content, and community features for adult creators. This is a complex full-stack application that requires:

1. **Authentication & User Management**: Implement Replit Auth for user authentication with creator and fan roles
2. **Database Schema**: Design comprehensive schema for users, content, subscriptions, messages, communities, etc.
3. **Object Storage**: Set up for media files (videos, images) with watermarking support
4. **Payment Integration**: Stripe for subscriptions, tips, and premium content
5. **Core Features**:
   - TikTok-style feed with infinite scroll
   - Creator profiles with customizable bios and galleries
   - Live streaming capability with chat
   - Premium gated content with tiered subscriptions
   - Creator dashboard with analytics
   - Fan messaging system
   - Community forums
   - Content monetization
   - Search and discovery

The design reference shows a dark theme with purple/pink gradients (primary: hsl(271 91% 65%), secondary: hsl(330 81% 60%)). I need to extract all colors and ensure proper contrast.

Key technical decisions:
- Use Replit Auth for authentication
- PostgreSQL database with Drizzle ORM
- Object storage for media with watermarking
- Stripe for payments (tips, subscriptions, PPV)
- WebSocket for real-time features (live streaming, chat)
- Responsive design with mobile-first approach

# useful_guidelines_from_blueprints

From javascript_log_in_with_replit:
- Use Replit as OpenID-connect provider
- Session storage must use DatabaseStorage (not memory store)
- Handle 401 errors at page and endpoint levels with toast notifications and redirects
- User claims include: sub (user id), email, profile_image_url, first_name, last_name

From javascript_database:
- Add Drizzle models to shared/schema.ts
- Use relations operator for modeling relations
- Run `npm run db:push` to apply schema changes

From javascript_object_storage:
- Use ObjectStorageService for all storage operations
- Implement ACL policies for private content
- Use ObjectUploader component for file uploads
- Support both public and protected content serving

From javascript_stripe:
- Use subscription endpoint for recurring payments
- Add stripeCustomerId and stripeSubscriptionId to user schema
- Implement proper error handling for payment flows

From javascript_websocket:
- Add WebSocket server on distinct path (/ws) to avoid Vite HMR conflicts
- Check readyState against WebSocket.OPEN
- Use proper protocol (ws: or wss:) based on page protocol

# directory_structure

```json
[
  {"path": "shared/schema.ts", "status": "overwritten"},
  {"path": "server/db.ts", "status": "new", "blueprint_source": "javascript_database"},
  {"path": "server/storage.ts", "status": "overwritten"},
  {"path": "server/replitAuth.ts", "status": "new", "blueprint_source": "javascript_log_in_with_replit"},
  {"path": "server/routes.ts", "status": "overwritten"},
  {"path": "server/objectStorage.ts", "status": "new", "blueprint_source": "javascript_object_storage"},
  {"path": "server/objectAcl.ts", "status": "new", "blueprint_source": "javascript_object_storage"},
  {"path": "client/src/index.css", "status": "overwritten"},
  {"path": "client/src/App.tsx", "status": "overwritten"},
  {"path": "client/src/hooks/useAuth.ts", "status": "new", "blueprint_source": "javascript_log_in_with_replit"},
  {"path": "client/src/lib/authUtils.ts", "status": "new", "blueprint_source": "javascript_log_in_with_replit"},
  {"path": "client/src/components/ObjectUploader.tsx", "status": "new", "blueprint_source": "javascript_object_storage"},
  {"path": "client/src/pages/landing.tsx", "status": "new"},
  {"path": "client/src/pages/feed.tsx", "status": "new"},
  {"path": "client/src/pages/profile.tsx", "status": "new"},
  {"path": "client/src/pages/dashboard.tsx", "status": "new"},
  {"path": "client/src/pages/creator-profile.tsx", "status": "new"},
  {"path": "client/src/components/navigation-header.tsx", "status": "new"},
  {"path": "client/src/components/feed-card.tsx", "status": "new"},
  {"path": "client/src/components/subscription-modal.tsx", "status": "new"},
  {"path": "client/src/components/upload-modal.tsx", "status": "new"},
  {"path": "tailwind.config.ts", "status": "overwritten"}
]
