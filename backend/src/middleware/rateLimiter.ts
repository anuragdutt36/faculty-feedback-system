import { rateLimit } from "express-rate-limit";
import { ApiResponse } from "../utils/apiResponse.js";

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: ApiResponse.error("Too many requests from this IP. Please try again after 15 minutes."),
});

// Strict rate limiter for authentication endpoints (prevent brute-force attacks)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: ApiResponse.error("Too many login attempts. Please try again after 15 minutes for security."),
});

// Strict rate limiter for feedback submission & token generation
export const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit feedback token/submission attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: ApiResponse.error("Too many feedback requests. Please try again shortly."),
});
