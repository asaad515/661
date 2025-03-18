type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorDetails {
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  timestamp: number;
  metadata?: Record<string, any>;
  userInfo?: {
    id?: number;
    username?: string;
    role?: string;
  };
  context?: {
    url: string;
    route: string;
    componentStack?: string;
    action?: string;
  };
}

interface ErrorReport {
  errors: ErrorDetails[];
  summary: {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    mostFrequent: string[];
    timeRange: {
      start: number;
      end: number;
    };
  };
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: ErrorDetails[] = [];
  private observers: Set<(error: ErrorDetails) => void> = new Set();
  private maxStoredErrors: number = 1000;

  private constructor() {
    this.setupGlobalHandlers();
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private setupGlobalHandlers(): void {
    window.onerror = (message, source, lineno, colno, error) => {
      this.trackError(error || new Error(String(message)), {
        severity: 'high',
        metadata: { source, lineno, colno }
      });
    };

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason, {
        severity: 'high',
        metadata: { type: 'unhandledRejection' }
      });
    });
  }

  trackError(
    error: Error | string,
    options: {
      severity?: ErrorSeverity;
      metadata?: Record<string, any>;
      userInfo?: ErrorDetails['userInfo'];
    } = {}
  ): void {
    const errorDetails: ErrorDetails = {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      severity: options.severity || 'medium',
      timestamp: Date.now(),
      metadata: options.metadata,
      userInfo: options.userInfo,
      context: {
        url: window.location.href,
        route: window.location.pathname,
        action: this.getLastUserAction()
      }
    };

    this.addError(errorDetails);
    this.notifyObservers(errorDetails);
    this.maybeSendToServer(errorDetails);
  }

  private addError(error: ErrorDetails): void {
    this.errors.push(error);
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(-this.maxStoredErrors);
    }
  }

  private getLastUserAction(): string | undefined {
    // يمكن تحسين هذا لتتبع آخر إجراء للمستخدم
    return undefined;
  }

  observe(callback: (error: ErrorDetails) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(error: ErrorDetails): void {
    this.observers.forEach(callback => callback(error));
  }

  private async maybeSendToServer(error: ErrorDetails): Promise<void> {
    if (error.severity === 'high' || error.severity === 'critical') {
      try {
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(error)
        });
      } catch (e) {
        console.error('Failed to send error to server:', e);
      }
    }
  }

  getErrors(
    timeRange?: { start: number; end: number },
    severity?: ErrorSeverity
  ): ErrorDetails[] {
    let filtered = this.errors;

    if (timeRange) {
      filtered = filtered.filter(
        error => error.timestamp >= timeRange.start && 
                error.timestamp <= timeRange.end
      );
    }

    if (severity) {
      filtered = filtered.filter(error => error.severity === severity);
    }

    return filtered;
  }

  generateReport(timeRange?: { start: number; end: number }): ErrorReport {
    const errors = this.getErrors(timeRange);
    const bySeverity: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    // تجميع الأخطاء حسب الرسالة
    const messageFrequency: Record<string, number> = {};
    
    errors.forEach(error => {
      bySeverity[error.severity]++;
      messageFrequency[error.message] = (messageFrequency[error.message] || 0) + 1;
    });

    // العثور على أكثر الأخطاء تكراراً
    const mostFrequent = Object.entries(messageFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([message]) => message);

    return {
      errors,
      summary: {
        total: errors.length,
        bySeverity,
        mostFrequent,
        timeRange: {
          start: timeRange?.start || this.errors[0]?.timestamp || Date.now(),
          end: timeRange?.end || Date.now()
        }
      }
    };
  }

  clear(): void {
    this.errors = [];
  }
}

// هوك مخصص لاستخدام تتبع الأخطاء
export function useErrorTracking() {
  const tracker = ErrorTracker.getInstance();

  return {
    trackError: (
      error: Error | string,
      options?: Parameters<typeof tracker.trackError>[1]
    ) => tracker.trackError(error, options),
    getErrors: (
      timeRange?: { start: number; end: number },
      severity?: ErrorSeverity
    ) => tracker.getErrors(timeRange, severity),
    generateReport: (timeRange?: { start: number; end: number }) => 
      tracker.generateReport(timeRange),
    observe: (callback: (error: ErrorDetails) => void) => 
      tracker.observe(callback)
  };
}