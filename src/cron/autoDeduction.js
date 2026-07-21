import { calculateNextDueDate } from "../utils/nextDueDate.js";
import { startSessionIfEnabled, commitSession, abortSession } from "../utils/transactionSession.js";
import { createTransaction } from "../services/transaction.service.js";
import { getBankById, updateBankBalance } from "../services/bank.service.js";
import { getOrCreateWallet, updateCashBalance } from "../services/cash.service.js";
import { getDueSubscriptions, updateSubscriptionAfterProcess } from "../services/subscription.service.js";
import { getDueEmis, updateEmiAfterProcess } from "../services/emi.service.js";

const ensureSufficientBalance = (current, amount) => {
  if (current < amount) {
    const err = new Error("Insufficient balance");
    err.status = 400;
    throw err;
  }
};

const processItem = async (item, sourceType) => {
  const session = await startSessionIfEnabled();
  try {
    if (item.paymentMethod === "bank") {
      if (!item.bankId) throw new Error("Bank is required for bank payments");
      const bank = await getBankById(item.bankId, item.userId, session);
      if (!bank) throw new Error("Bank not found");
      ensureSufficientBalance(bank.currentBalance, item.amount);
      await updateBankBalance(item.bankId, item.userId, -item.amount, session);
    } else {
      const wallet = await getOrCreateWallet(item.userId, session);
      ensureSufficientBalance(wallet.balance, item.amount);
      await updateCashBalance(item.userId, -item.amount, session);
    }

    await createTransaction(
      {
        userId: item.userId,
        type: "expense",
        paymentMethod: item.paymentMethod,
        bankId: item.bankId,
        categoryId: item.categoryId,
        amount: item.amount,
        note: item.note || `${sourceType.toUpperCase()}: ${item.title}`,
        date: item.nextDueDate,
        sourceType,
        sourceId: item._id
      },
      session
    );

    const nextDueDate = calculateNextDueDate(item.nextDueDate, item.frequency) || item.nextDueDate;
    const updatePayload = { nextDueDate, lastProcessedAt: new Date() };

    if (sourceType === "subscription") {
      await updateSubscriptionAfterProcess(item._id, updatePayload, session);
    } else {
      await updateEmiAfterProcess(item._id, updatePayload, session);
    }

    await commitSession(session);
  } catch (err) {
    await abortSession(session);
    console.warn(`Auto-deduction skipped for ${sourceType} ${item._id}: ${err.message}`);
  }
};

export const runAutoDeductions = async () => {
  const now = new Date();
  const [subscriptions, emis] = await Promise.all([
    getDueSubscriptions(now),
    getDueEmis(now)
  ]);

  for (const item of subscriptions) {
    await processItem(item, "subscription");
  }
  for (const item of emis) {
    await processItem(item, "emi");
  }
};
