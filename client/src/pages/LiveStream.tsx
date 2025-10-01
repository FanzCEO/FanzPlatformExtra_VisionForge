import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import NavigationHeader from "@/components/NavigationHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Send, Users, X } from "lucide-react";

interface ChatMessage {
  userId: string;
  message: string;
  timestamp: string;
}

export default function LiveStream() {
  const [searchParams] = useSearchParams();
  const streamId = searchParams.get("stream");
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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

  const { data: stream, isLoading: streamLoading } = useQuery({
    queryKey: [`/api/live-streams/${streamId}`],
    queryFn: async () => {
      const res = await fetch(`/api/live-streams/${streamId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch stream");
      return res.json();
    },
    enabled: !!streamId,
    retry: false,
  });

  // WebSocket connection for live chat
  useEffect(() => {
    if (!streamId || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Join the stream
      ws.send(JSON.stringify({
        type: "join_stream",
        payload: {
          userId: user.id,
          streamId,
          isCreator: user.creator?.id === stream?.creatorId,
        },
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case "chat_message":
          setMessages((prev) => [...prev, data.payload]);
          break;
        case "viewer_count":
          setViewerCount(data.payload.viewerCount);
          break;
        case "stream_like":
          setLikes((prev) => prev + 1);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to live stream",
        variant: "destructive",
      });
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "leave_stream",
          payload: { streamId },
        }));
      }
      ws.close();
    };
  }, [streamId, user, stream]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !wsRef.current) return;

    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "chat_message",
        payload: { message: chatMessage },
      }));
      setChatMessage("");
    }
  };

  const handleLike = () => {
    if (!wsRef.current) return;

    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "stream_like",
        payload: {},
      }));
    }
  };

  if (authLoading || streamLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="pt-16 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Stream Not Found</h1>
            <p className="text-muted-foreground">The live stream you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <main className="pt-16 h-screen flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Video Section */}
          <div className="flex-1 bg-black flex flex-col">
            {/* Video Player */}
            <div className="flex-1 relative bg-gradient-to-br from-destructive/20 to-primary/20 flex items-center justify-center">
              {stream.thumbnailUrl ? (
                <img 
                  src={stream.thumbnailUrl} 
                  alt="Stream" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-20 h-20 bg-destructive rounded-full live-pulse" />
                  </div>
                  <p className="text-white text-xl font-semibold">Live Stream Active</p>
                </div>
              )}
              
              {/* Stream Info Overlay */}
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-destructive rounded-full text-white text-sm font-bold flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full live-pulse"></span>
                    LIVE
                  </div>
                  <div className="px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {viewerCount}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/60 backdrop-blur-sm hover:bg-black/80"
                  onClick={() => window.history.back()}
                >
                  <X className="w-5 h-5 text-white" />
                </Button>
              </div>

              {/* Like Button */}
              <div className="absolute bottom-4 right-4">
                <Button
                  size="lg"
                  onClick={handleLike}
                  className="rounded-full w-16 h-16 bg-destructive/80 hover:bg-destructive backdrop-blur-sm"
                >
                  <Heart className="w-8 h-8" />
                </Button>
                <p className="text-center text-white text-sm font-semibold mt-2">{likes}</p>
              </div>
            </div>

            {/* Stream Info */}
            <div className="p-4 bg-card border-t border-border">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-destructive">
                  <AvatarImage src={stream.creator?.user?.profileImageUrl || ""} />
                  <AvatarFallback>{stream.creator?.displayName?.[0] || "C"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">{stream.title}</h2>
                  <p className="text-sm text-muted-foreground">{stream.creator?.displayName}</p>
                </div>
                <Button className="bg-gradient-to-r from-primary to-secondary">
                  Subscribe
                </Button>
              </div>
              {stream.description && (
                <p className="mt-3 text-sm text-muted-foreground">{stream.description}</p>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="w-full lg:w-96 bg-card border-l border-border flex flex-col h-[50vh] lg:h-auto">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Live Chat</h3>
            </div>

            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar"
            >
              {messages.map((msg, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {msg.userId.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold text-primary">User {msg.userId.slice(0, 6)}</span>
                      {": "}
                      <span className="text-foreground">{msg.message}</span>
                    </p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">
                  No messages yet. Be the first to say something!
                </p>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  size="icon"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
