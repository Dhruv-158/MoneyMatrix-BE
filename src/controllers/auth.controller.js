import { asyncHandler } from "../utils/asyncHandler.js";
import { createdResponse, successResponse, errorResponse } from "../utils/response.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { createUser, findUserByEmail, findUserById } from "../services/user.service.js";
import { createBuiltinCategories } from "../services/category.service.js";
import { getOrCreateWallet } from "../services/cash.service.js";
import { startSessionIfEnabled, commitSession, abortSession } from "../utils/transactionSession.js";
import { TelegramCode } from "../models/TelegramCode.js";
import { sendEmail } from "../emails/emailSender.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await findUserByEmail(email);
  if (existing) {
    return errorResponse(res, 409, "Email already exists", { code: "EMAIL_EXISTS" });
  }

  const session = await startSessionIfEnabled();
  try {
    const hashed = await hashPassword(password);
    const user = await createUser({ name, email, password: hashed }, session);
    await getOrCreateWallet(user._id, session);
    await createBuiltinCategories(user._id, session).catch(() => null);
    await commitSession(session);

    const token = signToken({ id: user._id, email: user.email });
    return createdResponse(res, "User registered", { token, user: { id: user._id, name, email } });
  } catch (err) {
    await abortSession(session);
    throw err;
  }
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user) {
    return errorResponse(res, 401, "Invalid credentials", { code: "INVALID_CREDENTIALS" });
  }

  const match = await comparePassword(password, user.password);
  if (!match) {
    return errorResponse(res, 401, "Invalid credentials", { code: "INVALID_CREDENTIALS" });
  }

  const token = signToken({ id: user._id, email: user.email });
  return successResponse(res, "Login successful", {
    token,
    user: { id: user._id, name: user.name, email: user.email, settings: user.settings }
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await findUserByEmail(req.user.email);
  if (!user) {
    return errorResponse(res, 404, "User not found");
  }
  return successResponse(res, "Profile fetched successfully", {
    user: { id: user._id, name: user.name, email: user.email, settings: user.settings }
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, settings } = req.body;
  const user = await findUserByEmail(req.user.email);
  if (!user) {
    return errorResponse(res, 404, "User not found");
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (settings) {
    const currentSettings = user.settings || {
      currency: "INR",
      language: "en",
      theme: "dark",
      notifications: { transactions: true, budgetAlerts: true, billReminders: true, security: true }
    };
    user.settings = {
      currency: settings.currency || currentSettings.currency || "INR",
      language: settings.language || currentSettings.language || "en",
      theme: settings.theme || currentSettings.theme || "dark",
      aiProvider: settings.aiProvider !== undefined ? settings.aiProvider : (currentSettings.aiProvider || "groq"),
      aiApiKey: settings.aiApiKey !== undefined ? settings.aiApiKey : (currentSettings.aiApiKey || ""),
      aiModel: settings.aiModel !== undefined ? settings.aiModel : (currentSettings.aiModel || ""),
      notifications: {
        ...(currentSettings.notifications || {}),
        ...(settings.notifications || {})
      }
    };
  }

  await user.save();

  return successResponse(res, "Settings updated successfully", {
    user: { id: user._id, name: user.name, email: user.email, settings: user.settings }
  });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await findUserByEmail(req.user.email);
  if (!user) {
    return errorResponse(res, 404, "User not found");
  }

  const match = await comparePassword(currentPassword, user.password);
  if (!match) {
    return errorResponse(res, 400, "Current password is incorrect");
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  return successResponse(res, "Password updated successfully");
});

export const generateTelegramCode = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    return errorResponse(res, 404, "User not found");
  }

  // Generate 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  // Clear existing code for this user & save new code
  await TelegramCode.deleteMany({ userId: user._id });
  await TelegramCode.create({ userId: user._id, code, expiresAt });

  // Send email containing the code
  let emailSent = false;
  try {
    await sendEmail({
      to: user.email,
      subject: `Your FinTrack Telegram Linking Code: ${code}`,
      text: `Hello ${user.name},\n\nYour 6-digit verification code to link your Telegram account to FinTrack is: ${code}\n\nThis code will expire in 10 minutes.\n\nTo complete linking, open Telegram and send:\n/start ${code}\n\nBest regards,\nFinTrack Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; color: #0f172a;">
          <h2 style="color: #2563eb;">FinTrack Telegram Linking Code</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Here is your 6-digit verification code to link your Telegram account to FinTrack:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #2563eb; padding: 15px; background: #eff6ff; border-radius: 10px; display: inline-block; margin: 15px 0;">
            ${code}
          </div>
          <p>This code is valid for <strong>10 minutes</strong>.</p>
          <p>To connect, open Telegram and send:</p>
          <code style="background: #e2e8f0; padding: 6px 12px; border-radius: 6px; font-size: 16px;">/start ${code}</code>
          <hr style="margin-top: 30px; border: 0; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 12px; color: #64748b;">If you did not request this code, please ignore this email.</p>
        </div>
      `
    });
    emailSent = true;
  } catch (err) {
    console.warn("Failed to send Telegram code email:", err);
  }

  return successResponse(res, "Telegram linking code generated", {
    code,
    expiresAt,
    emailSent,
    email: user.email
  });
});

export const verifyTelegramCode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return errorResponse(res, 400, "Verification code is required");
  }

  const record = await TelegramCode.findOne({ code });
  if (!record || record.expiresAt < new Date()) {
    return errorResponse(res, 400, "Invalid or expired verification code");
  }

  const user = await findUserById(record.userId);
  if (!user) {
    return errorResponse(res, 404, "User not found");
  }

  // Delete used code
  await TelegramCode.deleteMany({ userId: user._id });

  // Generate JWT token for AI service to store
  const token = signToken({ id: user._id, email: user.email });

  return successResponse(res, "Telegram account linked successfully", {
    user_id: user._id.toString(),
    token
  });
});
