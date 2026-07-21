import { asyncHandler } from "../utils/asyncHandler.js";
import { createdResponse, successResponse, errorResponse } from "../utils/response.js";
import { createEmi, getEmis, updateEmi, deleteEmi, toggleEmi } from "../services/emi.service.js";
import { resolveIconFields } from "../utils/iconResolver.js";

export const createEmiController = asyncHandler(async (req, res) => {
  if (req.body.paymentMethod === "bank" && !req.body.bankId) {
    return errorResponse(res, 400, "bankId is required for bank payments", { code: "BANK_REQUIRED" });
  }
  const iconFields = resolveIconFields({
    title: req.body.title,
    iconUrl: req.body.iconUrl,
    imageUrl: req.body.imageUrl
  });
  const emi = await createEmi({ ...req.body, ...iconFields, userId: req.user.id });
  return createdResponse(res, "EMI created", emi);
});

export const getEmisController = asyncHandler(async (req, res) => {
  const emis = await getEmis(req.user.id);
  return successResponse(res, "EMIs fetched", emis);
});

export const updateEmiController = asyncHandler(async (req, res) => {
  if (req.body.paymentMethod === "bank" && !req.body.bankId) {
    return errorResponse(res, 400, "bankId is required for bank payments", { code: "BANK_REQUIRED" });
  }
  const updates = { ...req.body };
  if (req.body.iconUrl || req.body.imageUrl || req.body.title) {
    const iconFields = resolveIconFields({
      title: req.body.title,
      iconUrl: req.body.iconUrl,
      imageUrl: req.body.imageUrl
    });
    updates.iconUrl = iconFields.iconUrl;
    updates.imageUrl = iconFields.imageUrl;
  }
  const emi = await updateEmi(req.params.id, req.user.id, updates);
  if (!emi) {
    return errorResponse(res, 404, "EMI not found", { code: "EMI_NOT_FOUND" });
  }
  return successResponse(res, "EMI updated", emi);
});

export const deleteEmiController = asyncHandler(async (req, res) => {
  const emi = await deleteEmi(req.params.id, req.user.id);
  if (!emi) {
    return errorResponse(res, 404, "EMI not found", { code: "EMI_NOT_FOUND" });
  }
  return successResponse(res, "EMI deleted", emi);
});

export const toggleEmiController = asyncHandler(async (req, res) => {
  const emi = await toggleEmi(req.params.id, req.user.id, req.body.isActive);
  if (!emi) {
    return errorResponse(res, 404, "EMI not found", { code: "EMI_NOT_FOUND" });
  }
  return successResponse(res, "EMI status updated", emi);
});
