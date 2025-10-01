import { useState } from "react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Crown, Play } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface FeedCardProps {
  post: any;
  creator: any;
}

export default function FeedCard({ post, creator }: FeedCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${post.id}/like`);
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive",
      });
    },
  });

  const isPremium = post.visibility !== "free";

  return (
    <article className="bg-card rounded-2xl overflow-hidden border border-border content-card" data-testid={`card-post-${post.id}`}>
      {/* Creator Header */}
      <div className="p-4 flex items-center justify-between">
        <Link href={`/profile/${creator.username}`}>
          <a className="flex items-center gap-3" data-testid={`link-creator-${creator.id}`}>
            <Avatar className="w-12 h-12 border-2 border-primary">
              <AvatarImage src={creator.user?.profileImageUrl || ""} />
              <AvatarFallback>{creator.displayName?.[0] || "C"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold">{creator.displayName}</p>
                {creator.isVerified && (
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {isPremium && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-primary to-secondary">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          </a>
        </Link>
        <button className="p-2 hover:bg-muted/20 rounded-lg transition-colors" data-testid="button-post-options">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20">
        {post.thumbnailUrl ? (
          <img 
            src={post.thumbnailUrl} 
            alt="Content" 
            className="w-full h-full object-cover"
            data-testid={`img-post-${post.id}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        {post.contentType === "video" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors" data-testid="button-play-video">
              <Play className="w-8 h-8 text-white ml-1" />
            </button>
          </div>
        )}
        {post.duration && (
          <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md text-sm font-medium" data-testid="text-duration">
            {Math.floor(post.duration / 60)}:{(post.duration % 60).toString().padStart(2, "0")}
          </div>
        )}
      </div>

      {/* Post Description */}
      <div className="p-4">
        {post.caption && (
          <p className="text-foreground mb-3" data-testid="text-caption">{post.caption}</p>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center gap-6 mb-4">
          <button 
            onClick={() => likeMutation.mutate()}
            className={`flex items-center gap-2 transition-colors ${
              isLiked ? "text-secondary" : "text-muted-foreground hover:text-secondary"
            }`}
            data-testid="button-like"
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            <span data-testid="text-likes">{post.likeCount}</span>
          </button>
          <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors" data-testid="button-comment">
            <MessageCircle className="w-5 h-5" />
            <span data-testid="text-comments">{post.commentCount}</span>
          </button>
          <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors" data-testid="button-share">
            <Share2 className="w-5 h-5" />
            <span data-testid="text-shares">{post.shareCount}</span>
          </button>
          <button className="ml-auto flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors" data-testid="button-bookmark">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>

        {/* Premium CTA */}
        {isPremium && (
          <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold mb-1">Unlock Full Access</p>
                <p className="text-sm text-muted-foreground">Get exclusive content</p>
              </div>
              <Link href={`/subscribe/${creator.id}`}>
                <Button className="bg-gradient-to-r from-primary to-secondary" data-testid="button-subscribe">
                  Subscribe
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
