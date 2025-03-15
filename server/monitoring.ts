import { EventEmitter } from "events";
import { storage } from "./storage";
import { db } from "./db";
import { caching } from "./cache";

class MonitoringService extends EventEmitter {
  private checkInterval: number = 60000; // فحص كل دقيقة
  private metrics: Map<string, any> = new Map();
  private alerts: any[] = [];

  constructor() {
    super();
    this.startMonitoring();
  }

  private async startMonitoring() {
    setInterval(() => this.checkSystemHealth(), this.checkInterval);
    setInterval(() => this.checkDatabaseHealth(), this.checkInterval);
    setInterval(() => this.checkCacheHealth(), this.checkInterval);
    setInterval(() => this.checkInventoryLevels(), this.checkInterval * 5); // كل 5 دقائق
    setInterval(() => this.checkSystemLoad(), this.checkInterval);
  }

  private async checkSystemHealth() {
    try {
      const memory = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      this.metrics.set("memory", {
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
        timestamp: new Date()
      });

      this.metrics.set("cpu", {
        user: cpuUsage.user,
        system: cpuUsage.system,
        timestamp: new Date()
      });

      // إذا تجاوز استخدام الذاكرة 90%
      if (memory.heapUsed / memory.heapTotal > 0.9) {
        this.createAlert({
          type: "system",
          severity: "high",
          message: "استخدام الذاكرة مرتفع",
          details: { memory }
        });
      }
    } catch (error) {
      console.error("Error in system health check:", error);
    }
  }

  private async checkDatabaseHealth() {
    try {
      const startTime = Date.now();
      await db.query("SELECT 1");
      const responseTime = Date.now() - startTime;

      this.metrics.set("database", {
        responseTime,
        status: "healthy",
        timestamp: new Date()
      });

      // إذا تجاوز وقت الاستجابة 1 ثانية
      if (responseTime > 1000) {
        this.createAlert({
          type: "database",
          severity: "medium",
          message: "بطء في استجابة قاعدة البيانات",
          details: { responseTime }
        });
      }
    } catch (error) {
      this.metrics.set("database", {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date()
      });

      this.createAlert({
        type: "database",
        severity: "high",
        message: "فشل الاتصال بقاعدة البيانات",
        details: { error: error.message }
      });
    }
  }

  private async checkCacheHealth() {
    try {
      const stats = caching.getStats();
      
      this.metrics.set("cache", {
        hits: stats.hits,
        misses: stats.misses,
        keys: stats.keys,
        timestamp: new Date()
      });

      // إذا كانت نسبة الفشل في الكاش عالية
      if (stats.hits / (stats.hits + stats.misses) < 0.5) {
        this.createAlert({
          type: "cache",
          severity: "low",
          message: "أداء الكاش منخفض",
          details: stats
        });
      }
    } catch (error) {
      console.error("Error in cache health check:", error);
    }
  }

  private async checkInventoryLevels() {
    try {
      const products = await storage.getProducts();
      const lowStockProducts = products.filter(p => p.stock <= p.minQuantity);

      if (lowStockProducts.length > 0) {
        this.createAlert({
          type: "inventory",
          severity: "medium",
          message: "منتجات منخفضة المخزون",
          details: { products: lowStockProducts }
        });
      }
    } catch (error) {
      console.error("Error in inventory check:", error);
    }
  }

  private async checkSystemLoad() {
    try {
      const load = process.uptime();
      const activeSessions = await storage.getActiveSessions();

      this.metrics.set("load", {
        uptime: load,
        activeSessions: activeSessions.length,
        timestamp: new Date()
      });

      // إذا كان عدد الجلسات النشطة كبيراً
      if (activeSessions.length > 100) {
        this.createAlert({
          type: "system",
          severity: "medium",
          message: "عدد كبير من المستخدمين النشطين",
          details: { sessionCount: activeSessions.length }
        });
      }
    } catch (error) {
      console.error("Error in system load check:", error);
    }
  }

  private async createAlert(alert: any) {
    this.alerts.push({
      ...alert,
      timestamp: new Date()
    });

    // حفظ التنبيه في قاعدة البيانات
    try {
      await storage.createSystemAlert(alert);
    } catch (error) {
      console.error("Error saving alert:", error);
    }

    // إرسال الإشعار للمشتركين
    this.emit("alert", alert);
  }

  public getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  public getAlerts(options: { limit?: number; type?: string } = {}) {
    let filteredAlerts = [...this.alerts];
    
    if (options.type) {
      filteredAlerts = filteredAlerts.filter(a => a.type === options.type);
    }
    
    if (options.limit) {
      filteredAlerts = filteredAlerts.slice(-options.limit);
    }
    
    return filteredAlerts;
  }

  public subscribeToAlerts(callback: (alert: any) => void) {
    this.on("alert", callback);
    return () => this.off("alert", callback);
  }
}

export const monitoring = new MonitoringService();