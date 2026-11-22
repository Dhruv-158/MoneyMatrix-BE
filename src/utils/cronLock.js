import crypto from "crypto";
import { CronLock } from "../models/CronLock.js";
import { logger } from "./logger.js";

const INSTANCE_ID = process.env.HOSTNAME || crypto.randomBytes(4).toString("hex");

/**
 * Claim a Mongo leader lock, run fn, then release (or let TTL expire).
 * Returns { ran: false } if another instance holds the lock.
 */
export const withCronLock = async (name, ttlSeconds, fn) => {
  const owner = `${INSTANCE_ID}:${process.pid}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  let lock = await CronLock.findOneAndUpdate(
    { name, expiresAt: { $lte: now } },
    { $set: { owner, expiresAt } },
    { new: true }
  );

  if (!lock) {
    try {
      lock = await CronLock.create({ name, owner, expiresAt });
    } catch (err) {
      if (err?.code === 11000) {
        logger.info("cron_lock_skip", { name, owner, reason: "held_by_other" });
        return { ran: false };
      }
      throw err;
    }
  }

  try {
    const result = await fn();
    return { ran: true, result };
  } finally {
    await CronLock.deleteOne({ name, owner }).catch(() => {});
  }
};
