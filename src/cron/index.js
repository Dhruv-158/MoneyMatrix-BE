import cron from "node-cron";
import { env } from "../config/env.js";
import { runAutoDeductions } from "./autoDeduction.js";
import { runDailySummaryEmails, runMonthlySummaryEmails } from "../emails/summaryCron.js";
import { runMonthlyFriendReminderEmails } from "../emails/friendReminderCron.js";
import { withCronLock } from "../utils/cronLock.js";
import { notifyMonitoring } from "../utils/monitoring.js";
import { logger } from "../utils/logger.js";

const runLockedJob = (name, ttlSeconds, fn) => async () => {
  try {
    const outcome = await withCronLock(name, ttlSeconds, fn);
    if (!outcome.ran) {
      logger.info("cron_skipped_lock", { name });
      return;
    }
    logger.info("cron_ok", { name });
  } catch (err) {
    logger.error("cron_failed", { name, error: err?.message || String(err) });
    await notifyMonitoring({
      event: "cron_failure",
      message: `Cron job failed: ${name}`,
      meta: { name, error: err?.message || String(err) }
    });
  }
};

export const startCronJobs = () => {
  if (env.disableCron) {
    logger.info("cron_disabled", { reason: "DISABLE_CRON=true" });
    return;
  }

  cron.schedule(
    env.cronAutoDeduction,
    runLockedJob("auto_deduction", 50 * 60, runAutoDeductions)
  );

  if (!env.disableEmailCron) {
    cron.schedule(
      env.cronDailyEmail,
      runLockedJob("daily_summary_email", 50 * 60, runDailySummaryEmails)
    );

    cron.schedule(
      env.cronMonthlyEmail,
      runLockedJob("monthly_email", 50 * 60, async () => {
        await runMonthlySummaryEmails();
        await runMonthlyFriendReminderEmails();
      })
    );
  }

  logger.info("cron_started", {
    autoDeduction: env.cronAutoDeduction,
    emailCron: !env.disableEmailCron
  });
};
