import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SyncManager } from './sync-manager';

type NotificationType = 'info' | 'success' | 'warning' | 'error';
type NotificationPriority = 'low' | 'medium' | 'high';

interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: number;
  metadata?: Record<string, any>;
  read: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

interface NotificationStore {
  notifications: NotificationData[];
  unreadCount: number;
  addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      addNotification: (notification) => {
        const newNotification: NotificationData = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          read: false
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }));
      },
      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (notification && !notification.read) {
            return {
              notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
              ),
              unreadCount: state.unreadCount - 1
            };
          }
          return state;
        });
      },
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0
        }));
      },
      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.read
              ? state.unreadCount - 1
              : state.unreadCount
          };
        });
      },
      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      }
    }),
    {
      name: 'notification-storage'
    }
  )
);

export class NotificationManager {
  private static instance: NotificationManager;
  private syncManager: SyncManager;
  private store: typeof useNotificationStore;

  private constructor() {
    this.store = useNotificationStore;
    this.syncManager = SyncManager.getInstance();
    this.setupNotificationSync();
    this.setupServiceWorker();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private async setupServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/notification-worker.js');
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          registration.active?.postMessage({
            type: 'INIT',
            token: localStorage.getItem('pushToken')
          });
        }
      } catch (error) {
        console.error('Failed to setup notifications:', error);
      }
    }
  }

  private setupNotificationSync(): void {
    this.syncManager.sync('subscribe', 'notifications', null);
    
    // استماع للإشعارات الجديدة من السيرفر
    document.addEventListener('sync:notifications', ((event: CustomEvent) => {
      const notification = event.detail;
      this.show(notification);
    }) as EventListener);
  }

  show(notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>): void {
    this.store.getState().addNotification(notification);

    // إظهار إشعار نظام التشغيل إذا كان التطبيق في الخلفية
    if (document.hidden && Notification.permission === 'granted') {
      const { title, message, type } = notification;
      new Notification(title, {
        body: message,
        icon: this.getIconForType(type),
        tag: 'bms-notification'
      });
    }
  }

  private getIconForType(type: NotificationType): string {
    switch (type) {
      case 'success':
        return '/icons/success.png';
      case 'warning':
        return '/icons/warning.png';
      case 'error':
        return '/icons/error.png';
      default:
        return '/icons/info.png';
    }
  }

  markAsRead(id: string): void {
    this.store.getState().markAsRead(id);
    this.syncManager.sync('update', 'notifications', { id, read: true });
  }

  markAllAsRead(): void {
    this.store.getState().markAllAsRead();
    this.syncManager.sync('update', 'notifications', { allRead: true });
  }

  remove(id: string): void {
    this.store.getState().removeNotification(id);
    this.syncManager.sync('delete', 'notifications', { id });
  }

  clearAll(): void {
    this.store.getState().clearAll();
    this.syncManager.sync('delete', 'notifications', { all: true });
  }

  getUnreadCount(): number {
    return this.store.getState().unreadCount;
  }

  getNotifications(filters?: {
    type?: NotificationType;
    priority?: NotificationPriority;
    read?: boolean;
    startDate?: number;
    endDate?: number;
  }): NotificationData[] {
    let notifications = this.store.getState().notifications;

    if (filters) {
      notifications = notifications.filter((notification) => {
        if (filters.type && notification.type !== filters.type) return false;
        if (filters.priority && notification.priority !== filters.priority) return false;
        if (filters.read !== undefined && notification.read !== filters.read) return false;
        if (filters.startDate && notification.timestamp < filters.startDate) return false;
        if (filters.endDate && notification.timestamp > filters.endDate) return false;
        return true;
      });
    }

    return notifications;
  }
}

// هوك مخصص لاستخدام الإشعارات
export function useNotifications() {
  const manager = NotificationManager.getInstance();
  const store = useNotificationStore();

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    show: (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) =>
      manager.show(notification),
    markAsRead: (id: string) => manager.markAsRead(id),
    markAllAsRead: () => manager.markAllAsRead(),
    remove: (id: string) => manager.remove(id),
    clearAll: () => manager.clearAll(),
    getNotifications: (filters?: Parameters<typeof manager.getNotifications>[0]) =>
      manager.getNotifications(filters)
  };
}