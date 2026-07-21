import { asyncHandler } from "../utils/asyncHandler.js";
import { createdResponse, successResponse, errorResponse } from "../utils/response.js";
import { createBank, getBanks, getBankById, updateBank, deleteBank } from "../services/bank.service.js";
import { resolveIconFields } from "../utils/iconResolver.js";

export const createBankController = asyncHandler(async (req, res) => {
  const iconFields = resolveIconFields({
    title: req.body.bankName,
    iconUrl: req.body.iconUrl,
    imageUrl: req.body.imageUrl
  });
  const payload = { ...req.body, ...iconFields, userId: req.user.id };
  const bank = await createBank(payload);
  return createdResponse(res, "Bank created", bank);
});

export const getBanksController = asyncHandler(async (req, res) => {
  const banks = await getBanks(req.user.id);
  return successResponse(res, "Banks fetched", banks);
});

export const updateBankController = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.body.iconUrl || req.body.imageUrl || req.body.bankName) {
    const iconFields = resolveIconFields({
      title: req.body.bankName,
      iconUrl: req.body.iconUrl,
      imageUrl: req.body.imageUrl
    });
    updates.iconUrl = iconFields.iconUrl;
    updates.imageUrl = iconFields.imageUrl;
  }
  const bank = await updateBank(req.params.id, req.user.id, updates);
  if (!bank) {
    return errorResponse(res, 404, "Bank not found", { code: "BANK_NOT_FOUND" });
  }
  return successResponse(res, "Bank updated", bank);
});

export const deleteBankController = asyncHandler(async (req, res) => {
  const bank = await deleteBank(req.params.id, req.user.id);
  if (!bank) {
    return errorResponse(res, 404, "Bank not found", { code: "BANK_NOT_FOUND" });
  }
  return successResponse(res, "Bank deleted", bank);
});

export const getBankController = asyncHandler(async (req, res) => {
  const bank = await getBankById(req.params.id, req.user.id);
  if (!bank) {
    return errorResponse(res, 404, "Bank not found", { code: "BANK_NOT_FOUND" });
  }
  return successResponse(res, "Bank fetched", bank);
});
