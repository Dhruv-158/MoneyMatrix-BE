import cron from "node-cron";
import { env } from "../config/env.js";
import { runAutoDeductions } from "./autoDeduction.js";
import { runDailySummaryEmails, runMonthlySummaryEmails } from "../emails/summaryCron.js";
import { runMonthlyFriendReminderEmails } from "../emails/friendReminderCron.js";

export const startCronJobs = () => {
  if (env.disableCron) return;
  cron.schedule(env.cronAutoDeduction, async () => {
    await runAutoDeductions();
  });

  if (!env.disableEmailCron) {
    cron.schedule(env.cronDailyEmail, async () => {
      await runDailySummaryEmails();
    });

    cron.schedule(env.cronMonthlyEmail, async () => {
      await runMonthlySummaryEmails();
      await runMonthlyFriendReminderEmails();
    });
  }
};
