import mongoose from "mongoose";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { SeedService } from "./seed/seed.service.js";

// Boot Server
const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Ensure default admin account exists idempotently
  try {
    await SeedService.ensureAdminUser();
  } catch (seedErr: any) {
    logger.warn(`[Init] Admin initialization notice: ${seedErr.message}`);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  // Graceful shutdown handling
  const handleShutdown = async (signal: string) => {
    logger.info(`[Shutdown] Received ${signal}. Closing server gracefully...`);
    server.close(async () => {
      logger.info("[Shutdown] HTTP server closed.");
      try {
        await mongoose.connection.close();
        logger.info("[Shutdown] MongoDB connection closed.");
        process.exit(0);
      } catch (err: any) {
        logger.error(`[Shutdown] Error during DB disconnect: ${err.message}`);
        process.exit(1);
      }
    });

    // Force close after 10 seconds if hanging
    setTimeout(() => {
      logger.error("[Shutdown] Forced shutdown due to timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
};

startServer().catch((error) => {
  logger.error(`Fatal error starting server: ${error.message}`);
  process.exit(1);
});
