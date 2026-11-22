import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";
import { RefreshToken } from "../models/RefreshToken.js";

export const signAccessToken = (payload) => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
};

/** @deprecated use signAccessToken */
export const signToken = signAccessToken;

export const verifyToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const refreshExpiresMs = () => {
  const raw = env.jwtRefreshExpiresIn || "30d";
  const match = /^(\d+)([smhd])$/i.exec(String(raw).trim());
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const n = Number(match[1]);
  const unit = match[2].toLowerCase();
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] || 86_400_000;
  return n * mult;
};

export const issueTokenPair = async (user) => {
  const payload = { id: user._id || user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = crypto.randomBytes(48).toString("hex");
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + refreshExpiresMs());

  await RefreshToken.create({
    userId: payload.id,
    tokenHash,
    expiresAt
  });

  return { token: accessToken, refreshToken };
};

export const rotateRefreshToken = async (rawRefreshToken) => {
  if (!rawRefreshToken) return null;
  const tokenHash = hashToken(rawRefreshToken);
  const existing = await RefreshToken.findOne({ tokenHash, revokedAt: null });
  if (!existing || existing.expiresAt < new Date()) {
    return null;
  }

  existing.revokedAt = new Date();
  await existing.save();

  const userId = existing.userId;
  const { User } = await import("../models/User.js");
  const user = await User.findById(userId);
  if (!user) return null;

  return issueTokenPair(user);
};

export const revokeRefreshToken = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
};

export const revokeAllRefreshTokens = async (userId) => {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};
