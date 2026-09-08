import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info("MongoDB connected successfully");

    // Clean up legacy conflicting indexes if present
    try {
      const db = mongoose.connection.db;
      if (db) {
        const questionIndexes = await db.collection("questions").indexes();
        const legacyCodeIdx = questionIndexes.find((idx: any) => idx.name === "code_1" && idx.unique);
        if (legacyCodeIdx) {
          await db.collection("questions").dropIndex("code_1");
          logger.info("[DB] Dropped legacy unique index code_1 on questions");
        }
      }
    } catch {
      // index might not exist or collection not yet created
    }
  } catch (error: any) {
    logger.error(`MongoDB connection error: ${error.message}`);
    if (env.MONGO_URI.includes("mongodb+srv://")) {
      logger.error("💡 Tip: For MongoDB Atlas, ensure your current IP is added in Atlas -> Network Access (or allow 0.0.0.0/0).");
    }
    process.exit(1);
  }
};
