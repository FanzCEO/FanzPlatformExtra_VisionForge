import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { liveStreamingService } from "./liveStreaming";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // ==================== AUTH ROUTES ====================
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has a creator profile
      const creator = await storage.getCreatorByUserId(userId);
      
      res.json({ ...user, creator });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ==================== CREATOR ROUTES ====================
  app.post("/api/creators", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if creator profile already exists
      const existing = await storage.getCreatorByUserId(userId);
      if (existing) {
        return res.status(400).json({ message: "Creator profile already exists" });
      }

      const creatorData = {
        userId,
        username: req.body.username,
        displayName: req.body.displayName,
        bio: req.body.bio,
        coverImageUrl: req.body.coverImageUrl,
      };

      const creator = await storage.createCreator(creatorData);
      res.json(creator);
    } catch (error: any) {
      console.error("Error creating creator:", error);
      res.status(500).json({ message: error.message || "Failed to create creator profile" });
    }
  });

  app.get("/api/creators/trending", async (_req, res) => {
    try {
      const creators = await storage.getTrendingCreators(10);
      res.json(creators);
    } catch (error) {
      console.error("Error fetching trending creators:", error);
      res.status(500).json({ message: "Failed to fetch trending creators" });
    }
  });

  app.get("/api/creators/:username", async (req, res) => {
    try {
      const creator = await storage.getCreatorByUsername(req.params.username);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      res.json(creator);
    } catch (error) {
      console.error("Error fetching creator:", error);
      res.status(500).json({ message: "Failed to fetch creator" });
    }
  });

  app.put("/api/creators/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const creator = await storage.getCreator(req.params.id);
      
      if (!creator || creator.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updates = {
        displayName: req.body.displayName,
        bio: req.body.bio,
        coverImageUrl: req.body.coverImageUrl,
      };

      const updated = await storage.updateCreator(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating creator:", error);
      res.status(500).json({ message: "Failed to update creator" });
    }
  });

  // ==================== POST ROUTES ====================
  app.get("/api/posts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const posts = await storage.getFeedPosts(limit, offset);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Increment view count
      await storage.incrementPostViews(req.params.id);
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const creator = await storage.getCreatorByUserId(userId);
      
      if (!creator) {
        return res.status(403).json({ message: "Creator profile required" });
      }

      const postData = {
        creatorId: creator.id,
        contentType: req.body.contentType,
        visibility: req.body.visibility || "free",
        caption: req.body.caption,
        mediaUrls: req.body.mediaUrls,
        thumbnailUrl: req.body.thumbnailUrl,
        duration: req.body.duration,
        hasWatermark: req.body.hasWatermark || false,
      };

      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/creators/:username/posts", async (req, res) => {
    try {
      const creator = await storage.getCreatorByUsername(req.params.username);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const posts = await storage.getPostsByCreator(creator.id, limit, offset);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching creator posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // ==================== LIKE ROUTES ====================
  app.post("/api/posts/:postId/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.postId;

      const existing = await storage.getLike(userId, postId);
      if (existing) {
        await storage.deleteLike(userId, postId);
        return res.json({ liked: false });
      }

      await storage.createLike(userId, postId);
      res.json({ liked: true });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // ==================== COMMENT ROUTES ====================
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByPost(req.params.postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:postId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentData = {
        userId,
        postId: req.params.postId,
        content: req.body.content,
      };

      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // ==================== SUBSCRIPTION ROUTES ====================
  app.get("/api/subscription-tiers/:creatorId", async (req, res) => {
    try {
      const tiers = await storage.getCreatorSubscriptionTiers(req.params.creatorId);
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching subscription tiers:", error);
      res.status(500).json({ message: "Failed to fetch subscription tiers" });
    }
  });

  app.post("/api/create-subscription", isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is currently unavailable. Please configure Stripe API keys." });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { tierId, creatorId } = req.body;
      
      const tier = await storage.getSubscriptionTier(tierId);
      if (!tier) {
        return res.status(404).json({ message: "Subscription tier not found" });
      }

      // Check if already subscribed
      const existing = await storage.getSubscription(userId, creatorId);
      if (existing && existing.status === "active") {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId!);
        return res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      }

      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId },
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(userId, { customerId, subscriptionId: "" });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: tier.stripePriceId! }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      });

      await storage.updateUserStripeInfo(userId, { 
        customerId, 
        subscriptionId: subscription.id 
      });

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await storage.createSubscription({
        userId,
        creatorId,
        tierId,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: error.message || "Failed to create subscription" });
    }
  });

  // ==================== LIVE STREAM ROUTES ====================
  app.get("/api/live-streams/active", async (_req, res) => {
    try {
      const streams = await storage.getActiveLiveStreams();
      res.json(streams);
    } catch (error) {
      console.error("Error fetching live streams:", error);
      res.status(500).json({ message: "Failed to fetch live streams" });
    }
  });

  app.post("/api/live-streams", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const creator = await storage.getCreatorByUserId(userId);
      
      if (!creator) {
        return res.status(403).json({ message: "Creator profile required" });
      }

      const streamData = {
        creatorId: creator.id,
        title: req.body.title,
        description: req.body.description,
        thumbnailUrl: req.body.thumbnailUrl,
        status: "scheduled",
      };

      const stream = await storage.createLiveStream(streamData);
      res.json(stream);
    } catch (error) {
      console.error("Error creating live stream:", error);
      res.status(500).json({ message: "Failed to create live stream" });
    }
  });

  app.put("/api/live-streams/:id/start", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const creator = await storage.getCreatorByUserId(userId);
      
      if (!creator) {
        return res.status(403).json({ message: "Creator profile required" });
      }

      const stream = await storage.getLiveStream(req.params.id);
      if (!stream || stream.creatorId !== creator.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updated = await storage.updateLiveStream(req.params.id, {
        status: "live",
        startedAt: new Date(),
      });

      res.json(updated);
    } catch (error) {
      console.error("Error starting live stream:", error);
      res.status(500).json({ message: "Failed to start live stream" });
    }
  });

  // ==================== MESSAGE ROUTES ====================
  app.get("/api/messages/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/messages/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const otherUserId = req.params.userId;
      const limit = parseInt(req.query.limit as string) || 50;

      const messages = await storage.getConversation(currentUserId, otherUserId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const messageData = {
        senderId,
        receiverId: req.body.receiverId,
        content: req.body.content,
      };

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ==================== FORUM ROUTES ====================
  app.get("/api/forum/categories", async (_req, res) => {
    try {
      const categories = await storage.getForumCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching forum categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/forum/categories/:categoryId/threads", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const threads = await storage.getForumThreads(req.params.categoryId, limit, offset);
      res.json(threads);
    } catch (error) {
      console.error("Error fetching forum threads:", error);
      res.status(500).json({ message: "Failed to fetch threads" });
    }
  });

  app.post("/api/forum/threads", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const threadData = {
        categoryId: req.body.categoryId,
        userId,
        title: req.body.title,
        content: req.body.content,
      };

      const thread = await storage.createForumThread(threadData);
      res.json(thread);
    } catch (error) {
      console.error("Error creating forum thread:", error);
      res.status(500).json({ message: "Failed to create thread" });
    }
  });

  app.get("/api/forum/threads/:threadId", async (req, res) => {
    try {
      const thread = await storage.getForumThread(req.params.threadId);
      if (!thread) {
        return res.status(404).json({ message: "Thread not found" });
      }
      res.json(thread);
    } catch (error) {
      console.error("Error fetching thread:", error);
      res.status(500).json({ message: "Failed to fetch thread" });
    }
  });

  app.get("/api/forum/threads/:threadId/replies", async (req, res) => {
    try {
      const replies = await storage.getForumReplies(req.params.threadId);
      res.json(replies);
    } catch (error) {
      console.error("Error fetching replies:", error);
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  });

  app.post("/api/forum/threads/:threadId/replies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const replyData = {
        threadId: req.params.threadId,
        userId,
        content: req.body.content,
      };

      const reply = await storage.createForumReply(replyData);
      res.json(reply);
    } catch (error) {
      console.error("Error creating reply:", error);
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  // ==================== OBJECT STORAGE ROUTES ====================
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(403);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (_req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/objects/finalize", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { objectURL, visibility } = req.body;

      if (!objectURL) {
        return res.status(400).json({ error: "objectURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(objectURL, {
        owner: userId,
        visibility: visibility || "private",
      });

      res.json({ objectPath });
    } catch (error) {
      console.error("Error finalizing upload:", error);
      res.status(500).json({ error: "Failed to finalize upload" });
    }
  });

  // ==================== ANALYTICS ROUTES ====================
  app.get("/api/analytics/:creatorId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const creator = await storage.getCreator(req.params.creatorId);
      
      if (!creator || creator.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const days = parseInt(req.query.days as string) || 30;
      const analytics = await storage.getCreatorAnalytics(creator.id, days);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket for live streaming
  liveStreamingService.setupWebSocket(httpServer);

  return httpServer;
}
