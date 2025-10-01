import { db } from "./db";
import {
  users,
  creators,
  posts,
  subscriptionTiers,
  forumCategories,
  liveStreams,
  analytics,
} from "@shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create sample users
    console.log("Creating sample users...");
    const sampleUsers = await db
      .insert(users)
      .values([
        {
          id: sql`gen_random_uuid()`,
          email: "creator1@fun.app",
          firstName: "Sophia",
          lastName: "Starlight",
          profileImageUrl: "https://i.pravatar.cc/150?img=1",
        },
        {
          id: sql`gen_random_uuid()`,
          email: "creator2@fun.app",
          firstName: "Jake",
          lastName: "Thunder",
          profileImageUrl: "https://i.pravatar.cc/150?img=2",
        },
        {
          id: sql`gen_random_uuid()`,
          email: "creator3@fun.app",
          firstName: "Luna",
          lastName: "Moon",
          profileImageUrl: "https://i.pravatar.cc/150?img=3",
        },
        {
          id: sql`gen_random_uuid()`,
          email: "fan1@fun.app",
          firstName: "Alex",
          lastName: "Fan",
          profileImageUrl: "https://i.pravatar.cc/150?img=4",
        },
      ])
      .returning();

    console.log(`✅ Created ${sampleUsers.length} users`);

    // Create creator profiles
    console.log("Creating creator profiles...");
    const sampleCreators = await db
      .insert(creators)
      .values([
        {
          userId: sampleUsers[0].id,
          username: "sophiastar",
          displayName: "Sophia Starlight ✨",
          bio: "Content creator & lifestyle influencer. Join my journey! 🌟 Premium content available for subscribers.",
          coverImageUrl: "https://picsum.photos/1200/400?random=1",
          isVerified: true,
          isVip: true,
          followerCount: 12500,
          postCount: 45,
        },
        {
          userId: sampleUsers[1].id,
          username: "jakethunder",
          displayName: "Jake Thunder ⚡",
          bio: "Fitness & wellness coach. Get exclusive workout plans and nutrition tips! 💪",
          coverImageUrl: "https://picsum.photos/1200/400?random=2",
          isVerified: true,
          followerCount: 8300,
          postCount: 32,
        },
        {
          userId: sampleUsers[2].id,
          username: "lunamoon",
          displayName: "Luna Moon 🌙",
          bio: "Artist & creative mind. Subscribe for behind-the-scenes content and exclusive art pieces! 🎨",
          coverImageUrl: "https://picsum.photos/1200/400?random=3",
          isVerified: false,
          followerCount: 5200,
          postCount: 28,
        },
      ])
      .returning();

    console.log(`✅ Created ${sampleCreators.length} creators`);

    // Create subscription tiers
    console.log("Creating subscription tiers...");
    const tiers = [];
    for (const creator of sampleCreators) {
      const creatorTiers = await db
        .insert(subscriptionTiers)
        .values([
          {
            creatorId: creator.id,
            tier: "basic",
            name: "Basic Fan",
            description: "Get access to exclusive posts and updates",
            priceMonthly: "9.99",
            features: ["Exclusive posts", "Direct messages", "Early access to content"],
          },
          {
            creatorId: creator.id,
            tier: "premium",
            name: "Premium Supporter",
            description: "Unlock premium content and perks",
            priceMonthly: "19.99",
            features: [
              "All Basic features",
              "Premium content library",
              "Monthly live sessions",
              "Custom emojis",
            ],
          },
          {
            creatorId: creator.id,
            tier: "vip",
            name: "VIP Member",
            description: "Ultimate access with exclusive benefits",
            priceMonthly: "49.99",
            features: [
              "All Premium features",
              "1-on-1 video calls",
              "Personalized content",
              "VIP Discord access",
              "Merchandise discounts",
            ],
          },
        ])
        .returning();
      tiers.push(...creatorTiers);
    }

    console.log(`✅ Created ${tiers.length} subscription tiers`);

    // Create sample posts
    console.log("Creating sample posts...");
    const postContents = [
      {
        caption: "Just dropped my new workout routine! 💪 Check it out and let me know what you think!",
        type: "video" as const,
        visibility: "free" as const,
      },
      {
        caption: "Behind the scenes of today's photoshoot ✨ Subscribe for more exclusive content!",
        type: "image" as const,
        visibility: "premium" as const,
      },
      {
        caption: "New art piece completed! This one took me weeks to perfect 🎨",
        type: "image" as const,
        visibility: "free" as const,
      },
      {
        caption: "VIP exclusive: Personal message and sneak peek of upcoming projects 🌟",
        type: "video" as const,
        visibility: "exclusive" as const,
      },
      {
        caption: "Morning motivation! Let's crush today's goals together 🔥",
        type: "image" as const,
        visibility: "free" as const,
      },
    ];

    const samplePosts = [];
    for (let i = 0; i < sampleCreators.length; i++) {
      for (let j = 0; j < 3; j++) {
        const content = postContents[(i * 3 + j) % postContents.length];
        const post = await db
          .insert(posts)
          .values({
            creatorId: sampleCreators[i].id,
            contentType: content.type,
            visibility: content.visibility,
            caption: content.caption,
            mediaUrls: [`https://picsum.photos/800/600?random=${i * 3 + j}`],
            thumbnailUrl: `https://picsum.photos/400/300?random=${i * 3 + j}`,
            likeCount: Math.floor(Math.random() * 500) + 50,
            commentCount: Math.floor(Math.random() * 50) + 5,
            viewCount: Math.floor(Math.random() * 5000) + 500,
            hasWatermark: content.visibility !== "free",
          })
          .returning();
        samplePosts.push(post[0]);
      }
    }

    console.log(`✅ Created ${samplePosts.length} posts`);

    // Create forum categories
    console.log("Creating forum categories...");
    const categories = await db
      .insert(forumCategories)
      .values([
        {
          name: "General Discussion",
          description: "Talk about anything and everything",
          icon: "💬",
        },
        {
          name: "Creator Support",
          description: "Get help and tips for creating content",
          icon: "🎬",
        },
        {
          name: "Fan Meetups",
          description: "Organize and discuss fan meetups",
          icon: "🤝",
        },
        {
          name: "Feature Requests",
          description: "Suggest new features for the platform",
          icon: "💡",
        },
      ])
      .returning();

    console.log(`✅ Created ${categories.length} forum categories`);

    // Create live streams
    console.log("Creating sample live streams...");
    const streams = await db
      .insert(liveStreams)
      .values([
        {
          creatorId: sampleCreators[0].id,
          title: "Q&A Session - Ask Me Anything! 🎤",
          description: "Join me for a live Q&A session! Bring your questions!",
          thumbnailUrl: "https://picsum.photos/800/450?random=100",
          status: "live",
          viewerCount: 234,
          likeCount: 89,
          startedAt: new Date(),
        },
        {
          creatorId: sampleCreators[1].id,
          title: "Live Workout Session 💪",
          description: "30-minute full body workout - follow along!",
          thumbnailUrl: "https://picsum.photos/800/450?random=101",
          status: "scheduled",
        },
      ])
      .returning();

    console.log(`✅ Created ${streams.length} live streams`);

    // Create analytics data
    console.log("Creating analytics data...");
    const analyticsData = [];
    for (const creator of sampleCreators) {
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const data = await db
          .insert(analytics)
          .values({
            creatorId: creator.id,
            date,
            views: Math.floor(Math.random() * 1000) + 200,
            likes: Math.floor(Math.random() * 100) + 20,
            comments: Math.floor(Math.random() * 50) + 5,
            newSubscribers: Math.floor(Math.random() * 10) + 1,
            revenue: (Math.random() * 500 + 100).toFixed(2),
            engagementRate: (Math.random() * 10 + 2).toFixed(2),
          })
          .returning();
        analyticsData.push(data[0]);
      }
    }

    console.log(`✅ Created ${analyticsData.length} analytics records`);

    console.log("\n🎉 Database seeded successfully!");
    console.log("\nSample accounts:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Creators:");
    console.log("  - sophiastar (Sophia Starlight) - Verified VIP");
    console.log("  - jakethunder (Jake Thunder) - Verified");
    console.log("  - lunamoon (Luna Moon)");
    console.log("\nFan:");
    console.log("  - Alex Fan");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
