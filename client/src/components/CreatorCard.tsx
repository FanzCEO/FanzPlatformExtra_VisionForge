import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface CreatorCardProps {
  creator: any;
}

export default function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-lg hover:bg-muted/20 transition-colors cursor-pointer" data-testid={`card-creator-${creator.id}`}>
      <Link href={`/profile/${creator.username}`}>
        <a data-testid={`link-creator-${creator.id}`}>
          <Avatar className="w-12 h-12 border-2 border-primary">
            <AvatarImage src={creator.user?.profileImageUrl || ""} />
            <AvatarFallback>{creator.displayName?.[0] || "C"}</AvatarFallback>
          </Avatar>
        </a>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${creator.username}`}>
          <a className="flex items-center gap-2" data-testid={`link-creator-name-${creator.id}`}>
            <p className="font-semibold text-sm truncate" data-testid="text-creator-name">{creator.displayName}</p>
            {creator.isVerified && (
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
            )}
          </a>
        </Link>
        <p className="text-xs text-muted-foreground truncate" data-testid="text-follower-count">
          {creator.followerCount} followers
        </p>
      </div>
      <Button size="sm" className="bg-primary/20 text-primary hover:bg-primary hover:text-white" data-testid="button-follow">
        Follow
      </Button>
    </div>
  );
}
