import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fileUpload from "express-fileupload";
import path from "path";
import cors from 'cors';

const app = express();

// Middleware للأمان
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// تكوين المسارات الثابتة
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    
    // تسجيل الخطأ مع معلومات إضافية
    const errorLog = {
      timestamp: new Date(),
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    };
    
    // يمكن إضافة كود لحفظ السجل في قاعدة البيانات هنا
    
    // إرسال رسالة خطأ آمنة للمستخدم
    res.status(err.status || 500).json({
      message: process.env.NODE_ENV === 'production' 
        ? 'حدث خطأ في النظام'
        : err.message
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();