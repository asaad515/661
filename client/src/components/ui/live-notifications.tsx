import { useEffect, useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Toast, ToastProvider, ToastViewport } from './toast';
import { Badge } from './badge';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
}

export function LiveNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // اتصال WebSocket للتنبيهات المباشرة
    const ws = new WebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:5000');

    ws.onmessage = (event) => {
      const notification: Notification = JSON.parse(event.data);
      addNotification(notification);
    };

    return () => ws.close();
  }, []);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    // عرض toast للتنبيه الجديد
    showToast(notification);
  };

  const showToast = (notification: Notification) => {
    const icons = {
      success: <CheckCircle className="h-5 w-5 text-green-500" />,
      warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      info: <Info className="h-5 w-5 text-blue-500" />,
      error: <AlertTriangle className="h-5 w-5 text-red-500" />
    };

    return (
      <Toast
        variant={notification.type}
        className={cn(
          'flex items-center gap-3',
          notification.type === 'error' && 'border-red-500 bg-red-100'
        )}
      >
        {icons[notification.type]}
        <div className="flex-1">
          <h4 className="font-semibold">{notification.title}</h4>
          <p className="text-sm opacity-90">{notification.message}</p>
        </div>
      </Toast>
    );
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <ToastProvider>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>

        {isOpen && (
          <div className="absolute left-0 top-12 z-50 w-96 rounded-md border bg-background p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">التنبيهات</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  تعليم الكل كمقروء
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearNotifications}
                  disabled={notifications.length === 0}
                >
                  مسح الكل
                </Button>
              </div>
            </div>

            <div className="max-h-96 space-y-2 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-muted-foreground">لا توجد تنبيهات</p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'rounded-md border p-3 transition-colors',
                      !notification.isRead && 'bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {notification.type === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {notification.type === 'warning' && (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                      {notification.type === 'info' && (
                        <Info className="h-5 w-5 text-blue-500" />
                      )}
                      {notification.type === 'error' && (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <time className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleString('ar-IQ')}
                        </time>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <ToastViewport />
      </ToastProvider>
    </div>
  );
}