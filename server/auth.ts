import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { insertUserSchema, type User } from "@shared/schema";
import MemoryStore from "memorystore";
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const MemoryStoreSession = MemoryStore(session);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(12); // زيادة قوة التشفير
  return bcrypt.hash(password, salt);
}

async function comparePasswords(supplied: string, stored: string) {
  return bcrypt.compare(supplied, stored);
}

// إنشاء محدد معدل الطلبات
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100 // الحد الأقصى للطلبات لكل IP
});

// إعدادات الأمان الأساسية
export const securityMiddleware = helmet();

// التحقق من صحة التوكن
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'لم يتم توفير رمز التحقق' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'رمز التحقق غير صالح' });
  }
};

// إنشاء توكن جديد
export const generateToken = (userId: string, role: string) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// التحقق من صلاحيات المستخدم
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        message: 'ليس لديك الصلاحية للوصول إلى هذا المورد'
      });
    }
    
    next();
  };
};

// التحقق من صحة المدخلات
export const validateInput = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'خطأ في البيانات المدخلة',
        details: error.details
      });
    }
    next();
  };
};

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "dev_secret_key",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict',
      path: '/'
    },
    name: 'sid'
  };

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // تحسين أمان استراتيجية تسجيل الدخول
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "اسم المستخدم غير موجود" });
        }

        if (!user.isActive) {
          return done(null, false, { message: "الحساب غير نشط" });
        }

        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: "كلمة المرور غير صحيحة" });
        }

        // تحديث وقت آخر تسجيل دخول
        await storage.updateUser(user.id, {
          lastLoginAt: new Date()
        });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((req: any, user: User, done: (err: any, id?: unknown) => void) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      if (!user.isActive) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "اسم المستخدم موجود بالفعل" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({
            message: "فشل في تسجيل الدخول بعد إنشاء الحساب",
          });
        }
        // عدم إرجاع كلمة المرور في الاستجابة
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      console.error("Registration error:", err);
      if (err instanceof Error) {
        res.status(400).json({ message: err.message });
      } else {
        res.status(500).json({ message: "حدث خطأ أثناء إنشاء الحساب" });
      }
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: User | false, info: { message: string } | undefined) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
      }

      if (!user) {
        return res.status(401).json({
          message: info?.message || "فشل تسجيل الدخول",
        });
      }

      req.login(user, (err) => {
        if (err) {
          console.error("Session error:", err);
          return res.status(500).json({
            message: "فشل في إنشاء جلسة المستخدم",
          });
        }
        // عدم إرجاع كلمة المرور في الاستجابة
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    const sessionId = req.sessionID;

    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({
          message: "حدث خطأ أثناء تسجيل الخروج",
        });
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({
            message: "حدث خطأ أثناء إنهاء الجلسة",
          });
        }

        res.clearCookie('sid');
        res.json({ success: true });
      });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        message: "يجب تسجيل الدخول أولاً",
      });
    }
    // عدم إرجاع كلمة المرور في الاستجابة
    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });
}