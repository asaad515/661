import CryptoJS from 'crypto-js';

interface StorageOptions {
  encrypted?: boolean;
  expiry?: number;
  namespace?: string;
}

interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiry?: number;
  encrypted?: boolean;
}

export class StorageManager {
  private static instance: StorageManager;
  private encryptionKey: string;
  private namespace: string;

  private constructor() {
    this.encryptionKey = this.getOrGenerateKey();
    this.namespace = 'app';
    this.cleanExpiredItems();
    this.setupPeriodicCleanup();
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private getOrGenerateKey(): string {
    const storedKey = localStorage.getItem('encryptionKey');
    if (storedKey) return storedKey;

    const newKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
    localStorage.setItem('encryptionKey', newKey);
    return newKey;
  }

  setNamespace(namespace: string): void {
    this.namespace = namespace;
  }

  private getNamespacedKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  private encrypt(data: any): string {
    return CryptoJS.AES.encrypt(
      JSON.stringify(data),
      this.encryptionKey
    ).toString();
  }

  private decrypt(encryptedData: string): any {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  set<T>(
    key: string,
    value: T,
    options: StorageOptions = {}
  ): void {
    const namespacedKey = this.getNamespacedKey(key);
    const item: StorageItem<T> = {
      value,
      timestamp: Date.now(),
      expiry: options.expiry,
      encrypted: options.encrypted
    };

    let storageValue = item;
    if (options.encrypted) {
      storageValue = {
        ...item,
        value: this.encrypt(value)
      };
    }

    try {
      localStorage.setItem(namespacedKey, JSON.stringify(storageValue));
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.cleanOldItems();
        try {
          localStorage.setItem(namespacedKey, JSON.stringify(storageValue));
        } catch (retryError) {
          console.error('Storage quota exceeded even after cleanup');
          throw retryError;
        }
      } else {
        throw error;
      }
    }
  }

  get<T>(key: string): T | null {
    const namespacedKey = this.getNamespacedKey(key);
    const data = localStorage.getItem(namespacedKey);
    
    if (!data) return null;

    try {
      const item: StorageItem<T> = JSON.parse(data);

      if (this.isExpired(item)) {
        this.remove(key);
        return null;
      }

      if (item.encrypted) {
        return this.decrypt(item.value);
      }

      return item.value;
    } catch (error) {
      console.error(`Error retrieving item ${key}:`, error);
      return null;
    }
  }

  remove(key: string): void {
    const namespacedKey = this.getNamespacedKey(key);
    localStorage.removeItem(namespacedKey);
  }

  clear(namespace?: string): void {
    if (namespace) {
      const prefix = `${namespace}:`;
      Object.keys(localStorage)
        .filter(key => key.startsWith(prefix))
        .forEach(key => localStorage.removeItem(key));
    } else {
      Object.keys(localStorage)
        .filter(key => key.startsWith(`${this.namespace}:`))
        .forEach(key => localStorage.removeItem(key));
    }
  }

  private isExpired(item: StorageItem<any>): boolean {
    if (!item.expiry) return false;
    return Date.now() - item.timestamp > item.expiry;
  }

  private cleanExpiredItems(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(`${this.namespace}:`))
      .forEach(key => {
        try {
          const item: StorageItem<any> = JSON.parse(localStorage.getItem(key) || '');
          if (this.isExpired(item)) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          console.warn(`Error processing item ${key}:`, error);
        }
      });
  }

  private cleanOldItems(): void {
    const items = Object.keys(localStorage)
      .filter(key => key.startsWith(`${this.namespace}:`))
      .map(key => ({
        key,
        timestamp: JSON.parse(localStorage.getItem(key) || '').timestamp
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // حذف أقدم 20% من العناصر
    const itemsToDelete = Math.ceil(items.length * 0.2);
    items
      .slice(0, itemsToDelete)
      .forEach(item => localStorage.removeItem(item.key));
  }

  private setupPeriodicCleanup(): void {
    // تنظيف العناصر منتهية الصلاحية كل ساعة
    setInterval(() => this.cleanExpiredItems(), 60 * 60 * 1000);
  }

  getSize(): { used: number; total: number; percentage: number } {
    const used = new Blob(
      Object.values(localStorage).map(item => JSON.stringify(item))
    ).size;
    
    const total = 5 * 1024 * 1024; // حد التخزين النموذجي 5MB
    const percentage = (used / total) * 100;

    return { used, total, percentage };
  }
}

// هوك مخصص لاستخدام التخزين
export function useStorage() {
  const storage = StorageManager.getInstance();

  return {
    setItem: <T>(key: string, value: T, options?: StorageOptions) =>
      storage.set(key, value, options),
    getItem: <T>(key: string) =>
      storage.get<T>(key),
    removeItem: (key: string) =>
      storage.remove(key),
    clear: (namespace?: string) =>
      storage.clear(namespace),
    setNamespace: (namespace: string) =>
      storage.setNamespace(namespace),
    getSize: () =>
      storage.getSize()
  };
}