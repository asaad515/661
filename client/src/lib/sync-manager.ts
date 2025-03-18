import { io, Socket } from 'socket.io-client';
import { CacheManager } from './cache-manager';
import { ErrorTracker } from './error-tracker';

type SyncState = 'connected' | 'disconnected' | 'syncing' | 'error';
type ChangeType = 'create' | 'update' | 'delete';

interface SyncOptions {
  serverUrl: string;
  room?: string;
  retryInterval?: number;
  maxRetries?: number;
  onStateChange?: (state: SyncState) => void;
  onSync?: (changes: Array<DataChange>) => void;
  onError?: (error: Error) => void;
}

interface DataChange {
  id: string;
  type: ChangeType;
  entity: string;
  data?: any;
  timestamp: number;
  author: {
    id: string;
    name: string;
  };
}

interface PendingChange extends DataChange {
  retries: number;
  lastAttempt: number;
}

export class SyncManager {
  private static instance: SyncManager;
  private socket: Socket;
  private cache: CacheManager;
  private errorTracker: ErrorTracker;
  private options: SyncOptions;
  private state: SyncState = 'disconnected';
  private pendingChanges: Map<string, PendingChange> = new Map();
  private retryTimeout: NodeJS.Timeout | null = null;
  private connectionAttempts: number = 0;

  private constructor(options: SyncOptions) {
    this.options = {
      retryInterval: 5000,
      maxRetries: 5,
      ...options
    };

    this.cache = CacheManager.getInstance();
    this.errorTracker = ErrorTracker.getInstance();
    this.setupSocket();
  }

  static getInstance(options?: SyncOptions): SyncManager {
    if (!SyncManager.instance && options) {
      SyncManager.instance = new SyncManager(options);
    }
    return SyncManager.instance;
  }

  private setupSocket(): void {
    this.socket = io(this.options.serverUrl, {
      reconnectionDelayMax: 10000,
      auth: {
        token: localStorage.getItem('authToken')
      }
    });

    this.socket.on('connect', () => {
      this.setState('connected');
      this.connectionAttempts = 0;
      this.processNextPendingChange();

      if (this.options.room) {
        this.socket.emit('join', this.options.room);
      }
    });

    this.socket.on('disconnect', () => {
      this.setState('disconnected');
      this.scheduleReconnect();
    });

    this.socket.on('sync', (changes: Array<DataChange>) => {
      this.handleIncomingChanges(changes);
    });

    this.socket.on('error', (error: Error) => {
      this.setState('error');
      this.errorTracker.trackError(error, {
        severity: 'high',
        metadata: { component: 'SyncManager' }
      });
      this.options.onError?.(error);
    });
  }

  private setState(newState: SyncState): void {
    this.state = newState;
    this.options.onStateChange?.(newState);
  }

  private scheduleReconnect(): void {
    if (this.connectionAttempts >= (this.options.maxRetries || 5)) {
      this.setState('error');
      const error = new Error('Max reconnection attempts reached');
      this.errorTracker.trackError(error, {
        severity: 'high',
        metadata: { component: 'SyncManager' }
      });
      this.options.onError?.(error);
      return;
    }

    if (!this.retryTimeout) {
      this.retryTimeout = setTimeout(() => {
        this.connectionAttempts++;
        this.socket.connect();
        this.retryTimeout = null;
      }, this.options.retryInterval);
    }
  }

  private async handleIncomingChanges(changes: Array<DataChange>): Promise<void> {
    this.setState('syncing');

    try {
      for (const change of changes) {
        // تجاهل التغييرات المعلقة التي تم إرسالها من قبل هذا العميل
        if (this.pendingChanges.has(change.id)) {
          this.pendingChanges.delete(change.id);
          continue;
        }

        // تحديث الكاش المحلي
        switch (change.type) {
          case 'create':
          case 'update':
            await this.cache.set(`${change.entity}:${change.id}`, change.data);
            break;
          case 'delete':
            await this.cache.invalidate(`${change.entity}:${change.id}`);
            break;
        }
      }

      this.options.onSync?.(changes);
      this.setState('connected');
    } catch (error) {
      this.setState('error');
      this.errorTracker.trackError(error as Error, {
        severity: 'high',
        metadata: { component: 'SyncManager', operation: 'handleIncomingChanges' }
      });
      throw error;
    }
  }

  private async processNextPendingChange(): Promise<void> {
    if (this.state !== 'connected' || this.pendingChanges.size === 0) {
      return;
    }

    const [changeId, change] = Array.from(this.pendingChanges.entries())[0];

    try {
      this.setState('syncing');
      await this.emitChange(change);
      this.pendingChanges.delete(changeId);
      this.setState('connected');

      // معالجة التغيير التالي إن وجد
      if (this.pendingChanges.size > 0) {
        this.processNextPendingChange();
      }
    } catch (error) {
      change.retries++;
      change.lastAttempt = Date.now();

      if (change.retries >= (this.options.maxRetries || 5)) {
        this.pendingChanges.delete(changeId);
        this.errorTracker.trackError(error as Error, {
          severity: 'high',
          metadata: {
            component: 'SyncManager',
            operation: 'processChange',
            changeId
          }
        });
      }

      this.setState('error');
    }
  }

  private emitChange(change: DataChange): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.timeout(5000).emit('change', change, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async sync(
    type: ChangeType,
    entity: string,
    data?: any,
    id?: string
  ): Promise<void> {
    const change: DataChange = {
      id: id || crypto.randomUUID(),
      type,
      entity,
      data,
      timestamp: Date.now(),
      author: {
        id: localStorage.getItem('userId') || 'anonymous',
        name: localStorage.getItem('userName') || 'Anonymous'
      }
    };

    const pendingChange: PendingChange = {
      ...change,
      retries: 0,
      lastAttempt: 0
    };

    this.pendingChanges.set(change.id, pendingChange);

    // إذا كان متصلاً، حاول معالجة التغيير مباشرة
    if (this.state === 'connected') {
      this.processNextPendingChange();
    }
  }

  getState(): SyncState {
    return this.state;
  }

  getPendingChanges(): PendingChange[] {
    return Array.from(this.pendingChanges.values());
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  reconnect(): void {
    if (this.state === 'disconnected') {
      this.connectionAttempts = 0;
      this.socket.connect();
    }
  }
}

// هوك مخصص لاستخدام المزامنة
export function useSync() {
  const sync = (options: SyncOptions) => {
    const manager = SyncManager.getInstance(options);
    return {
      sync: (type: ChangeType, entity: string, data?: any, id?: string) =>
        manager.sync(type, entity, data, id),
      getState: () => manager.getState(),
      getPendingChanges: () => manager.getPendingChanges(),
      disconnect: () => manager.disconnect(),
      reconnect: () => manager.reconnect()
    };
  };

  return { sync };
}