import { asyncHandler } from "../utils/asyncHandler.js";
import { createdResponse, successResponse, errorResponse } from "../utils/response.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import {
  issueTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens
} from "../utils/jwt.js";
import { createUser, findUserByEmail, findUserById } from "../services/user.service.js";
import { createBuiltinCategories } from "../services/category.service.js";
import { getOrCreateWallet } from "../services/cash.service.js";
import { startSessionIfEnabled, commitSession, abortSession } from "../utils/transactionSession.js";
import { TelegramCode } from "../models/TelegramCode.js";
import { sendEmailNow } from "../emails/emailSender.js";
import crypto from "crypto";
import { encryptSecret, decryptSecret, isEncryptedSecret } from "../utils/secretCrypto.js";

const defaultQuietHours = () => ({
  enabled: false,
  start: "22:00",
  end: "08:00",
  timezone: "Asia/Kolkata"
});

const defaultPrivacy = () => ({
  maskBalances: false,
  hideFriendEmails: false
});

const settingsForClient = (settings) => {
  if (!settings) return settings;
  const plain = typeof settings.toObject === "function" ? settings.toObject() : { ...settings };
  try {
    plain.aiApiKey = decryptSecret(plain.aiApiKey || "");
  } catch {
    plain.aiApiKey = "";
  }
  plain.hasAiApiKey = Boolean(plain.aiApiKey);
  plain.quietHours = { ...defaultQuietHours(), ...(plain.quietHours || {}) };
  plain.privacy = { ...defaultPrivacy(), ...(plain.privacy || {}) };
  plain.reminderLeadDays =
    typeof plain.reminderLeadDays === "number" ? plain.reminderLeadDays : 3;
  plain.currencySymbol = plain.currencySymbol || "";
  plain.recoveryEmail = plain.recoveryEmail || "";
  return plain;
};

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl || "",
  settings: settingsForClient(user.settings)
});

const mergeSettings = (current, incoming = {}) => {
  const cur = current || {};
  const nextApiKey =
    typeof incoming.aiApiKey === "string" && incoming.aiApiKey.trim().length > 0
      ? encryptSecret(incoming.aiApiKey.trim())
      : cur.aiApiKey || "";

  const lead =
    incoming.reminderLeadDays !== undefined
      ? Math.min(14, Math.max(0, Number(incoming.reminderLeadDays) || 0))
      : typeof cur.reminderLeadDays === "number"
        ? cur.reminderLeadDays
        : 3;

  return {
    currency: incoming.currency !== undefined ? incoming.currency : cur.currency || "INR",
    currencySymbol:
      incoming.currencySymbol !== undefined
        ? String(incoming.currencySymbol)
        : cur.currencySymbol || "",
    language: incoming.language !== undefined ? incoming.language : cur.language || "en",
    theme: incoming.theme !== undefined ? incoming.theme : cur.theme || "dark",
    recoveryEmail:
      incoming.recoveryEmail !== undefined
        ? String(incoming.recoveryEmail).trim().toLowerCase()
        : cur.recoveryEmail || "",
    reminderLeadDays: lead,
    quietHours: {
      ...defaultQuietHours(),
      ...(cur.quietHours || {}),
      ...(incoming.quietHours || {})
    },
    privacy: {
      ...defaultPrivacy(),
      ...(cur.privacy || {}),
      ...(incoming.privacy || {})
    },
    aiProvider: incoming.aiProvider !== undefined ? incoming.aiProvider : cur.aiProvider || "groq",
    aiApiKey: nextApiKey,
    aiModel: incoming.aiModel !== undefined ? incoming.aiModel : cur.aiModel || "",
    aiBaseUrl: incoming.aiBaseUrl !== undefined ? incoming.aiBaseUrl : cur.aiBaseUrl || "",
    notifications: {
      ...(cur.notifications || {}),
      ...(incoming.notifications || {})
    }
  };
};

const maybeReencryptStoredKey = async (user) => {
  const raw = user?.settings?.aiApiKey;
  if (!raw || isEncryptedSecret(raw)) return;
  user.settings.aiApiKey = encryptSecret(raw);
  user.markModified("settings");
  await user.save();
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await findUserByEmail(email);
  if (existing) {
    return errorResponse(res, 409, "EMAIL_EXISTS", { code: "EMAIL_EXISTS" });
  }

  const session = await startSessionIfEnabled();
  try {
    const hashed = await hashPassword(password);
    const user = await createUser({ name, email, password: hashed }, session);
    await getOrCreateWallet(user._id, session);
    await createBuiltinCategories(user._id, session).catch(() => null);
    await commitSession(session);

    const tokens = await issueTokenPair(user);
    return createdResponse(res, "User registered", {
      ...tokens,
      user: { id: user._id, name, email }
    });
  } catch (err) {
    await abortSession(session);
    throw err;
  }
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user) {
    return errorResponse(res, 401, "INVALID_CREDENTIALS", { code: "INVALID_CREDENTIALS" });
  }

  const match = await comparePassword(password, user.password);
  if (!match) {
    return errorResponse(res, 401, "INVALID_CREDENTIALS", { code: "INVALID_CREDENTIALS" });
  }

  await maybeReencryptStoredKey(user);

  const tokens = await issueTokenPair(user);
  return successResponse(res, "Login successful", {
    ...tokens,
    user: userPayload(user)
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const raw = req.body?.refreshToken;
  if (!raw) {
    return errorResponse(res, 400, "REFRESH_TOKEN_REQUIRED", { code: "REFRESH_TOKEN_REQUIRED" });
  }
  const tokens = await rotateRefreshToken(raw);
  if (!tokens) {
    return errorResponse(res, 401, "INVALID_TOKEN", { code: "INVALID_TOKEN" });
  }
  return successResponse(res, "Token refreshed", tokens);
});

