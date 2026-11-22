import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/response.js";
import { getOrCreateWallet } from "../services/cash.service.js";
import { applyCashBalanceAdjustment } from "../utils/balanceAdjustment.js";
import { startSessionIfEnabled, commitSession, abortSession } from "../utils/transactionSession.js";

export const getCashWallet = asyncHandler(async (req, res) => {
  const wallet = await getOrCreateWallet(req.user.id);
  return successResponse(res, "Cash wallet fetched", wallet);
});

export const updateCashWallet = asyncHandler(async (req, res) => {
  const { balance } = req.body;
  const session = await startSessionIfEnabled();
  try {
    const wallet = await applyCashBalanceAdjustment(req.user.id, balance, session);
    await commitSession(session);
    return successResponse(res, "Cash wallet updated", wallet);
  } catch (err) {
    await abortSession(session);
    throw err;
  }
});
