import dotenv from "dotenv";
import path from "path";

// Load .env from backend directory and project root if present
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const isProduction = process.env.NODE_ENV === "production";

// Helper to get environment variable with alias support
function getEnv(primary: string, ...aliases: string[]): string | undefined {
  if (process.env[primary] && process.env[primary]?.trim() !== "") {
    return process.env[primary]?.trim();
  }
  for (const alias of aliases) {
    if (process.env[alias] && process.env[alias]?.trim() !== "") {
      return process.env[alias]?.trim();
    }
  }
  return undefined;
}

// Validate critical secrets
const MONGO_URI = getEnv("MONGO_URI", "MONGODB_URI");
const ACCESS_TOKEN_SECRET = getEnv("ACCESS_TOKEN_SECRET", "JWT_SECRET");
const REFRESH_TOKEN_SECRET = getEnv("REFRESH_TOKEN_SECRET", "JWT_REFRESH_SECRET");

if (isProduction) {
  const missing: string[] = [];
  if (!MONGO_URI) missing.push("MONGO_URI (or MONGODB_URI)");
  if (!ACCESS_TOKEN_SECRET) missing.push("ACCESS_TOKEN_SECRET (or JWT_SECRET)");
  if (!REFRESH_TOKEN_SECRET) missing.push("REFRESH_TOKEN_SECRET (or JWT_REFRESH_SECRET)");

  if (missing.length > 0) {
    console.error(`[FATAL SECURITY ERROR] Missing mandatory production environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  isProduction,
  isDevelopment: !isProduction,
  PORT: parseInt(process.env.PORT || "5001", 10),

  // Database
  MONGO_URI: MONGO_URI || "mongodb://127.0.0.1:27017/knit-feedback",

  // JWT
  ACCESS_TOKEN_SECRET: ACCESS_TOKEN_SECRET || "dev_access_secret_only_for_local_testing",
  REFRESH_TOKEN_SECRET: REFRESH_TOKEN_SECRET || "dev_refresh_secret_only_for_local_testing",
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "7d",

  // Google OAuth
  GOOGLE_CLIENT_ID: getEnv("GOOGLE_CLIENT_ID") || "",
  GOOGLE_CLIENT_SECRET: getEnv("GOOGLE_CLIENT_SECRET") || "",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

  // Default Admin Initialization
  DEFAULT_ADMIN_EMAIL: getEnv("DEFAULT_ADMIN_EMAIL") || "admin@knit.ac.in",
  DEFAULT_ADMIN_PASSWORD: getEnv("DEFAULT_ADMIN_PASSWORD") || "",
  DEFAULT_ADMIN_PASSWORD_HASH: getEnv("DEFAULT_ADMIN_PASSWORD_HASH") || "",

  // Default Platform SuperAdmin Initialization
  DEFAULT_PLATFORM_ADMIN_EMAIL: getEnv("DEFAULT_PLATFORM_ADMIN_EMAIL") || "platform.admin@facultyfeedback.in",
  DEFAULT_PLATFORM_ADMIN_PASSWORD: getEnv("DEFAULT_PLATFORM_ADMIN_PASSWORD") || "PlatformAdmin2026!",

  // Web3Forms API Key for platform email dispatch
  WEB3FORMS_ACCESS_KEY: getEnv("WEB3FORMS_ACCESS_KEY", "WEB3FORMS_KEY") || "",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: getEnv("CLOUDINARY_CLOUD_NAME") || "",
  CLOUDINARY_API_KEY: getEnv("CLOUDINARY_API_KEY") || "",
  CLOUDINARY_API_SECRET: getEnv("CLOUDINARY_API_SECRET") || "",
};
