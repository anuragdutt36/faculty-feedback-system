import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";

// Environment Configuration
import { env } from "./config/env.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { authenticate, authorize } from "./middleware/auth.js";
import { apiLimiter, authLimiter, feedbackLimiter } from "./middleware/rateLimiter.js";

// Controllers
import { SessionsController } from "./controllers/sessions.controller.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import academicRoutes from "./routes/academic.routes.js";
import profilesRoutes from "./routes/profiles.routes.js";
import questionsRoutes from "./routes/questions.routes.js";
import mappingsRoutes from "./routes/mappings.routes.js";
import sessionsRoutes from "./routes/sessions.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import rollMappingRoutes from "./routes/rollMapping.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import platformAdminRoutes from "./routes/platformAdmin.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import publicInstitutionRoutes from "./routes/publicInstitution.routes.js";
import { resolveTenant } from "./middleware/tenantResolver.js";

const app = express();

// Trust proxy for reverse proxies (Render / Cloudflare / Vercel)
app.set("trust proxy", 1);

// Static uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Security HTTP Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com/gsi/client"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com/gsi/style"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://*.googleusercontent.com"],
        connectSrc: ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com", "https://res.cloudinary.com"],
        frameSrc: ["'self'", "https://accounts.google.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: env.isProduction ? [] : null,
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xFrameOptions: { action: "sameorigin" },
    xContentTypeOptions: true,
  })
);

// Secure CORS Whitelist Configuration
const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim().toLowerCase());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (Postman, curl, internal server health checks)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.toLowerCase();

      // In development, allow localhost/127.0.0.1
      if (env.isDevelopment) {
        if (
          normalizedOrigin.startsWith("http://localhost:") ||
          normalizedOrigin.startsWith("http://127.0.0.1:")
        ) {
          return callback(null, true);
        }
      }

      // Check against explicit whitelist
      if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }

      // Allow Vercel preview deployments if configured with wildcard pattern
      const isVercelAllowed = allowedOrigins.some(
        (allowed) => allowed.includes(".vercel.app") && normalizedOrigin.endsWith(".vercel.app")
      );
      if (isVercelAllowed) {
        return callback(null, true);
      }

      return callback(new Error("CORS Policy: Access denied from this origin"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "X-Institution-Id",
      "X-Institution-Slug",
      "x-institution-id",
      "x-institution-slug",
    ],
    maxAge: 86400, // 24 hours preflight cache
  })
);

// Request Logging
if (env.isProduction) {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

// Request Body Parsers with Strict Size Limits
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Prevent NoSQL Query Injection (sanitizes request body, query params, and params)
app.use(mongoSanitize());

// Global API Rate Limiting
app.use("/api", apiLimiter);

// Specific strict rate limits on auth and feedback endpoints
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/google", authLimiter);
app.use("/api/auth/change-password", authLimiter);
app.use("/api/feedback/token", feedbackLimiter);
app.use("/api/feedback/submit", feedbackLimiter);

// Apply Tenant Resolution to All College API Endpoints (Before Route Handlers)
app.use("/api", resolveTenant);

// Mount API Routes
app.use("/api/auth", authRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/profiles", profilesRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/mappings", mappingsRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/roll-mappings", rollMappingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/platform", platformAdminRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/institutions", publicInstitutionRoutes);

// Student active feedback shortcut
app.get(
  "/api/student/active-feedback",
  authenticate,
  authorize("student"),
  SessionsController.getStudentSessions
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Centralized error handling
app.use(errorHandler);

export default app;
