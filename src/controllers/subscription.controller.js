import { asyncHandler } from "../utils/asyncHandler.js";
import { createdResponse, successResponse, errorResponse } from "../utils/response.js";
import {
  createSubscription,
  getSubscriptions,
  updateSubscription,
  deleteSubscription,
  toggleSubscription
} from "../services/subscription.service.js";
import { resolveIconFields } from "../utils/iconResolver.js";

export const createSubscriptionController = asyncHandler(async (req, res) => {
  if (req.body.paymentMethod === "bank" && !req.body.bankId) {
    return errorResponse(res, 400, "bankId is required for bank payments", { code: "BANK_REQUIRED" });
  }
  const iconFields = resolveIconFields({
    title: req.body.title,
    iconUrl: req.body.iconUrl,
    imageUrl: req.body.imageUrl
  });
  const subscription = await createSubscription({ ...req.body, ...iconFields, userId: req.user.id });
  return createdResponse(res, "Subscription created", subscription);
});

export const getSubscriptionsController = asyncHandler(async (req, res) => {
  const subscriptions = await getSubscriptions(req.user.id);
  return successResponse(res, "Subscriptions fetched", subscriptions);
});

export const updateSubscriptionController = asyncHandler(async (req, res) => {
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
  const subscription = await updateSubscription(req.params.id, req.user.id, updates);
  if (!subscription) {
    return errorResponse(res, 404, "Subscription not found", { code: "SUBSCRIPTION_NOT_FOUND" });
  }
  return successResponse(res, "Subscription updated", subscription);
});

export const deleteSubscriptionController = asyncHandler(async (req, res) => {
  const subscription = await deleteSubscription(req.params.id, req.user.id);
  if (!subscription) {
    return errorResponse(res, 404, "Subscription not found", { code: "SUBSCRIPTION_NOT_FOUND" });
  }
  return successResponse(res, "Subscription deleted", subscription);
});

export const toggleSubscriptionController = asyncHandler(async (req, res) => {
  const subscription = await toggleSubscription(req.params.id, req.user.id, req.body.isActive);
  if (!subscription) {
    return errorResponse(res, 404, "Subscription not found", { code: "SUBSCRIPTION_NOT_FOUND" });
  }
  return successResponse(res, "Subscription status updated", subscription);
});
