import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { monitoring } from './monitoring';
import { storage } from './storage';

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });
  const clients = new Map<WebSocket, { userId?: number }>();

  wss.on('connection', (ws, request) => {
    console.log('Client connected');
    clients.set(ws, {});

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'auth' && data.token) {
          const user = await storage.getUserFromToken(data.token);
          if (user) {
            clients.set(ws, { userId: user.id });
            console.log(`User ${user.id} authenticated`);
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected');
    });
  });

  // الاشتراك في تنبيهات المراقبة
  monitoring.subscribeToAlerts((alert) => {
    const notification = {
      id: Date.now().toString(),
      type: mapAlertTypeToNotification(alert.severity),
      title: getAlertTitle(alert.type),
      message: alert.message,
      timestamp: new Date(),
      details: alert.details
    };

    // إرسال التنبيه للمستخدمين المصرح لهم
    for (const [client, data] of clients) {
      if (shouldSendToUser(alert, data.userId)) {
        client.send(JSON.stringify(notification));
      }
    }
  });

  // إرسال تنبيهات المخزون المنخفض
  setInterval(async () => {
    const lowStockProducts = await storage.getLowStockProducts();
    if (lowStockProducts.length > 0) {
      const notification = {
        id: Date.now().toString(),
        type: 'warning',
        title: 'تنبيه المخزون',
        message: `يوجد ${lowStockProducts.length} منتجات منخفضة المخزون`,
        timestamp: new Date(),
        details: { products: lowStockProducts }
      };

      broadcastToAdmins(notification);
    }
  }, 5 * 60 * 1000); // كل 5 دقائق

  function mapAlertTypeToNotification(severity: string): 'success' | 'warning' | 'info' | 'error' {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  }

  function getAlertTitle(type: string): string {
    switch (type) {
      case 'system':
        return 'تنبيه النظام';
      case 'database':
        return 'تنبيه قاعدة البيانات';
      case 'cache':
        return 'تنبيه الذاكرة المؤقتة';
      case 'inventory':
        return 'تنبيه المخزون';
      default:
        return 'تنبيه';
    }
  }

  function shouldSendToUser(alert: any, userId?: number): boolean {
    if (!userId) return false;

    // إرسال التنبيهات الحرجة للمسؤولين فقط
    if (alert.severity === 'high') {
      return isAdmin(userId);
    }

    return true;
  }

  async function isAdmin(userId: number): Promise<boolean> {
    const user = await storage.getUser(userId);
    return user?.role === 'admin';
  }

  function broadcastToAdmins(notification: any) {
    for (const [client, data] of clients) {
      if (data.userId && isAdmin(data.userId)) {
        client.send(JSON.stringify(notification));
      }
    }
  }

  return wss;
}