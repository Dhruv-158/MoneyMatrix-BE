import { EmiPayment } from "../models/EmiPayment.js";

export const createEmi = async (payload, session) => {
  return EmiPayment.create([{ ...payload }], session ? { session } : undefined).then((res) => res[0]);
};

export const getEmis = async (userId) => {
  return EmiPayment.find({ userId }).sort({ nextDueDate: 1 });
};

export const updateEmi = async (emiId, userId, payload) => {
  return EmiPayment.findOneAndUpdate({ _id: emiId, userId }, payload, { new: true });
};

export const deleteEmi = async (emiId, userId) => {
  return EmiPayment.findOneAndDelete({ _id: emiId, userId });
};

export const toggleEmi = async (emiId, userId, isActive) => {
  return EmiPayment.findOneAndUpdate({ _id: emiId, userId }, { isActive }, { new: true });
};

export const getDueEmis = async (beforeDate) => {
  return EmiPayment.find({ isActive: true, nextDueDate: { $lte: beforeDate } }).sort({ nextDueDate: 1 });
};

export const updateEmiAfterProcess = async (emiId, payload, session) => {
  return EmiPayment.findOneAndUpdate(
    { _id: emiId },
    payload,
    { new: true, session }
  );
};
