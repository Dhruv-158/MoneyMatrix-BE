import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/response.js";
import { getOrCreateWallet, setCashBalance } from "../services/cash.service.js";

export const getCashWallet = asyncHandler(async (req, res) => {
  const wallet = await getOrCreateWallet(req.user.id);
  return successResponse(res, "Cash wallet fetched", wallet);
});

export const updateCashWallet = asyncHandler(async (req, res) => {
  const { balance } = req.body;
  const wallet = await setCashBalance(req.user.id, balance);
  return successResponse(res, "Cash wallet updated", wallet);
});
