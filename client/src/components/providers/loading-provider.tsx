import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStack, setLoadingStack] = useState<number>(0);

  const startLoading = useCallback(() => {
    setLoadingStack((prev) => prev + 1);
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingStack((prev) => {
      const newStack = prev - 1;
      if (newStack <= 0) {
        setIsLoading(false);
        return 0;
      }
      return newStack;
    });
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          >
            <div className="flex h-full items-center justify-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                className="relative"
              >
                <motion.div
                  animate={{
                    rotate: 360
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Loader2 className="h-12 w-12 text-primary" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-4 whitespace-nowrap"
                >
                  <p className="text-muted-foreground">جاري التحميل...</p>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}