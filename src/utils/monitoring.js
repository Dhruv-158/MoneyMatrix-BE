import { env } from "../config/env.js";
import { logger } from "./logger.js";

const fiveXxWindow = [];
let lastFiveXxAlertAt = 0;

export const notifyMonitoring = async ({ event, message, requestId, meta = {} }) => {
  const payload = {
    service: "moneymatrix-be",
    event,
    message,
    requestId: requestId || null,
    meta,
    time: new Date().toISOString()
  };

  logger.error("monitoring_event", payload);

  if (!env.monitoringWebhookUrl) return;

  try {
    await fetch(env.monitoringWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    logger.error("monitoring_webhook_failed", { error: err?.message || String(err) });
  }
};

/** Track 5xx responses; alert when ≥10 in 5 minutes (at most once per window). */
export const trackServerError = async (requestId, path, status) => {
  const now = Date.now();
  fiveXxWindow.push(now);
  while (fiveXxWindow.length && fiveXxWindow[0] < now - 5 * 60 * 1000) {
    fiveXxWindow.shift();
  }

  if (fiveXxWindow.length >= 10 && now - lastFiveXxAlertAt > 5 * 60 * 1000) {
    lastFiveXxAlertAt = now;
    await notifyMonitoring({
      event: "elevated_5xx",
      message: `Elevated 5xx rate: ${fiveXxWindow.length} in 5m`,
      requestId,
      meta: { path, status, count: fiveXxWindow.length }
    });
  }
};
