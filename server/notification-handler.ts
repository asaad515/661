import { Redis } from 'ioredis';
import webpush from 'web-push';
import { WebSocketServer } from './websocket';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationOptions {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high';
  url?: string;
  actions?: Array<{
    action: string;
    title: string;
  }>;
  metadata?: Record<string, any>;
}

export class NotificationHandler {
  private static instance: NotificationHandler;
  private redis: Redis;
  private ws: WebSocketServer;

  private constructor(redisUrl: string, vapidKeys: { public: string; private: string }) {
    this.redis = new Redis(redisUrl);
    webpush.setVapidDetails(
      'mailto:support@yourdomain.com',
      vapidKeys.public,
      vapidKeys.private
    );
  }

  static getInstance(config?: { redisUrl: string; vapidKeys: { public: string; private: string } }): NotificationHandler {
    if (!NotificationHandler.instance && config) {
      NotificationHandler.instance = new NotificationHandler(config.redisUrl, config.vapidKeys);
    }
    return NotificationHandler.instance;
  }

  setWebSocketServer(ws: WebSocketServer): void {
    this.ws = ws;
  }

  async saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    await this.redis.hset(
      `user:${userId}:subscriptions`,
      subscription.endpoint,
      JSON.stringify(subscription)
    );
  }

  async removeSubscription(userId: string, endpoint: string): Promise<void> {
    await this.redis.hdel(`user:${userId}:subscriptions`, endpoint);
  }

  async sendNotification(userId: string, options: NotificationOptions): Promise<void> {
    const subscriptions = await this.redis.hgetall(`user:${userId}:subscriptions`);
    
    if (!subscriptions) {
      console.warn(`No push subscriptions found for user ${userId}`);
      return;
    }

    const notification = {
      ...options,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    // Store notification in history
    await this.redis.lpush(
      `user:${userId}:notifications`,
      JSON.stringify(notification)
    );
    
    // Trim notification history to last 100 notifications
    await this.redis.ltrim(`user:${userId}:notifications`, 0, 99);

    // Send via WebSocket if user is online
    if (this.ws) {
      this.ws.broadcastToUser(userId, 'notification', notification);
    }

    // Send push notifications to all subscribed devices
    const pushPromises = Object.values(subscriptions).map(async (sub) => {
      try {
        const subscription = JSON.parse(sub);
        await webpush.sendNotification(
          subscription,
          JSON.stringify(notification)
        );
      } catch (error) {
        if ((error as any).statusCode === 410) {
          // Subscription has expired or been unsubscribed
          await this.removeSubscription(userId, JSON.parse(sub).endpoint);
        } else {
          console.error('Push notification failed:', error);
        }
      }
    });

    await Promise.allSettled(pushPromises);
  }

  async sendBulkNotifications(userIds: string[], options: NotificationOptions): Promise<void> {
    await Promise.all(
      userIds.map((userId) => this.sendNotification(userId, options))
    );
  }

  async getUserNotifications(
    userId: string,
    options: {
      start?: number;
      end?: number;
      unreadOnly?: boolean;
      type?: string;
    } = {}
  ): Promise<any[]> {
    const { start = 0, end = -1 } = options;
    
    const notifications = await this.redis.lrange(
      `user:${userId}:notifications`,
      start,
      end
    );

    let filtered = notifications.map((n) => JSON.parse(n));

    if (options.unreadOnly) {
      const readSet = await this.redis.smembers(`user:${userId}:read_notifications`);
      filtered = filtered.filter((n) => !readSet.includes(n.id));
    }

    if (options.type) {
      filtered = filtered.filter((n) => n.type === options.type);
    }

    return filtered;
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.redis.sadd(`user:${userId}:read_notifications`, notificationId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getUserNotifications(userId);
    const notificationIds = notifications.map((n) => n.id);
    
    if (notificationIds.length > 0) {
      await this.redis.sadd(
        `user:${userId}:read_notifications`,
        ...notificationIds
      );
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getUserNotifications(userId);
    const readSet = await this.redis.smembers(`user:${userId}:read_notifications`);
    
    return notifications.filter((n) => !readSet.includes(n.id)).length;
  }

  async clearOldNotifications(days: number = 30): Promise<void> {
    const keys = await this.redis.keys('user:*:notifications');
    const now = Date.now();
    const maxAge = days * 24 * 60 * 60 * 1000;

    for (const key of keys) {
      const notifications = await this.redis.lrange(key, 0, -1);
      const filtered = notifications.filter((n) => {
        const notification = JSON.parse(n);
        return now - notification.timestamp <= maxAge;
      });

      if (filtered.length !== notifications.length) {
        await this.redis.del(key);
        if (filtered.length > 0) {
          await this.redis.rpush(key, ...filtered);
        }
      }
    }
  }
}