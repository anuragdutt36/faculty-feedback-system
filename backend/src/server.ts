import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { logger } from "./utils/logger.js";

// Load Environment variables
dotenv.config();

const PORT = process.env.PORT || 5001;

// Boot Server
const startServer = async () => {
  // Connect to Database
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`Server is running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });
};

startServer().catch((error) => {
  logger.error(`Error starting server: ${error.message}`);
});
