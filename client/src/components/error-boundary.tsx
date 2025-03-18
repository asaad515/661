import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // يمكن إضافة تسجيل الأخطاء هنا
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full max-w-md p-6 text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold mb-2">عذراً، حدث خطأ ما</h2>
              <p className="text-muted-foreground mb-6">
                حدث خطأ غير متوقع. يمكنك إعادة تحميل الصفحة أو العودة للصفحة الرئيسية.
              </p>
              {this.state.error && (
                <div className="bg-muted p-4 rounded-lg mb-6 text-right">
                  <p className="text-sm font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  إعادة تحميل
                </Button>
                <Button
                  variant="default"
                  onClick={() => window.location.href = '/'}
                >
                  العودة للرئيسية
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}