import { Server as HTTPServer } from 'http';
import { WebSocket, WebSocketServer as WSServer } from 'ws';
import { Redis } from 'ioredis';

interface WebSocketClient extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export class WebSocketServer {
  private wss: WSServer;
  private redis: Redis;
  private heartbeatInterval: NodeJS.Timeout;

  constructor(server: HTTPServer, redisUrl: string) {
    this.wss = new WSServer({ server });
    this.redis = new Redis(redisUrl);
    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocketClient) => {
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          
          switch (data.type) {
            case 'auth':
              if (data.token) {
                const userId = await this.validateToken(data.token);
                if (userId) {
                  ws.userId = userId;
                  await this.subscribeToUserChannels(userId, ws);
                  ws.send(JSON.stringify({ type: 'auth_success' }));
                } else {
                  ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }));
                }
              }
              break;

            case 'subscribe':
              if (ws.userId && data.channel) {
                await this.redis.sadd(`channel:${data.channel}:users`, ws.userId);
                ws.send(JSON.stringify({ type: 'subscribed', channel: data.channel }));
              }
              break;

            case 'unsubscribe':
              if (ws.userId && data.channel) {
                await this.redis.srem(`channel:${data.channel}:users`, ws.userId);
                ws.send(JSON.stringify({ type: 'unsubscribed', channel: data.channel }));
              }
              break;

            default:
              // Handle custom message types
              if (ws.userId) {
                await this.handleCustomMessage(ws.userId, data);
              }
          }
        } catch (error) {
          console.error('WebSocket message handling error:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.handleDisconnect(ws.userId);
        }
      });
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocketClient) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(this.heartbeatInterval);
    });
  }

  private async validateToken(token: string): Promise<string | null> {
    try {
      // Implement your token validation logic here
      // Return userId if token is valid, null otherwise
      const userId = await this.redis.get(`token:${token}`);
      return userId;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  private async subscribeToUserChannels(userId: string, ws: WebSocketClient): Promise<void> {
    // Subscribe to user-specific channels
    const channels = await this.redis.smembers(`user:${userId}:channels`);
    for (const channel of channels) {
      await this.redis.sadd(`channel:${channel}:users`, userId);
    }
  }

  private async handleDisconnect(userId: string): Promise<void> {
    // Clean up user's channel subscriptions
    const channels = await this.redis.smembers(`user:${userId}:channels`);
    for (const channel of channels) {
      await this.redis.srem(`channel:${channel}:users`, userId);
    }
  }

  private async handleCustomMessage(userId: string, message: any): Promise<void> {
    // Implement custom message handling logic here
    // For example, handle chat messages, real-time updates, etc.
    if (message.channel) {
      this.broadcastToChannel(message.channel, message);
    }
  }

  public broadcastToUser(userId: string, type: string, data: any): void {
    this.wss.clients.forEach((client: WebSocketClient) => {
      if (client.userId === userId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type, data }));
      }
    });
  }

  public broadcastToChannel(channel: string, message: any): void {
    this.wss.clients.forEach((client: WebSocketClient) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'channel_message',
          channel,
          data: message
        }));
      }
    });
  }

  public broadcast(type: string, data: any): void {
    this.wss.clients.forEach((client: WebSocketClient) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type, data }));
      }
    });
  }

  public getConnectedUsers(): string[] {
    const users = new Set<string>();
    this.wss.clients.forEach((client: WebSocketClient) => {
      if (client.userId) {
        users.add(client.userId);
      }
    });
    return Array.from(users);
  }

  public async getChannelUsers(channel: string): Promise<string[]> {
    return await this.redis.smembers(`channel:${channel}:users`);
  }

  public close(): void {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
    this.redis.disconnect();
  }
}