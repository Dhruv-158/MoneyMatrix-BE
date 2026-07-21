import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const hasSmtpConfig = () => {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
};

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!hasSmtpConfig()) {
    console.warn("SMTP config missing. Skipping email send.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass
    }
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    text,
    html
  });
};
