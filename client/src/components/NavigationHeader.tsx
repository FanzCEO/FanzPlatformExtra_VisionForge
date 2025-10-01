import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, MessageCircle, Video, Users, Home, Plus, Search } from "lucide-react";

export default function NavigationHeader() {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/">
              <a className="flex items-center gap-2" data-testid="link-home">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-xl font-bold">F</span>
                </div>
                <span className="text-2xl font-bold gradient-text hidden sm:block">FUN</span>
              </a>
            </Link>

            {/* Desktop Navigation */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/">
                  <a className="text-foreground font-medium hover:text-primary transition-colors flex items-center gap-2" data-testid="link-feed">
                    <Home className="w-5 h-5" />
                    Feed
                  </a>
                </Link>
                <Link href="/live">
                  <a className="text-muted-foreground font-medium hover:text-primary transition-colors flex items-center gap-2" data-testid="link-live">
                    <Video className="w-5 h-5" />
                    Live
                  </a>
                </Link>
                <Link href="/community">
                  <a className="text-muted-foreground font-medium hover:text-primary transition-colors flex items-center gap-2" data-testid="link-community">
                    <Users className="w-5 h-5" />
                    Community
                  </a>
                </Link>
              </nav>
            )}
          </div>

          {/* Search Bar */}
          {isAuthenticated && (
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="Search creators, content..."
                  className="w-full bg-card border-border pl-10"
                  data-testid="input-search"
                />
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-primary to-secondary" data-testid="button-create">
                  <Plus className="w-5 h-5" />
                  <span>Create</span>
                </Button>
                <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-notifications">
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full"></span>
                </button>
                <Link href="/messages">
                  <a className="relative p-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="link-messages">
                    <MessageCircle className="w-6 h-6" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full"></span>
                  </a>
                </Link>
                <Link href={user?.creator ? `/profile/${user.creator.username}` : "/dashboard"}>
                  <a data-testid="link-profile">
                    <Avatar className="w-10 h-10 border-2 border-primary cursor-pointer">
                      <AvatarImage src={user?.profileImageUrl || ""} />
                      <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                  </a>
                </Link>
              </>
            ) : (
              <Button onClick={() => window.location.href = "/api/login"} data-testid="button-signin">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
