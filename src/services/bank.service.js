import { Bank } from "../models/Bank.js";

export const createBank = async (payload, session) => {
  return Bank.create([{ ...payload }], session ? { session } : undefined).then((res) => res[0]);
};

export const getBanks = async (userId) => {
  return Bank.find({ userId }).sort({ createdAt: -1 });
};

export const getBankById = async (bankId, userId, session) => {
  return Bank.findOne({ _id: bankId, userId }, null, session ? { session } : undefined);
};

export const updateBank = async (bankId, userId, payload, session) => {
  return Bank.findOneAndUpdate({ _id: bankId, userId }, payload, { new: true, session });
};

export const deleteBank = async (bankId, userId, session) => {
  return Bank.findOneAndDelete({ _id: bankId, userId }, { session });
};

export const updateBankBalance = async (bankId, userId, delta, session) => {
  return Bank.findOneAndUpdate(
    { _id: bankId, userId },
    { $inc: { currentBalance: delta } },
    { new: true, session }
  );
};

export const getBanksByIds = async (userId, ids, session) => {
  return Bank.find({ userId, _id: { $in: ids } }, null, { session });
};

export const getBankBalances = async (userId) => {
  return Bank.find({ userId }).select("bankName currentBalance accountType color icon");
};
