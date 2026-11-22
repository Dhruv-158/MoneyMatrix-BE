import { asyncHandler } from "../utils/asyncHandler.js";
import { createdResponse, successResponse, errorResponse } from "../utils/response.js";
import { createBank, getBanks, getBankById, updateBank, deleteBank } from "../services/bank.service.js";
import { resolveIconFields } from "../utils/iconResolver.js";
import { Transaction } from "../models/Transaction.js";
import { applyBankBalanceAdjustment } from "../utils/balanceAdjustment.js";
import { startSessionIfEnabled, commitSession, abortSession } from "../utils/transactionSession.js";

export const createBankController = asyncHandler(async (req, res) => {
  const iconFields = resolveIconFields({
    title: req.body.bankName,
    iconUrl: req.body.iconUrl,
    imageUrl: req.body.imageUrl
  });
  const payload = { ...req.body, ...iconFields, userId: req.user.id };
  const bank = await createBank(payload);
  if (payload.currentBalance > 0) {
    await Transaction.create({
      userId: req.user.id,
      type: "income",
      paymentMethod: "bank",
      bankId: bank._id,
      amount: payload.currentBalance,
      note: "Initial balance",
      date: new Date()
    });
  }
  return createdResponse(res, "Bank created", bank);
});

export const getBanksController = asyncHandler(async (req, res) => {
  const banks = await getBanks(req.user.id);
  return successResponse(res, "Banks fetched", banks);
});

export const updateBankController = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  const requestedBalance =
    updates.currentBalance !== undefined && updates.currentBalance !== null
      ? Number(updates.currentBalance)
      : null;
  delete updates.currentBalance;

  if (req.body.iconUrl || req.body.imageUrl || req.body.bankName) {
    const iconFields = resolveIconFields({
      title: req.body.bankName,
      iconUrl: req.body.iconUrl,
      imageUrl: req.body.imageUrl
    });
    updates.iconUrl = iconFields.iconUrl;
    updates.imageUrl = iconFields.imageUrl;
  }

  const session = await startSessionIfEnabled();
  try {
    let bank = await updateBank(req.params.id, req.user.id, updates, session);
    if (!bank) {
      await abortSession(session);
      return errorResponse(res, 404, "BANK_NOT_FOUND", { code: "BANK_NOT_FOUND" });
    }

    if (requestedBalance !== null && Number.isFinite(requestedBalance)) {
      bank = await applyBankBalanceAdjustment(
        req.user.id,
        req.params.id,
        requestedBalance,
        session
      );
    }

    await commitSession(session);
    return successResponse(res, "Bank updated", bank);
  } catch (err) {
    await abortSession(session);
    throw err;
  }
});

export const deleteBankController = asyncHandler(async (req, res) => {
  const bank = await deleteBank(req.params.id, req.user.id);
  if (!bank) {
    return errorResponse(res, 404, "BANK_NOT_FOUND", { code: "BANK_NOT_FOUND" });
  }
  return successResponse(res, "Bank deleted", bank);
});

export const getBankController = asyncHandler(async (req, res) => {
  const bank = await getBankById(req.params.id, req.user.id);
  if (!bank) {
    return errorResponse(res, 404, "BANK_NOT_FOUND", { code: "BANK_NOT_FOUND" });
  }
  return successResponse(res, "Bank fetched", bank);
});
