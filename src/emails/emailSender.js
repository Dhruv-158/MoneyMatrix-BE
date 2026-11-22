import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const hasSmtpConfig = () => {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
};

let transporter = null;
const queue = [];
let processing = false;

const getTransporter = () => {
  if (!hasSmtpConfig()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass
      }
    });
  }
  return transporter;
};

const sendEmailDirect = async ({ to, cc, subject, text, html }) => {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn("SMTP config missing. Skipping email send.");
    return;
  }

  await mailer.sendMail({
    from: env.smtp.from,
    to,
    ...(cc ? { cc } : {}),
    subject,
    text,
    html
  });
};

const processQueue = async () => {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const job = queue.shift();
    try {
      await sendEmailDirect(job);
    } catch (err) {
      console.error("Email job failed:", err?.message || err);
    }
  }
  processing = false;
};

/**
 * Enqueue email for sequential background delivery (in-process queue).
 * Callers should not await delivery latency-sensitive paths.
 */
export const sendEmail = async (payload) => {
  queue.push(payload);
  // Fire-and-forget processor
  setImmediate(() => {
    processQueue().catch((err) => console.error("Email queue error:", err));
  });
};

export const sendEmailNow = sendEmailDirect;
