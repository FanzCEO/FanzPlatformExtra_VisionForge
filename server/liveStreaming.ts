import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface StreamClient {
  ws: WebSocket;
  userId: string;
  streamId: string;
  isCreator: boolean;
}

export class LiveStreamingService {
  private clients: Map<string, StreamClient> = new Map();
  private streams: Map<string, Set<string>> = new Map(); // streamId -> Set of client IDs

  setupWebSocket(server: Server) {
    const wss = new WebSocketServer({ server, path: "/ws" });

    wss.on("connection", (ws: WebSocket, req) => {
      const clientId = this.generateClientId();
      
      ws.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, ws, message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        this.handleDisconnect(clientId);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleMessage(clientId: string, ws: WebSocket, message: any) {
    const { type, payload } = message;

    switch (type) {
      case "join_stream":
        this.handleJoinStream(clientId, ws, payload);
        break;
      case "leave_stream":
        this.handleLeaveStream(clientId);
        break;
      case "chat_message":
        this.handleChatMessage(clientId, payload);
        break;
      case "stream_like":
        this.handleStreamLike(clientId, payload);
        break;
      case "viewer_count":
        this.sendViewerCount(payload.streamId);
        break;
      default:
        console.log("Unknown message type:", type);
    }
  }

  private handleJoinStream(clientId: string, ws: WebSocket, payload: any) {
    const { userId, streamId, isCreator } = payload;

    const client: StreamClient = {
      ws,
      userId,
      streamId,
      isCreator: isCreator || false,
    };

    this.clients.set(clientId, client);

    if (!this.streams.has(streamId)) {
      this.streams.set(streamId, new Set());
    }
    this.streams.get(streamId)!.add(clientId);

    // Send confirmation to the client
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "joined",
        payload: { streamId, clientId },
      }));
    }

    // Broadcast viewer count update
    this.sendViewerCount(streamId);

    // Notify other viewers that someone joined
    this.broadcastToStream(streamId, {
      type: "viewer_joined",
      payload: { userId, viewerCount: this.streams.get(streamId)!.size },
    }, clientId);
  }

  private handleLeaveStream(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { streamId } = client;
    
    this.clients.delete(clientId);
    
    if (this.streams.has(streamId)) {
      this.streams.get(streamId)!.delete(clientId);
      
      if (this.streams.get(streamId)!.size === 0) {
        this.streams.delete(streamId);
      } else {
        this.sendViewerCount(streamId);
      }
    }
  }

  private handleDisconnect(clientId: string) {
    this.handleLeaveStream(clientId);
  }

  private handleChatMessage(clientId: string, payload: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { streamId, userId } = client;
    const { message } = payload;

    this.broadcastToStream(streamId, {
      type: "chat_message",
      payload: {
        userId,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  private handleStreamLike(clientId: string, payload: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { streamId, userId } = client;

    this.broadcastToStream(streamId, {
      type: "stream_like",
      payload: {
        userId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  private sendViewerCount(streamId: string) {
    const viewerCount = this.streams.get(streamId)?.size || 0;
    
    this.broadcastToStream(streamId, {
      type: "viewer_count",
      payload: { viewerCount },
    });
  }

  private broadcastToStream(streamId: string, message: any, excludeClientId?: string) {
    const streamClients = this.streams.get(streamId);
    if (!streamClients) return;

    const messageStr = JSON.stringify(message);

    for (const clientId of streamClients) {
      if (clientId === excludeClientId) continue;
      
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    }
  }

  getStreamViewerCount(streamId: string): number {
    return this.streams.get(streamId)?.size || 0;
  }
}

export const liveStreamingService = new LiveStreamingService();
