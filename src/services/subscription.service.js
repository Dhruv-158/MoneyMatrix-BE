import { Subscription } from "../models/Subscription.js";

export const createSubscription = async (payload, session) => {
  return Subscription.create([{ ...payload }], session ? { session } : undefined).then((res) => res[0]);
};

export const getSubscriptions = async (userId) => {
  return Subscription.find({ userId }).sort({ nextDueDate: 1 });
};

export const updateSubscription = async (subscriptionId, userId, payload) => {
  return Subscription.findOneAndUpdate({ _id: subscriptionId, userId }, payload, { new: true });
};

export const deleteSubscription = async (subscriptionId, userId) => {
  return Subscription.findOneAndDelete({ _id: subscriptionId, userId });
};

export const toggleSubscription = async (subscriptionId, userId, isActive) => {
  return Subscription.findOneAndUpdate({ _id: subscriptionId, userId }, { isActive }, { new: true });
};

export const getDueSubscriptions = async (beforeDate) => {
  return Subscription.find({ isActive: true, nextDueDate: { $lte: beforeDate } }).sort({ nextDueDate: 1 });
};

export const updateSubscriptionAfterProcess = async (subscriptionId, payload, session) => {
  return Subscription.findOneAndUpdate(
    { _id: subscriptionId },
    payload,
    { new: true, session }
  );
};
