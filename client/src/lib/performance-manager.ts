type PerformanceMetric = {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
};

type PerformanceReport = {
  metrics: PerformanceMetric[];
  summary: {
    totalDuration: number;
    averageDuration: number;
    slowestOperation: string;
    fastestOperation: string;
  };
};

export class PerformanceManager {
  private static instance: PerformanceManager;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private observers: Set<(metric: PerformanceMetric) => void> = new Set();
  private thresholds: Map<string, number> = new Map();

  private constructor() {
    this.setupPerformanceObserver();
  }

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric(entry.name, {
            startTime: entry.startTime,
            duration: entry.duration,
            metadata: {
              entryType: entry.entryType,
              ...entry.toJSON()
            }
          });
        });
      });

      observer.observe({ 
        entryTypes: ['navigation', 'resource', 'measure', 'paint'] 
      });
    }
  }

  startMeasure(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    const existingMetrics = this.metrics.get(name) || [];
    existingMetrics.push(metric);
    this.metrics.set(name, existingMetrics);

    performance.mark(`${name}-start`);
  }

  endMeasure(name: string, additionalMetadata?: Record<string, any>): void {
    const existingMetrics = this.metrics.get(name) || [];
    const metric = existingMetrics[existingMetrics.length - 1];

    if (metric && !metric.endTime) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.metadata = {
        ...metric.metadata,
        ...additionalMetadata
      };

      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      this.checkThreshold(metric);
      this.notifyObservers(metric);
    }
  }

  private recordMetric(
    name: string, 
    { startTime, duration, metadata }: Partial<PerformanceMetric>
  ): void {
    const metric: PerformanceMetric = {
      name,
      startTime: startTime || performance.now(),
      duration,
      metadata
    };

    const existingMetrics = this.metrics.get(name) || [];
    existingMetrics.push(metric);
    this.metrics.set(name, existingMetrics);

    this.checkThreshold(metric);
    this.notifyObservers(metric);
  }

  setThreshold(name: string, threshold: number): void {
    this.thresholds.set(name, threshold);
  }

  private checkThreshold(metric: PerformanceMetric): void {
    if (metric.duration) {
      const threshold = this.thresholds.get(metric.name);
      if (threshold && metric.duration > threshold) {
        console.warn(
          `Performance warning: ${metric.name} took ${metric.duration.toFixed(2)}ms, ` +
          `exceeding threshold of ${threshold}ms`
        );
      }
    }
  }

  observe(callback: (metric: PerformanceMetric) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(metric: PerformanceMetric): void {
    this.observers.forEach(callback => callback(metric));
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    return Array.from(this.metrics.values()).flat();
  }

  generateReport(timeframe?: { start: number; end: number }): PerformanceReport {
    let metrics = this.getMetrics();

    if (timeframe) {
      metrics = metrics.filter(m => 
        m.startTime >= timeframe.start && 
        (!m.endTime || m.endTime <= timeframe.end)
      );
    }

    const durations = metrics
      .filter(m => m.duration !== undefined)
      .map(m => ({ name: m.name, duration: m.duration! }));

    const totalDuration = durations.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = durations.length ? totalDuration / durations.length : 0;

    let slowestOperation = '';
    let fastestOperation = '';
    let maxDuration = -Infinity;
    let minDuration = Infinity;

    durations.forEach(({ name, duration }) => {
      if (duration > maxDuration) {
        maxDuration = duration;
        slowestOperation = name;
      }
      if (duration < minDuration) {
        minDuration = duration;
        fastestOperation = name;
      }
    });

    return {
      metrics,
      summary: {
        totalDuration,
        averageDuration,
        slowestOperation,
        fastestOperation
      }
    };
  }

  clear(): void {
    this.metrics.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// هوك مخصص لاستخدام قياس الأداء
export function usePerformance() {
  const manager = PerformanceManager.getInstance();

  const measureOperation = async <T>(
    name: string,
    operation: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T> => {
    manager.startMeasure(name, metadata);
    try {
      const result = await operation();
      return result;
    } finally {
      manager.endMeasure(name);
    }
  };

  return {
    startMeasure: (name: string, metadata?: Record<string, any>) => 
      manager.startMeasure(name, metadata),
    endMeasure: (name: string, metadata?: Record<string, any>) => 
      manager.endMeasure(name, metadata),
    measureOperation,
    getMetrics: (name?: string) => manager.getMetrics(name),
    generateReport: (timeframe?: { start: number; end: number }) => 
      manager.generateReport(timeframe),
    observe: (callback: (metric: PerformanceMetric) => void) => 
      manager.observe(callback),
    setThreshold: (name: string, threshold: number) => 
      manager.setThreshold(name, threshold)
  };
}