import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, Heart, Play } from "lucide-react";

interface LiveStreamCardProps {
  stream: any;
  creator: any;
}

export default function LiveStreamCard({ stream, creator }: LiveStreamCardProps) {
  return (
    <article className="bg-card rounded-2xl overflow-hidden border border-destructive/50 content-card" data-testid={`card-stream-${stream.id}`}>
      <div className="p-4 flex items-center justify-between">
        <Link href={`/profile/${creator.username}`}>
          <a className="flex items-center gap-3" data-testid={`link-creator-${creator.id}`}>
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-destructive">
                <AvatarImage src={creator.user?.profileImageUrl || ""} />
                <AvatarFallback>{creator.displayName?.[0] || "C"}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 border-card live-pulse"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold">{creator.displayName}</p>
                <span className="px-2 py-0.5 bg-destructive text-white text-xs font-bold rounded uppercase">
                  Live
                </span>
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-viewer-count">
                {stream.viewerCount} watching
              </p>
            </div>
          </a>
        </Link>
      </div>

      <div className="relative aspect-video bg-gradient-to-br from-destructive/20 to-primary/20">
        {stream.thumbnailUrl ? (
          <img 
            src={stream.thumbnailUrl} 
            alt="Live Stream" 
            className="w-full h-full object-cover"
            data-testid="img-stream-thumbnail"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <Link href={`/live?stream=${stream.id}`}>
            <Button className="px-6 py-3 bg-destructive hover:bg-destructive/90 flex items-center gap-2" data-testid="button-join-stream">
              <Play className="w-5 h-5" />
              Join Stream
            </Button>
          </Link>
        </div>
        {/* Live Stats Overlay */}
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span data-testid="text-stream-viewers">{stream.viewerCount}</span>
          </div>
          <div className="px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-2">
            <Heart className="w-4 h-4 text-destructive" />
            <span data-testid="text-stream-likes">{stream.likeCount}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <p className="text-foreground mb-3" data-testid="text-stream-title">{stream.title}</p>
        <Link href={`/live?stream=${stream.id}`}>
          <Button className="w-full bg-gradient-to-r from-destructive to-secondary flex items-center justify-center gap-2" data-testid="button-watch-live">
            <Play className="w-5 h-5" />
            Watch Live
          </Button>
        </Link>
      </div>
    </article>
  );
}
