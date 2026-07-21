import mongoose from "mongoose";
import { env } from "../config/env.js";

export const startSessionIfEnabled = async () => {
  if (!env.enableTransactions) return null;
  const session = await mongoose.startSession();
  session.startTransaction();
  return session;
};

export const commitSession = async (session) => {
  if (!session) return;
  await session.commitTransaction();
  session.endSession();
};

export const abortSession = async (session) => {
  if (!session) return;
  await session.abortTransaction();
  session.endSession();
};
