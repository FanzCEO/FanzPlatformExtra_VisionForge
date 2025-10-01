import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import NavigationHeader from "@/components/NavigationHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";

export default function Messages() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

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

  const { data: conversations } = useQuery({
    queryKey: ["/api/messages/conversations"],
    retry: false,
  });

  const { data: messages } = useQuery({
    queryKey: [`/api/messages/${selectedConversation}`],
    enabled: !!selectedConversation,
    retry: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/messages", {
        receiverId: selectedConversation,
        content: messageText,
      });
      return await res.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ 
        queryKey: [`/api/messages/${selectedConversation}`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/messages/conversations"] 
      });
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
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

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
      
      <main className="pt-16 h-screen flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-border bg-card overflow-y-auto">
            <div className="p-4 border-b border-border">
              <h2 className="font-bold text-xl">Messages</h2>
            </div>
            
            <div className="divide-y divide-border">
              {conversations?.map((conv: any) => (
                <button
                  key={conv.user.id}
                  onClick={() => setSelectedConversation(conv.user.id)}
                  className={`w-full p-4 hover:bg-secondary/50 transition-colors text-left ${
                    selectedConversation === conv.user.id ? "bg-secondary/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conv.user.profileImageUrl || ""} />
                      <AvatarFallback>
                        {conv.user.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold truncate">
                          {conv.user.firstName} {conv.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage.content}
                      </p>
                    </div>
                    {!conv.lastMessage.isRead && conv.lastMessage.receiverId === user?.id && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              ))}

              {(!conversations || conversations.length === 0) && (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No conversations yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages?.map((message: any) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === user?.id ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-md px-4 py-2 rounded-2xl ${
                          message.senderId === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderId === user?.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}>
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {messages && messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t border-border p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !sendMessageMutation.isPending) {
                          sendMessageMutation.mutate();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => sendMessageMutation.mutate()}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      size="icon"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Card className="max-w-md">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">Your Messages</h3>
                    <p className="text-muted-foreground">
                      Select a conversation to start messaging
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
