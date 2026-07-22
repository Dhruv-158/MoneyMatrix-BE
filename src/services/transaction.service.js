import { Transaction } from "../models/Transaction.js";

export const createTransaction = async (payload, session) => {
  return Transaction.create([{ ...payload }], session ? { session } : undefined).then((res) => res[0]);
};

export const listTransactions = async (filter, options) => {
  console.log("🚀 ~ listTransactions: filter, options", filter, options);
  const query = Transaction.find(filter).sort({ _id: -1 }).skip(options.skip).limit(options.limit);
  return query
    .populate("bankId", "bankName accountType")
    .populate("fromBankId", "bankName accountType")
    .populate("toBankId", "bankName accountType")
    .populate("categoryId", "name");
};

export const countTransactions = async (filter) => {
  return Transaction.countDocuments(filter);
};

export const getRecentTransactions = async (userId, limit = 10) => {
  return Transaction.find({ userId }).sort({ _id: -1 }).limit(limit);
};
