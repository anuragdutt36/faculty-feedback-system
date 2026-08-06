import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import mongoSanitize from "express-mongo-sanitize";
import { rateLimit } from "express-rate-limit";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { authenticate, authorize } from "./middleware/auth.js";

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

const app = express();

// Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Request logging
app.use(morgan("dev"));

// Body parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Prevent NoSQL query injection
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter);

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

// Student active feedback shortcut
app.get("/api/student/active-feedback", authenticate, authorize("student"), SessionsController.getStudentSessions);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Centralized error handling
app.use(errorHandler);

export default app;
