import {
  users,
  creators,
  posts,
  subscriptions,
  subscriptionTiers,
  liveStreams,
  messages,
  likes,
  comments,
  forumThreads,
  forumReplies,
  forumCategories,
  analytics,
  type User,
  type UpsertUser,
  type Creator,
  type InsertCreator,
  type Post,
  type InsertPost,
  type Subscription,
  type SubscriptionTier,
  type InsertSubscriptionTier,
  type LiveStream,
  type InsertLiveStream,
  type Message,
  type InsertMessage,
  type Like,
  type Comment,
  type InsertComment,
  type ForumThread,
  type InsertForumThread,
  type ForumReply,
  type InsertForumReply,
  type ForumCategory,
  type Analytics,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User>;
  
  // Creator operations
  getCreator(id: string): Promise<Creator | undefined>;
  getCreatorByUserId(userId: string): Promise<Creator | undefined>;
  getCreatorByUsername(username: string): Promise<Creator | undefined>;
  createCreator(creator: InsertCreator): Promise<Creator>;
  updateCreator(id: string, updates: Partial<InsertCreator>): Promise<Creator>;
  getTrendingCreators(limit: number): Promise<Creator[]>;
  
  // Post operations
  getPost(id: string): Promise<Post | undefined>;
  getPostsByCreator(creatorId: string, limit: number, offset: number): Promise<Post[]>;
  getFeedPosts(limit: number, offset: number): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, updates: Partial<InsertPost>): Promise<Post>;
  deletePost(id: string): Promise<void>;
  incrementPostViews(id: string): Promise<void>;
  
  // Subscription operations
  getSubscription(userId: string, creatorId: string): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  getUserSubscriptions(userId: string): Promise<Subscription[]>;
  getCreatorSubscriptions(creatorId: string): Promise<Subscription[]>;
  createSubscription(subscription: Omit<Subscription, "id" | "createdAt" | "updatedAt">): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription>;
  updateSubscriptionStatus(id: string, status: string, periodStart: Date, periodEnd: Date): Promise<void>;
  
  // Subscription tier operations
  getSubscriptionTier(id: string): Promise<SubscriptionTier | undefined>;
  getCreatorSubscriptionTiers(creatorId: string): Promise<SubscriptionTier[]>;
  createSubscriptionTier(tier: InsertSubscriptionTier): Promise<SubscriptionTier>;
  
  // Like operations
  getLike(userId: string, postId: string): Promise<Like | undefined>;
  createLike(userId: string, postId: string): Promise<Like>;
  deleteLike(userId: string, postId: string): Promise<void>;
  
  // Comment operations
  getCommentsByPost(postId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Live stream operations
  getLiveStream(id: string): Promise<LiveStream | undefined>;
  getActiveLiveStreams(): Promise<LiveStream[]>;
  getCreatorLiveStreams(creatorId: string): Promise<LiveStream[]>;
  createLiveStream(stream: InsertLiveStream): Promise<LiveStream>;
  updateLiveStream(id: string, updates: Partial<InsertLiveStream>): Promise<LiveStream>;
  
  // Message operations
  getConversation(userId1: string, userId2: string, limit: number): Promise<Message[]>;
  getUserConversations(userId: string): Promise<Array<{ user: User; lastMessage: Message }>>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<void>;
  
  // Forum operations
  getForumCategories(): Promise<ForumCategory[]>;
  getForumThreads(categoryId: string, limit: number, offset: number): Promise<ForumThread[]>;
  getForumThread(id: string): Promise<ForumThread | undefined>;
  createForumThread(thread: InsertForumThread): Promise<ForumThread>;
  getForumReplies(threadId: string): Promise<ForumReply[]>;
  createForumReply(reply: InsertForumReply): Promise<ForumReply>;
  
  // Analytics operations
  getCreatorAnalytics(creatorId: string, days: number): Promise<Analytics[]>;
  updateAnalytics(creatorId: string, date: Date, updates: Partial<Analytics>): Promise<void>;
  
  // Aggregation operations
  getCreatorStats(creatorId: string): Promise<{
    totalViews: number;
    totalLikes: number;
    totalRevenue: number;
    activeSubscribers: number;
    totalPosts: number;
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

  async updateUserStripeInfo(userId: string, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: stripeInfo.customerId,
        stripeSubscriptionId: stripeInfo.subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Creator operations
  async getCreator(id: string): Promise<Creator | undefined> {
    const [creator] = await db.select().from(creators).where(eq(creators.id, id));
    return creator;
  }

  async getCreatorByUserId(userId: string): Promise<Creator | undefined> {
    const [creator] = await db.select().from(creators).where(eq(creators.userId, userId));
    return creator;
  }

  async getCreatorByUsername(username: string): Promise<Creator | undefined> {
    const [creator] = await db.select().from(creators).where(eq(creators.username, username));
    return creator;
  }

  async createCreator(creatorData: InsertCreator): Promise<Creator> {
    const [creator] = await db.insert(creators).values(creatorData).returning();
    return creator;
  }

  async updateCreator(id: string, updates: Partial<InsertCreator>): Promise<Creator> {
    const [creator] = await db
      .update(creators)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(creators.id, id))
      .returning();
    return creator;
  }

  async getTrendingCreators(limit: number): Promise<Creator[]> {
    return db
      .select()
      .from(creators)
      .orderBy(desc(creators.followerCount))
      .limit(limit);
  }

  // Post operations
  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async getPostsByCreator(creatorId: string, limit: number, offset: number): Promise<Post[]> {
    return db
      .select()
      .from(posts)
      .where(eq(posts.creatorId, creatorId))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getFeedPosts(limit: number, offset: number): Promise<Post[]> {
    return db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(postData).returning();
    return post;
  }

  async updatePost(id: string, updates: Partial<InsertPost>): Promise<Post> {
    const [post] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async incrementPostViews(id: string): Promise<void> {
    await db
      .update(posts)
      .set({ viewCount: sql`${posts.viewCount} + 1` })
      .where(eq(posts.id, id));
  }

  // Subscription operations
  async getSubscription(userId: string, creatorId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.creatorId, creatorId)));
    return subscription;
  }

  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  }

  async getCreatorSubscriptions(creatorId: string): Promise<Subscription[]> {
    return db.select().from(subscriptions).where(eq(subscriptions.creatorId, creatorId));
  }

  async createSubscription(subscriptionData: Omit<Subscription, "id" | "createdAt" | "updatedAt">): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values(subscriptionData).returning();
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
    
    return subscription;
  }

  async updateSubscriptionStatus(id: string, status: string, periodStart: Date, periodEnd: Date): Promise<void> {
    await db
      .update(subscriptions)
      .set({
        status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id));
  }

  // Subscription tier operations
  async getSubscriptionTier(id: string): Promise<SubscriptionTier | undefined> {
    const [tier] = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.id, id));
    return tier;
  }

  async getCreatorSubscriptionTiers(creatorId: string): Promise<SubscriptionTier[]> {
    return db.select().from(subscriptionTiers).where(eq(subscriptionTiers.creatorId, creatorId));
  }

  async createSubscriptionTier(tierData: InsertSubscriptionTier): Promise<SubscriptionTier> {
    const [tier] = await db.insert(subscriptionTiers).values(tierData).returning();
    return tier;
  }

  // Like operations
  async getLike(userId: string, postId: string): Promise<Like | undefined> {
    const [like] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    return like;
  }

  async createLike(userId: string, postId: string): Promise<Like> {
    const [like] = await db.insert(likes).values({ userId, postId }).returning();
    
    // Increment like count on post
    await db
      .update(posts)
      .set({ likeCount: sql`${posts.likeCount} + 1` })
      .where(eq(posts.id, postId));
    
    return like;
  }

  async deleteLike(userId: string, postId: string): Promise<void> {
    await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    
    // Decrement like count on post
    await db
      .update(posts)
      .set({ likeCount: sql`${posts.likeCount} - 1` })
      .where(eq(posts.id, postId));
  }

  // Comment operations
  async getCommentsByPost(postId: string): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.postId, postId)).orderBy(desc(comments.createdAt));
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(commentData).returning();
    
    // Increment comment count on post
    await db
      .update(posts)
      .set({ commentCount: sql`${posts.commentCount} + 1` })
      .where(eq(posts.id, commentData.postId));
    
    return comment;
  }

  // Live stream operations
  async getLiveStream(id: string): Promise<LiveStream | undefined> {
    const [stream] = await db.select().from(liveStreams).where(eq(liveStreams.id, id));
    return stream;
  }

  async getActiveLiveStreams(): Promise<LiveStream[]> {
    return db.select().from(liveStreams).where(eq(liveStreams.status, "live")).orderBy(desc(liveStreams.viewerCount));
  }

  async getCreatorLiveStreams(creatorId: string): Promise<LiveStream[]> {
    return db.select().from(liveStreams).where(eq(liveStreams.creatorId, creatorId)).orderBy(desc(liveStreams.createdAt));
  }

  async createLiveStream(streamData: InsertLiveStream): Promise<LiveStream> {
    const [stream] = await db.insert(liveStreams).values(streamData).returning();
    return stream;
  }

  async updateLiveStream(id: string, updates: Partial<InsertLiveStream>): Promise<LiveStream> {
    const [stream] = await db
      .update(liveStreams)
      .set(updates)
      .where(eq(liveStreams.id, id))
      .returning();
    return stream;
  }

  // Message operations
  async getConversation(userId1: string, userId2: string, limit: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async getUserConversations(userId: string): Promise<Array<{ user: User; lastMessage: Message }>> {
    // Get unique conversation partners with their last messages
    const conversations = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    const conversationMap = new Map<string, Message>();
    
    for (const message of conversations) {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, message);
      }
    }

    const result = [];
    for (const [partnerId, lastMessage] of conversationMap) {
      const user = await this.getUser(partnerId);
      if (user) {
        result.push({ user, lastMessage });
      }
    }

    return result;
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
  }

  // Forum operations
  async getForumCategories(): Promise<ForumCategory[]> {
    return db.select().from(forumCategories);
  }

  async getForumThreads(categoryId: string, limit: number, offset: number): Promise<ForumThread[]> {
    return db
      .select()
      .from(forumThreads)
      .where(eq(forumThreads.categoryId, categoryId))
      .orderBy(desc(forumThreads.isPinned), desc(forumThreads.updatedAt))
      .limit(limit)
      .offset(offset);
  }

  async getForumThread(id: string): Promise<ForumThread | undefined> {
    const [thread] = await db.select().from(forumThreads).where(eq(forumThreads.id, id));
    
    // Increment view count
    if (thread) {
      await db
        .update(forumThreads)
        .set({ viewCount: sql`${forumThreads.viewCount} + 1` })
        .where(eq(forumThreads.id, id));
    }
    
    return thread;
  }

  async createForumThread(threadData: InsertForumThread): Promise<ForumThread> {
    const [thread] = await db.insert(forumThreads).values(threadData).returning();
    return thread;
  }

  async getForumReplies(threadId: string): Promise<ForumReply[]> {
    return db.select().from(forumReplies).where(eq(forumReplies.threadId, threadId)).orderBy(forumReplies.createdAt);
  }

  async createForumReply(replyData: InsertForumReply): Promise<ForumReply> {
    const [reply] = await db.insert(forumReplies).values(replyData).returning();
    
    // Increment reply count on thread
    await db
      .update(forumThreads)
      .set({
        replyCount: sql`${forumThreads.replyCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(forumThreads.id, replyData.threadId));
    
    return reply;
  }

  // Analytics operations
  async getCreatorAnalytics(creatorId: string, days: number): Promise<Analytics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return db
      .select()
      .from(analytics)
      .where(and(eq(analytics.creatorId, creatorId), sql`${analytics.date} >= ${startDate}`))
      .orderBy(analytics.date);
  }

  async updateAnalytics(creatorId: string, date: Date, updates: Partial<Analytics>): Promise<void> {
    await db
      .insert(analytics)
      .values({ creatorId, date, ...updates })
      .onConflictDoUpdate({
        target: [analytics.creatorId, analytics.date],
        set: updates,
      });
  }

  // Aggregation operations
  async getCreatorStats(creatorId: string): Promise<{
    totalViews: number;
    totalLikes: number;
    totalRevenue: number;
    activeSubscribers: number;
    totalPosts: number;
  }> {
    const [postStats] = await db
      .select({
        totalViews: sql<number>`COALESCE(SUM(${posts.viewCount}), 0)`,
        totalLikes: sql<number>`COALESCE(SUM(${posts.likeCount}), 0)`,
        totalPosts: sql<number>`COUNT(*)`,
      })
      .from(posts)
      .where(eq(posts.creatorId, creatorId));

    const activeSubscriptions = await db
      .select({
        subscription: subscriptions,
        tier: subscriptionTiers,
      })
      .from(subscriptions)
      .leftJoin(subscriptionTiers, eq(subscriptions.tierId, subscriptionTiers.id))
      .where(and(
        eq(subscriptions.creatorId, creatorId),
        eq(subscriptions.status, 'active')
      ));

    const totalRevenue = activeSubscriptions.reduce((sum, { tier }) => {
      if (tier?.priceMonthly) {
        return sum + parseFloat(tier.priceMonthly);
      }
      return sum;
    }, 0);

    return {
      totalViews: postStats?.totalViews || 0,
      totalLikes: postStats?.totalLikes || 0,
      totalRevenue,
      activeSubscribers: activeSubscriptions.length,
      totalPosts: postStats?.totalPosts || 0,
    };
  }
}

export const storage = new DatabaseStorage();
