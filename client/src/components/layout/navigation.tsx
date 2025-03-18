import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  Calendar,
  BarChart2,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/', icon: Home, label: 'الرئيسية' },
  { path: '/sales', icon: ShoppingCart, label: 'المبيعات' },
  { path: '/inventory', icon: Package, label: 'المخزون' },
  { path: '/customers', icon: Users, label: 'العملاء' },
  { path: '/appointments', icon: Calendar, label: 'المواعيد' },
  { path: '/reports', icon: BarChart2, label: 'التقارير' },
  { path: '/settings', icon: Settings, label: 'الإعدادات' },
];

const breadcrumbLabels: Record<string, string> = {
  sales: 'المبيعات',
  inventory: 'المخزون',
  customers: 'العملاء',
  appointments: 'المواعيد',
  reports: 'التقارير',
  settings: 'الإعدادات',
};

export function Navigation() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  // تحديد عنوان الصفحة الحالية وإنشاء مسار التنقل
  const currentPath = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = currentPath.map((path, index) => ({
    label: breadcrumbLabels[path] || path,
    path: '/' + currentPath.slice(0, index + 1).join('/')
  }));

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 right-0 z-40 h-full bg-background border-l transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          {!isCollapsed && (
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-bold"
            >
              نظام الإدارة
            </motion.h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="ml-auto"
          >
            {isCollapsed ? <ChevronLeft /> : <ChevronRight />}
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="space-y-2 p-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isCollapsed ? "px-2" : "px-4"
                  )}
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon className={cn(
                    "h-5 w-5",
                    isCollapsed ? "mx-auto" : "ml-2"
                  )} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </nav>

      {/* مسار التنقل */}
      <div 
        className={cn(
          "fixed top-0 right-0 z-30 w-full bg-background border-b transition-all duration-300 px-4",
          isCollapsed ? "mr-16" : "mr-64"
        )}
      >
        <div className="h-16 flex items-center">
          <nav className="flex" aria-label="مسار التنقل">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              {breadcrumbs.map((item, index) => (
                <li key={item.path} className="inline-flex items-center">
                  {index > 0 && (
                    <ChevronLeft className="mx-2 h-4 w-4 text-muted-foreground" />
                  )}
                  <Button
                    variant="link"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </Button>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* زر القائمة في وضع الموبايل */}
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          onClick={toggleCollapse}
          className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
        >
          {isCollapsed ? <Menu /> : <X />}
        </Button>
      )}

      {/* المحتوى الرئيسي */}
      <main
        className={cn(
          "min-h-screen pt-16 transition-all duration-300",
          isCollapsed ? "mr-16" : "mr-64"
        )}
      >
        <div className="container mx-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              {/* المحتوى سيتم عرضه هنا */}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}