import mongoose from "mongoose";
import { AuditLog } from "../models/audit.model.js";
import { logger } from "./logger.js";

interface IAuditOptions {
  userId?: mongoose.Types.ObjectId | string;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  severity?: "info" | "warning" | "critical";
  module?: string;
  metadata?: any;
}

export const logAudit = async (options: IAuditOptions) => {
  try {
    const userIdObj = options.userId
      ? new mongoose.Types.ObjectId(options.userId)
      : undefined;

    await AuditLog.create({
      userId: userIdObj,
      action: options.action,
      details: options.details,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      severity: options.severity || "info",
      module: options.module || "system",
      metadata: options.metadata || {},
    });

    logger.debug(`[AUDIT] Action: ${options.action} - Details: ${options.details}`);
  } catch (error: any) {
    logger.error(`Failed to write audit log: ${error.message}`);
  }
};
