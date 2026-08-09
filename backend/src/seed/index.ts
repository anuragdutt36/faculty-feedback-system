/**
 * Seed Entry Point
 * Run with: npm run seed
 * Seeds the database with realistic KNIT Sultanpur sample data.
 */

import mongoose from "mongoose";
import { SeedService } from "./seed.service.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

const seedData = async () => {
  try {
    logger.info("Connecting to MongoDB for seeding...");
    await mongoose.connect(env.MONGO_URI);
    logger.info("Connected. Seeding database with KNIT Sultanpur master data...");

    await SeedService.seedDatabase();

    logger.info("✅ Database seeding completed successfully.");
    process.exit(0);
  } catch (error: any) {
    logger.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
