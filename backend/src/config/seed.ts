import mongoose from "mongoose";
import { SeedService } from "../services/seed.service.js";
import { logger } from "../utils/logger.js";
import { env } from "./env.js";

const seedData = async () => {
  try {
    logger.info("Connecting to MongoDB for seeding...");
    await mongoose.connect(env.MONGO_URI);
    logger.info("Connected. Seeding database...");
    
    await SeedService.seedDatabase();
    
    logger.info("Database Seeding Completed Successfully.");
    process.exit(0);
  } catch (error: any) {
    logger.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
