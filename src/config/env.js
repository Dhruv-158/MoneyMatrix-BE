import dotenv from "dotenv";

dotenv.config();

const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.log(`Error: Missing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                required environment variable ===========> ${key}`);
    throw new Error(`Missing required env: ${key}`);
  }
});

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI,
  enableTransactions: process.env.ENABLE_TRANSACTIONS !== "false",
  enableIconFetch: process.env.ENABLE_ICON_FETCH !== "false",
  defaultIconUrl: process.env.DEFAULT_ICON_URL || "",
  defaultImageUrl: process.env.DEFAULT_IMAGE_URL || "",
  cronAutoDeduction: process.env.CRON_AUTO_DEDUCTION || "0 2 * * *",
  disableCron: process.env.DISABLE_CRON === "true",
  cronDailyEmail: process.env.CRON_DAILY_EMAIL || "0 8 * * *",
  cronMonthlyEmail: process.env.CRON_MONTHLY_EMAIL || "0 9 1 * *",
  disableEmailCron: process.env.DISABLE_EMAIL_CRON === "true",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || "Expense Tracker <no-reply@example.com>"
  }
};
