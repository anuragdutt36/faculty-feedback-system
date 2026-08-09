import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

export class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Resource not found (invalid ${err.path})`;
  }

  // Handle Mongoose Duplicate Key Error (11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value entered for ${field}. Please use another value.`;
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((val: any) => val.message)
      .join(", ");
  }

  // Handle JWT errors safely
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Unauthorized: Invalid or expired token";
  }

  // Log error safely without leaking secrets
  logger.error(`[${req.method}] ${req.originalUrl} - ${statusCode} - ${message}`);
  if (err.stack && env.isDevelopment) {
    logger.debug(err.stack);
  }

  // In production, never leak 500 error stack traces or raw database error objects
  const clientMessage = statusCode === 500 && env.isProduction ? "Internal Server Error" : message;

  res.status(statusCode).json(
    ApiResponse.error(
      clientMessage,
      env.isDevelopment ? err.stack : undefined
    )
  );
};
