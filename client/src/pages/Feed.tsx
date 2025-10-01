import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import NavigationHeader from "@/components/NavigationHeader";
import FeedCard from "@/components/FeedCard";
import LiveStreamCard from "@/components/LiveStreamCard";
import CreatorCard from "@/components/CreatorCard";
import UploadModal from "@/components/UploadModal";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Users, DollarSign, Eye } from "lucide-react";

export default function Feed() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if unauthorized
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [authLoading, user, toast]);

  // Fetch posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts"],
    queryFn: async () => {
      const res = await fetch("/api/posts?limit=20&offset=0", {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("401: Unauthorized");
        }
        throw new Error("Failed to fetch posts");
      }
      return res.json();
    },
    retry: false,
  });

  // Fetch trending creators
  const { data: trendingCreators } = useQuery({
    queryKey: ["/api/creators/trending"],
    queryFn: async () => {
      const res = await fetch("/api/creators/trending", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch creators");
      return res.json();
    },
    retry: false,
  });

  // Fetch active live streams
  const { data: liveStreams } = useQuery({
    queryKey: ["/api/live-streams/active"],
    queryFn: async () => {
      const res = await fetch("/api/live-streams/active", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch live streams");
      return res.json();
    },
    retry: false,
  });

  // Fetch real-time stats for creators
  const { data: stats } = useQuery({
    queryKey: [`/api/stats/${user?.creator?.id}`],
    queryFn: async () => {
      const res = await fetch(`/api/stats/${user?.creator?.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!user?.creator?.id,
    retry: false,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      {/* Main Container */}
      <div className="pt-16 flex">
        
        {/* Left Sidebar - Desktop Only */}
        <aside className="hidden xl:block w-72 fixed left-0 top-16 bottom-0 border-r border-border p-6 overflow-y-auto hide-scrollbar">
          
          {/* Quick Stats */}
          {user?.creator && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Your Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-card rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Eye className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Views</p>
                      <p className="font-bold">{stats?.views || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-card rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Earnings</p>
                      <p className="font-bold">${stats?.earnings || '0.00'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-card rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Subscribers</p>
                      <p className="font-bold">{stats?.subscribers || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trending Creators */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Trending Now
            </h3>
            <div className="space-y-3">
              {trendingCreators?.map((creator: any) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 xl:ml-72 xl:mr-80">
          
          {/* Tab Navigation */}
          <div className="sticky top-16 z-40 glass-effect border-b border-border">
            <div className="max-w-4xl mx-auto px-4">
              <div className="flex gap-8 overflow-x-auto hide-scrollbar">
                <button className="py-4 px-1 font-semibold text-foreground border-b-2 border-primary whitespace-nowrap">
                  For You
                </button>
                <button className="py-4 px-1 font-semibold text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                  Following
                </button>
                <button className="py-4 px-1 font-semibold text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                  Premium
                </button>
                {liveStreams && liveStreams.length > 0 && (
                  <button className="py-4 px-1 font-semibold text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 bg-destructive rounded-full live-pulse"></span>
                      Live Now
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Feed Content */}
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            
            {/* Live Streams Section */}
            {liveStreams && liveStreams.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span className="w-3 h-3 bg-destructive rounded-full live-pulse"></span>
                  Live Now
                </h2>
                {liveStreams.map((stream: any) => (
                  <LiveStreamCard key={stream.id} stream={stream} creator={stream.creator} />
                ))}
              </div>
            )}

            {/* Posts Feed */}
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : posts && posts.length > 0 ? (
              posts.map((post: any) => (
                <FeedCard key={post.id} post={post} creator={post.creator} />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No posts to display</p>
                {user?.creator && (
                  <Button
                    onClick={() => setUploadModalOpen(true)}
                    className="bg-gradient-to-r from-primary to-secondary"
                    data-testid="button-create-first-post"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Post
                  </Button>
                )}
              </div>
            )}

            {/* Load More */}
            {posts && posts.length > 0 && (
              <div className="text-center py-8">
                <Button variant="outline" className="px-6 py-3" data-testid="button-load-more">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Load More Content
                </Button>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Desktop Only */}
        <aside className="hidden xl:block w-80 fixed right-0 top-16 bottom-0 border-l border-border p-6 overflow-y-auto hide-scrollbar">
          
          {/* Suggested Creators */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Suggested for You
              </h3>
              <button className="text-primary text-sm font-semibold hover:underline">
                See All
              </button>
            </div>
            <div className="space-y-3">
              {trendingCreators?.slice(0, 3).map((creator: any) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          </div>

          {/* Premium Upgrade CTA */}
          <div className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20">
            <div className="text-center">
              <svg className="w-12 h-12 text-accent mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              <h3 className="text-lg font-bold mb-2">Go VIP</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Access exclusive content from all your favorite creators
              </p>
              <Button className="w-full bg-gradient-to-r from-accent to-primary">
                Upgrade Now
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-6 bg-card rounded-lg p-4 border border-border">
            <h3 className="text-sm font-semibold mb-3">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                About FUN
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                Creator Resources
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                Help Center
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </a>
            </div>
            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
              © 2024 FUN Platform. All rights reserved.
            </div>
          </div>
        </aside>
      </div>

      {/* Upload Modal */}
      <UploadModal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />

      {/* Mobile Bottom Navigation */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-border">
        <div className="flex items-center justify-around py-3 px-4">
          <button className="flex flex-col items-center gap-1 text-primary" data-testid="button-nav-home">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
            </svg>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors" data-testid="button-nav-discover">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs font-medium">Discover</span>
          </button>
          <button 
            onClick={() => setUploadModalOpen(true)}
            className="flex flex-col items-center gap-1 -mt-8"
            data-testid="button-nav-create"
          >
            <div className="w-14 h-14 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
              <Plus className="w-8 h-8" />
            </div>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors relative" data-testid="button-nav-messages">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs font-medium">Messages</span>
            <span className="absolute top-0 right-2 w-2 h-2 bg-secondary rounded-full"></span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors" data-testid="button-nav-profile">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
