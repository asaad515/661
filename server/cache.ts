import { createClient } from '@neondatabase/serverless';
import { db } from "./db";
import NodeCache from "node-cache";

class CacheService {
  private cache: NodeCache;
  private readonly defaultTTL = 5 * 60; // 5 دقائق

  // كاش مخصص للبيانات المستخدمة بكثرة
  private readonly frequentDataTTL = 30 * 60; // 30 دقيقة
  
  // كاش مخصص للتقارير
  private readonly reportsTTL = 60 * 60; // ساعة واحدة

  constructor() {
    this.cache = new NodeCache({
      stdTTL: this.defaultTTL,
      checkperiod: 120,
      useClones: false,
      deleteOnExpire: true,
    });

    // تنظيف الكاش كل 24 ساعة
    setInterval(() => {
      this.cleanCache();
    }, 24 * 60 * 60 * 1000);
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    return this.cache.set(key, value, ttl || this.defaultTTL);
  }

  async delete(key: string): Promise<number> {
    return this.cache.del(key);
  }

  async flush(): Promise<void> {
    this.cache.flushAll();
  }

  // تخزين مؤقت للتقارير
  async getReportCache<T>(type: string, params: Record<string, any>): Promise<T | undefined> {
    const key = this.generateReportKey(type, params);
    return this.get<T>(key);
  }

  async setReportCache<T>(type: string, params: Record<string, any>, data: T): Promise<boolean> {
    const key = this.generateReportKey(type, params);
    return this.set(key, data, this.reportsTTL);
  }

  // تخزين مؤقت للبيانات المستخدمة بكثرة
  async getFrequentData<T>(key: string): Promise<T | undefined> {
    return this.get<T>(`frequent:${key}`);
  }

  async setFrequentData<T>(key: string, data: T): Promise<boolean> {
    return this.set(`frequent:${key}`, data, this.frequentDataTTL);
  }

  // تخزين مؤقت للمستخدمين النشطين
  async getActiveUsers(): Promise<any[]> {
    const cachedUsers = await this.get<any[]>('active_users');
    if (cachedUsers) return cachedUsers;

    const users = await db.query('SELECT id, username, lastLoginAt FROM users WHERE isActive = true');
    await this.set('active_users', users, this.frequentDataTTL);
    return users;
  }

  // تخزين مؤقت للإحصائيات العامة
  async getSystemStats(): Promise<any> {
    const cachedStats = await this.get<any>('system_stats');
    if (cachedStats) return cachedStats;

    const stats = await this.calculateSystemStats();
    await this.set('system_stats', stats, this.frequentDataTTL);
    return stats;
  }

  private async calculateSystemStats() {
    // احتساب الإحصائيات العامة للنظام
    const [
      usersCount,
      productsCount,
      salesCount,
      customersCount
    ] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query('SELECT COUNT(*) FROM products'),
      db.query('SELECT COUNT(*) FROM sales'),
      db.query('SELECT COUNT(*) FROM customers')
    ]);

    return {
      users: usersCount[0].count,
      products: productsCount[0].count,
      sales: salesCount[0].count,
      customers: customersCount[0].count,
      lastUpdated: new Date()
    };
  }

  private generateReportKey(type: string, params: Record<string, any>): string {
    return `report:${type}:${JSON.stringify(params)}`;
  }

  private async cleanCache() {
    const stats = this.cache.getStats();
    console.log('Cache stats before cleaning:', stats);
    
    // تنظيف الكاش القديم
    const keys = this.cache.keys();
    for (const key of keys) {
      const value = this.cache.get(key);
      if (!value) {
        this.cache.del(key);
      }
    }

    console.log('Cache stats after cleaning:', this.cache.getStats());
  }
}

export const caching = new CacheService();