export const logout = asyncHandler(async (req, res) => {
  const raw = req.body?.refreshToken;
  if (raw) {
    await revokeRefreshToken(raw);
  }
  return successResponse(res, "Logged out");
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await findUserByEmail(req.user.email);
  if (!user) {
    return errorResponse(res, 404, "USER_NOT_FOUND", { code: "USER_NOT_FOUND" });
  }
  await maybeReencryptStoredKey(user);
  return successResponse(res, "Profile fetched successfully", {
    user: userPayload(user)
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, settings } = req.body;
  const user = await findUserByEmail(req.user.email);
  if (!user) {
    return errorResponse(res, 404, "USER_NOT_FOUND", { code: "USER_NOT_FOUND" });
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (settings) {
    user.settings = mergeSettings(user.settings, settings);
    user.markModified("settings");
  }

  await user.save();

  return successResponse(res, "Settings updated successfully", {
    user: userPayload(user)
  });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const user = await findUserByEmail(req.user.email);
  if (!user) {
    return errorResponse(res, 404, "USER_NOT_FOUND", { code: "USER_NOT_FOUND" });
  }
  if (!req.file) {
    return errorResponse(res, 400, "VALIDATION_ERROR", { code: "VALIDATION_ERROR" });
  }

  const relative = `/uploads/avatars/${req.file.filename}`;
  user.avatarUrl = relative;
  await user.save();

  return successResponse(res, "Avatar updated", { user: userPayload(user) });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await findUserByEmail(req.user.email);
  if (!user) {
    return errorResponse(res, 404, "USER_NOT_FOUND", { code: "USER_NOT_FOUND" });
  }

  const match = await comparePassword(currentPassword, user.password);
  if (!match) {
    return errorResponse(res, 400, "PASSWORD_INCORRECT", { code: "PASSWORD_INCORRECT" });
  }

  user.password = await hashPassword(newPassword);
  await user.save();
  await revokeAllRefreshTokens(user._id);

  return successResponse(res, "Password updated successfully");
});

export const generateTelegramCode = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    return errorResponse(res, 404, "USER_NOT_FOUND", { code: "USER_NOT_FOUND" });
  }

  // Opaque 32-hex linking token (emailed only; not returned in API body)
  const code = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await TelegramCode.deleteMany({ userId: user._id });
  await TelegramCode.create({ userId: user._id, code, expiresAt });

  const recovery = (user.settings?.recoveryEmail || "").trim().toLowerCase();
  const mailPayload = {
    to: user.email,
    subject: "Your MoneyMatrix Telegram Linking Code",
    text: `Hello ${user.name},\n\nYour verification code to link your Telegram account to MoneyMatrix is:\n\n${code}\n\nThis code will expire in 10 minutes.\n\nTo complete linking, open Telegram and send:\n/start ${code}\n\nBest regards,\nMoneyMatrix Team`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; color: #0f172a;">
        <h2 style="color: #2563eb;">MoneyMatrix Telegram Linking Code</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Here is your verification code to link your Telegram account:</p>
        <div style="font-size: 18px; font-weight: bold; letter-spacing: 2px; color: #2563eb; padding: 15px; background: #eff6ff; border-radius: 10px; display: inline-block; margin: 15px 0; word-break: break-all;">
          ${code}
        </div>
        <p>This code is valid for <strong>10 minutes</strong>.</p>
        <p>To connect, open Telegram and send:</p>
        <code style="background: #e2e8f0; padding: 6px 12px; border-radius: 6px; font-size: 14px;">/start ${code}</code>
      </div>
    `
  };
  if (recovery && recovery !== user.email.toLowerCase()) {
    mailPayload.cc = recovery;
  }

  let emailSent = false;
  try {
    await sendEmailNow(mailPayload);
    emailSent = true;
  } catch (err) {
    console.warn("Failed to send Telegram code email:", err);
    return errorResponse(res, 500, "EMAIL_FAILED", { code: "EMAIL_FAILED" });
  }

  return successResponse(res, "Telegram linking code emailed", {
    emailed: true,
    emailSent,
    email: user.email,
    recoveryEmailed: Boolean(mailPayload.cc),
    expiresAt
  });
});

export const verifyTelegramCode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return errorResponse(res, 400, "TELEGRAM_CODE_REQUIRED", { code: "TELEGRAM_CODE_REQUIRED" });
  }

  const record = await TelegramCode.findOne({ code });
  if (!record || record.expiresAt < new Date()) {
    return errorResponse(res, 400, "TELEGRAM_CODE_INVALID", { code: "TELEGRAM_CODE_INVALID" });
  }

  const user = await findUserById(record.userId);
  if (!user) {
    return errorResponse(res, 404, "USER_NOT_FOUND", { code: "USER_NOT_FOUND" });
  }

  // Delete used code
  await TelegramCode.deleteMany({ userId: user._id });

  const tokens = await issueTokenPair(user);

  return successResponse(res, "Telegram account linked successfully", {
    user_id: user._id.toString(),
    token: tokens.token,
    refreshToken: tokens.refreshToken
  });
});
