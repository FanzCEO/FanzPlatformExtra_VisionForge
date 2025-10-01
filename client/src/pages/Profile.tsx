import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import NavigationHeader from "@/components/NavigationHeader";
import FeedCard from "@/components/FeedCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, MoreHorizontal, CheckCircle, Camera } from "lucide-react";

export default function Profile() {
  const { username } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

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

  const { data: creator, isLoading: creatorLoading } = useQuery({
    queryKey: [`/api/creators/${username}`],
    enabled: !!username,
    retry: false,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: [`/api/creators/${username}/posts`],
    enabled: !!username,
    retry: false,
  });

  if (authLoading || creatorLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="pt-16 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Creator Not Found</h1>
            <p className="text-muted-foreground">The creator you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.creator?.id === creator.id;

  return (
    <div className="min-h-screen bg-background pb-20 xl:pb-0">
      <NavigationHeader />
      
      <main className="pt-16">
        {/* Profile Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
            {/* Cover Image */}
            <div className="relative h-48 sm:h-64 bg-gradient-to-br from-primary/20 to-secondary/20">
              {creator.coverImageUrl && (
                <img 
                  src={creator.coverImageUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              )}
              {isOwnProfile && (
                <button className="absolute top-4 right-4 px-3 py-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Change Cover
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="relative px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 sm:-mt-20">
                <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
                  {/* Profile Picture */}
                  <div className="relative">
                    <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-background">
                      <AvatarImage src={creator.user?.profileImageUrl || ""} />
                      <AvatarFallback className="text-4xl">
                        {creator.displayName?.[0] || "C"}
                      </AvatarFallback>
                    </Avatar>
                    {isOwnProfile && (
                      <button className="absolute bottom-2 right-2 w-10 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center transition-colors">
                        <Camera className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Name & Stats */}
                  <div className="pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl sm:text-3xl font-bold">{creator.displayName}</h1>
                      {creator.isVerified && (
                        <CheckCircle className="w-6 h-6 text-primary" />
                      )}
                      {creator.isVip && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                          VIP Creator
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3">@{creator.username}</p>
                    
                    {/* Stats Row */}
                    <div className="flex items-center space-x-6 text-sm">
                      <div>
                        <span className="font-bold text-lg">{creator.postCount}</span>
                        <span className="text-muted-foreground ml-1">Posts</span>
                      </div>
                      <div>
                        <span className="font-bold text-lg">{creator.followerCount}</span>
                        <span className="text-muted-foreground ml-1">Followers</span>
                      </div>
                      <div>
                        <span className="font-bold text-lg">{creator.followingCount}</span>
                        <span className="text-muted-foreground ml-1">Following</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                  {!isOwnProfile && (
                    <>
                      <Button className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-secondary">
                        Subscribe $9.99/mo
                      </Button>
                      <Button variant="outline" className="px-4 py-2.5">
                        <MessageCircle className="w-5 h-5" />
                      </Button>
                    </>
                  )}
                  <Button variant="outline" className="px-4 py-2.5">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Bio */}
              {creator.bio && (
                <div className="mt-6">
                  <p className="text-sm whitespace-pre-wrap">{creator.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
            <div className="border-b border-border">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button className="border-b-2 border-primary text-primary py-4 px-1 text-sm font-medium flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Posts
                </button>
                <button className="border-b-2 border-transparent text-muted-foreground hover:text-foreground py-4 px-1 text-sm font-medium transition-colors flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Videos
                </button>
                <button className="border-b-2 border-transparent text-muted-foreground hover:text-foreground py-4 px-1 text-sm font-medium transition-colors flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Premium
                  <span className="ml-2 px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs font-semibold">
                    {posts?.filter((p: any) => p.visibility !== "free").length || 0}
                  </span>
                </button>
              </nav>
            </div>
          </div>

          {/* Content Grid */}
          <div className="space-y-6">
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : posts && posts.length > 0 ? (
              posts.map((post: any) => (
                <FeedCard key={post.id} post={post} creator={creator} />
              ))
            ) : (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
