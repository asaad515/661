import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROTECTED_ROUTES = [
  '/settings',
  '/reports',
  '/users',
];

const PERMISSIONS = {
  'manage_users': ['admin'],
  'view_reports': ['admin', 'user'],
  'manage_settings': ['admin'],
  'manage_inventory': ['admin', 'user'],
  'manage_sales': ['admin', 'user'],
  'manage_customers': ['admin', 'user'],
  'manage_appointments': ['admin', 'user'],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const isProtected = PROTECTED_ROUTES.some(route => 
        location.pathname.startsWith(route)
      );

      if (isProtected && !user) {
        navigate('/login', { 
          state: { from: location.pathname },
          replace: true 
        });
      }
    }
  }, [location, user, isLoading]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل تسجيل الدخول');
      }

      const userData = await response.json();
      setUser(userData);

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك ${userData.username}`,
      });

      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الدخول",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل خروجك بنجاح",
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading,
        login,
        logout,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function RequireAuth({ 
  children, 
  permission 
}: { 
  children: React.ReactNode;
  permission?: string;
}) {
  const { user, isLoading, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { 
        state: { from: location.pathname },
        replace: true 
      });
    }

    if (!isLoading && permission && !hasPermission(permission)) {
      toast({
        variant: "destructive",
        title: "غير مصرح",
        description: "ليس لديك صلاحية للوصول لهذه الصفحة",
      });
      navigate('/', { replace: true });
    }
  }, [user, isLoading, permission]);

  if (isLoading) {
    return null;
  }

  if (!user || (permission && !hasPermission(permission))) {
    return null;
  }

  return <>{children}</>;
}