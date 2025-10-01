import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import NavigationHeader from "@/components/NavigationHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, MessageSquare, Eye, TrendingUp } from "lucide-react";

export default function Community() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadContent, setThreadContent] = useState("");

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

  const { data: categories } = useQuery({
    queryKey: ["/api/forum/categories"],
    retry: false,
  });

  const { data: threads } = useQuery({
    queryKey: [`/api/forum/categories/${selectedCategory}/threads`],
    enabled: !!selectedCategory,
    retry: false,
  });

  const createThreadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/forum/threads", {
        categoryId: selectedCategory,
        title: threadTitle,
        content: threadContent,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Thread created successfully!",
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/forum/categories/${selectedCategory}/threads`] 
      });
      setNewThreadOpen(false);
      setThreadTitle("");
      setThreadContent("");
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
        description: "Failed to create thread",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 xl:pb-0">
      <NavigationHeader />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Community Forums</h1>
              <p className="text-muted-foreground">
                Connect with other creators and fans
              </p>
            </div>
            
            <Dialog open={newThreadOpen} onOpenChange={setNewThreadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-secondary">
                  <Plus className="w-5 h-5 mr-2" />
                  New Thread
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Thread</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Thread title..."
                      value={threadTitle}
                      onChange={(e) => setThreadTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="What's on your mind?"
                      rows={6}
                      value={threadContent}
                      onChange={(e) => setThreadContent(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => createThreadMutation.mutate()}
                    disabled={!threadTitle || !threadContent || createThreadMutation.isPending}
                    className="w-full bg-gradient-to-r from-primary to-secondary"
                  >
                    {createThreadMutation.isPending ? "Creating..." : "Create Thread"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {categories?.map((category: any) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors ${
                          selectedCategory === category.id
                            ? "bg-primary/10 text-primary font-medium border-l-4 border-primary"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {category.icon && <span className="text-2xl">{category.icon}</span>}
                          <div>
                            <p className="font-medium">{category.name}</p>
                            {category.description && (
                              <p className="text-xs text-muted-foreground">{category.description}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Threads List */}
            <div className="lg:col-span-3">
              <div className="space-y-4">
                {threads?.map((thread: any) => (
                  <Card key={thread.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={thread.user?.profileImageUrl || ""} />
                          <AvatarFallback>
                            {thread.user?.firstName?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-bold text-lg mb-1">{thread.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                by {thread.user?.firstName || "User"} • {new Date(thread.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {thread.isPinned && (
                              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                                Pinned
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-foreground line-clamp-2 mb-4">
                            {thread.content}
                          </p>
                          
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              <span>{thread.replyCount} replies</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              <span>{thread.viewCount} views</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {threads && threads.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No threads in this category yet
                      </p>
                      <Button
                        onClick={() => setNewThreadOpen(true)}
                        className="bg-gradient-to-r from-primary to-secondary"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Start a Discussion
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
