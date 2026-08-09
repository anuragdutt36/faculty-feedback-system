import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info("MongoDB connected successfully");
  } catch (error: any) {
    logger.error(`MongoDB connection error: ${error.message}`);
    if (env.MONGO_URI.includes("mongodb+srv://")) {
      logger.error("💡 Tip: For MongoDB Atlas, ensure your current IP is added in Atlas -> Network Access (or allow 0.0.0.0/0).");
    }
    process.exit(1);
  }
};
