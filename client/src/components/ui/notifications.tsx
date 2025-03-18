import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { Card } from './card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
};

interface NotificationsProps {
  onMarkAsRead?: (id: string) => void;
  onClearAll?: () => void;
}

export function Notifications({ onMarkAsRead, onClearAll }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // تحديث عدد الإشعارات غير المقروءة
    setUnreadCount(notifications.filter(n => !n.read).length);

    // طلب إذن الإشعارات إذا لم يكن قد تم منحه
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [notifications]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    );
    onMarkAsRead?.(id);
  };

  const handleClearAll = () => {
    setNotifications([]);
    onClearAll?.();
  };

  const notificationVariants = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -100 }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          onClick={() => setIsOpen(true)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-full sm:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>الإشعارات</span>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
              >
                مسح الكل
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground p-4"
              >
                لا توجد إشعارات
              </motion.div>
            ) : (
              notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  layout
                  variants={notificationVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Card className={`p-4 ${!notification.read ? 'bg-primary/5' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <time className="text-xs text-muted-foreground">
                            {new Intl.DateTimeFormat('ar-IQ', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            }).format(new Date(notification.timestamp))}
                          </time>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-xs text-primary"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              تحديد كمقروء
                            </Button>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1"
                        onClick={() => {
                          setNotifications(prev =>
                            prev.filter(n => n.id !== notification.id)
                          );
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {notification.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={notification.action.onClick}
                      >
                        {notification.action.label}
                      </Button>
                    )}
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}