import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { requestIdMiddleware } from "./middlewares/requestId.js";
import { USER_MESSAGES } from "./utils/userMessages.js";
import mongoose from "mongoose";
import { uploadsRoot } from "./middlewares/avatarUpload.js";

const app = express();

app.use(requestIdMiddleware);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(uploadsRoot));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: USER_MESSAGES.RATE_LIMIT,
    code: "RATE_LIMIT"
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: USER_MESSAGES.RATE_LIMIT,
    code: "RATE_LIMIT"
  }
});

app.use(globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/verify-telegram-code", authLimiter);

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "MoneyMatrix API" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.get("/health/ready", async (req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  if (!mongoOk) {
    return res.status(503).json({
      success: false,
      status: "not_ready",
      checks: { mongo: false }
    });
  }
  try {
    await mongoose.connection.db.admin().ping();
    return res.status(200).json({
      success: true,
      status: "ready",
      checks: { mongo: true }
    });
  } catch {
    return res.status(503).json({
      success: false,
      status: "not_ready",
      checks: { mongo: false }
    });
  }
});

app.use("/api", routes);

app.use(errorHandler);

export default app;
