import { CashWallet } from "../models/CashWallet.js";

export const getWalletByUser = async (userId, session) => {
  return CashWallet.findOne({ userId }, null, { session });
};

export const getOrCreateWallet = async (userId, session) => {
  const wallet = await CashWallet.findOne({ userId }, null, { session });
  if (wallet) return wallet;
  return CashWallet.create([{ userId, balance: 0 }], session ? { session } : undefined).then((res) => res[0]);
};

export const updateCashBalance = async (userId, delta, session) => {
  return CashWallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: delta } },
    { new: true, upsert: true, session }
  );
};

export const setCashBalance = async (userId, amount, session) => {
  return CashWallet.findOneAndUpdate(
    { userId },
    { $set: { balance: amount } },
    { new: true, upsert: true, session }
  );
};
