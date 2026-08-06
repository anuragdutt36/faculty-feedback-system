/**
 * Session Auto-Close Job
 *
 * Automatically updates feedback session statuses based on their configured
 * startDate and endDate when the `autoActivateBasedOnDate` setting is enabled.
 *
 * - Scheduled sessions become "active" when startDate is reached.
 * - Active sessions become "closed" when endDate has passed.
 * - Fires student notifications on status transitions.
 *
 * This job is invoked inline on every session list request and can also be
 * triggered independently as a scheduled background task.
 */

import { SessionsService } from "../services/sessions.service.js";
import { logger } from "../utils/logger.js";

/**
 * Runs the auto-update routine for all scheduled/active feedback sessions.
 * Can be called on a cron schedule or triggered manually.
 */
export async function runSessionAutoCloseJob(): Promise<void> {
  try {
    logger.info("[SessionAutoCloseJob] Running session status auto-update...");
    await SessionsService.autoUpdateSessionStatuses();
    logger.info("[SessionAutoCloseJob] Session statuses updated.");
  } catch (error: any) {
    logger.error(`[SessionAutoCloseJob] Failed: ${error.message}`);
  }
}
