import mongoose from "mongoose";
import dotenv from "dotenv";
import { SeedService } from "../services/seed.service.js";
import { logger } from "../utils/logger.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/knit-feedback";

const seedData = async () => {
  try {
    logger.info("Connecting to MongoDB for seeding...");
    await mongoose.connect(MONGO_URI);
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
