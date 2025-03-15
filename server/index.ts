import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { json } from "body-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fileUpload from "express-fileupload";
import path from "path";
import { ZodError } from "zod";
import cluster from "cluster";
import os from "os";
import { setupWebSocket } from "./websocket";
import { monitoring } from "./monitoring";

// تفعيل نظام توزيع الحمل في بيئة الإنتاج فقط
if (process.env.NODE_ENV === "production" && cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  
  // تسجيل الأحداث للعمليات الفرعية
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });

  // إنشاء العمليات الفرعية
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  const app = express();

  // إعداد CORS
  app.use(cors({
    origin: process.env.NODE_ENV === "production" 
      ? process.env.ALLOWED_ORIGIN 
      : "http://localhost:5173",
    credentials: true
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(fileUpload());

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

        // تسجيل الطلبات البطيئة
        if (duration > 1000) {
          monitoring.createAlert({
            type: "performance",
            severity: "medium",
            message: `طلب بطيء: ${req.method} ${path} (${duration}ms)`,
            details: {
              method: req.method,
              path,
              duration,
              status: res.statusCode
            }
          });
        }
      }
    });

    next();
  });

  (async () => {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // معالجة مركزية للأخطاء
    app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error("Error:", error);

      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "خطأ في البيانات المدخلة",
          errors: error.errors.map(err => ({
            field: err.path.join("."),
            message: err.message
          }))
        });
      }

      // أخطاء قاعدة البيانات
      if (error.name === "DatabaseError") {
        monitoring.createAlert({
          type: "database",
          severity: "high",
          message: "خطأ في قاعدة البيانات",
          details: { error: error.message }
        });

        return res.status(500).json({
          message: "خطأ في قاعدة البيانات",
          error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
      }

      // أخطاء المصادقة
      if (error.name === "AuthenticationError") {
        monitoring.createAlert({
          type: "security",
          severity: "medium",
          message: "محاولة وصول غير مصرح",
          details: {
            path: req.path,
            ip: req.ip
          }
        });

        return res.status(401).json({
          message: "خطأ في المصادقة",
          error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
      }

      // أخطاء الصلاحيات
      if (error.name === "AuthorizationError") {
        monitoring.createAlert({
          type: "security",
          severity: "high",
          message: "محاولة وصول غير مصرح للموارد",
          details: {
            path: req.path,
            ip: req.ip,
            userId: req.user?.id
          }
        });

        return res.status(403).json({
          message: "لا تملك الصلاحيات الكافية",
          error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
      }

      // أخطاء التحقق
      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: "خطأ في البيانات المدخلة",
          error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
      }

      // الأخطاء العامة
      monitoring.createAlert({
        type: "system",
        severity: "high",
        message: "خطأ غير متوقع في النظام",
        details: {
          error: error.message,
          stack: error.stack
        }
      });

      return res.status(500).json({
        message: "حدث خطأ في النظام",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    });

    // إعداد WebSocket
    setupWebSocket(server);

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
      log(`Worker ${process.pid} is running on port ${port}`);
    });
  })();
}