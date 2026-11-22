import { createTransaction } from "../services/transaction.service.js";
import { getBankById, updateBankBalance } from "../services/bank.service.js";
import { getOrCreateWallet, updateCashBalance } from "../services/cash.service.js";
import { AppError } from "./AppError.js";

/**
 * Apply an absolute target balance by writing a ledger adjustment transaction
 * and $inc-ing the wallet/bank so balances never diverge from history.
 */
export const applyCashBalanceAdjustment = async (userId, targetBalance, session) => {
  const wallet = await getOrCreateWallet(userId, session);
  const current = wallet.balance || 0;
  const target = Number(targetBalance);
  const delta = target - current;

  if (!Number.isFinite(target) || target < 0) {
    throw new AppError({
      status: 400,
      code: "BAD_REQUEST",
      userMessage: "Balance must be zero or a positive amount.",
      logMessage: `Invalid cash target balance: ${targetBalance}`
    });
  }

  if (delta === 0) return wallet;

  if (delta > 0) {
    await updateCashBalance(userId, delta, session);
    await createTransaction(
      {
        userId,
        type: "income",
        paymentMethod: "cash",
        amount: delta,
        note: "Balance adjustment",
        date: new Date()
      },
      session
    );
  } else {
    const amount = Math.abs(delta);
    await updateCashBalance(userId, -amount, session);
    await createTransaction(
      {
        userId,
        type: "expense",
        paymentMethod: "cash",
        amount,
        note: "Balance adjustment",
        date: new Date()
      },
      session
    );
  }

  return getOrCreateWallet(userId, session);
};

export const applyBankBalanceAdjustment = async (userId, bankId, targetBalance, session) => {
  const bank = await getBankById(bankId, userId, session);
  if (!bank) {
    throw new AppError({
      status: 404,
      code: "BANK_NOT_FOUND",
      logMessage: `Bank not found for balance adjust: ${bankId}`
    });
  }

  const current = bank.currentBalance || 0;
  const target = Number(targetBalance);
  const delta = target - current;

  if (!Number.isFinite(target) || target < 0) {
    throw new AppError({
      status: 400,
      code: "BAD_REQUEST",
      userMessage: "Balance must be zero or a positive amount.",
      logMessage: `Invalid bank target balance: ${targetBalance}`
    });
  }

  if (delta === 0) return bank;

  if (delta > 0) {
    await updateBankBalance(bankId, userId, delta, session);
    await createTransaction(
      {
        userId,
        type: "income",
        paymentMethod: "bank",
        bankId,
        amount: delta,
        note: "Balance adjustment",
        date: new Date()
      },
      session
    );
  } else {
    const amount = Math.abs(delta);
    await updateBankBalance(bankId, userId, -amount, session);
    await createTransaction(
      {
        userId,
        type: "expense",
        paymentMethod: "bank",
        bankId,
        amount,
        note: "Balance adjustment",
        date: new Date()
      },
      session
    );
  }

  return getBankById(bankId, userId, session);
};
