import { asyncHandler } from "../utils/asyncHandler.js";
import { createdResponse, successResponse } from "../utils/response.js";
import { getPagination } from "../utils/pagination.js";
import { createTransaction, listTransactions, countTransactions } from "../services/transaction.service.js";
import { getBankById, updateBankBalance } from "../services/bank.service.js";
import { getOrCreateWallet, updateCashBalance } from "../services/cash.service.js";
import { startSessionIfEnabled, commitSession, abortSession } from "../utils/transactionSession.js";

const ensureSufficientBalance = (current, amount) => {
  if (current < amount) {
    const err = new Error("Insufficient balance");
    err.status = 400;
    throw err;
  }
};

const throwNotFound = (message) => {
  const err = new Error(message);
  err.status = 404;
  throw err;
};

const throwBadRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  throw err;
};

export const createTransactionController = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    type,
    paymentMethod,
    bankId,
    categoryId,
    amount,
    note,
    transferType,
    fromBankId,
    toBankId,
    date
  } = req.body;

  let finalNote = note;
  let finalBankId = bankId;
  let finalPaymentMethod = paymentMethod;

  const session = await startSessionIfEnabled();

  try {
    if (type === "transfer") {
      if (!transferType) {
        throwBadRequest("Transfer type is required");
      }
      if (transferType === "bank_to_cash") {
        if (!fromBankId) throwBadRequest("fromBankId is required");
        const fromBank = await getBankById(fromBankId, userId, session);
        if (!fromBank) throwNotFound("Bank not found");
        ensureSufficientBalance(fromBank.currentBalance, amount);
        await updateBankBalance(fromBankId, userId, -amount, session);
        await updateCashBalance(userId, amount, session);
        finalBankId = fromBankId;
        finalNote = note || `₹${amount} withdrawn from ${fromBank.bankName} to Cash`;
      }

      if (transferType === "cash_to_bank") {
        if (!toBankId) throwBadRequest("toBankId is required");
        const wallet = await getOrCreateWallet(userId, session);
        ensureSufficientBalance(wallet.balance, amount);
        const toBank = await getBankById(toBankId, userId, session);
        if (!toBank) throwNotFound("Bank not found");
        await updateCashBalance(userId, -amount, session);
        await updateBankBalance(toBankId, userId, amount, session);
        finalPaymentMethod = "cash";
        finalBankId = "cash";
        finalNote = note || `₹${amount} deposited to ${toBank.bankName} from Cash`;
      }

      if (transferType === "bank_to_bank") {
        if (!fromBankId || !toBankId) throwBadRequest("fromBankId and toBankId are required");
        if (fromBankId === toBankId) {
          throwBadRequest("Banks must be different");
        }
        const fromBank = await getBankById(fromBankId, userId, session);
        const toBank = await getBankById(toBankId, userId, session);
        if (!fromBank || !toBank) throwNotFound("Bank not found");
        ensureSufficientBalance(fromBank.currentBalance, amount);
        await updateBankBalance(fromBankId, userId, -amount, session);
        await updateBankBalance(toBankId, userId, amount, session);
        finalBankId = toBankId;
        finalNote = note || `₹${amount} transferred from ${fromBank.bankName} to ${toBank.bankName}`;
      }
    }

    if (type === "expense") {
      if (!paymentMethod) {
        throwBadRequest("Payment method is required");
      }
      if (paymentMethod === "bank") {
        if (!bankId) throwBadRequest("bankId is required");
        const bank = await getBankById(bankId, userId, session);
        if (!bank) throwNotFound("Bank not found");
        ensureSufficientBalance(bank.currentBalance, amount);
        await updateBankBalance(bankId, userId, -amount, session);
      }

      if (paymentMethod === "cash") {
        const wallet = await getOrCreateWallet(userId, session);
        ensureSufficientBalance(wallet.balance, amount);
        await updateCashBalance(userId, -amount, session);
      }
    }

    if (type === "income") {
      if (!paymentMethod) {
        throwBadRequest("Payment method is required");
      }
      if (paymentMethod === "bank") {
        if (!bankId) throwBadRequest("bankId is required");
        const bank = await getBankById(bankId, userId, session);
        if (!bank) throwNotFound("Bank not found");
        await updateBankBalance(bankId, userId, amount, session);
      }

      if (paymentMethod === "cash") {
        await updateCashBalance(userId, amount, session);
      }
    }

    const transaction = await createTransaction(
      {
        userId,
        type,
        paymentMethod: finalPaymentMethod,
        bankId: finalBankId,
        categoryId,
        amount,
        note: finalNote,
        transferType,
        fromBankId,
        toBankId,
        date
      },
      session
    );

    await commitSession(session);

    // Populate related fields to match listTransactionsController response
    await transaction.populate([
      { path: "bankId", select: "bankName accountType" },
      { path: "categoryId", select: "name" }
    ]);

    return createdResponse(res, "Transaction created", transaction);
  } catch (err) {
    await abortSession(session);
    throw err;
  }
});

export const listTransactionsController = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page, limit, skip } = getPagination(req.query);

  const filter = { userId };
  if (req.query.type) {
    if (req.query.type === 'income') {
      // Income includes real income OR transfer inflows (e.g. Bank -> Cash withdrawals)
      filter.$or = [
        { type: 'income' },
        { type: 'transfer', transferType: 'bank_to_cash' }
      ];
    } else {
      filter.type = req.query.type;
    }
  }

  if (req.query.bankId) {
    if (req.query.bankId === 'cash') {
      filter.$or = [
        { paymentMethod: 'cash' },
        { transferType: 'bank_to_cash' },
        { transferType: 'cash_to_bank' }
      ];
    } else {
      filter.$or = [
        { bankId: req.query.bankId },
        { fromBankId: req.query.bankId },
        { toBankId: req.query.bankId }
      ];
    }
  }

  // Handle date filtering with month and year support
  filter.date = {};
  
  if (req.query.month && req.query.year) {
    // Filter by specific month and year
    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    filter.date.$gte = startDate;
    filter.date.$lte = endDate;
  } else if (req.query.year) {
    // Filter by year only
    const year = parseInt(req.query.year);
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    filter.date.$gte = startDate;
    filter.date.$lte = endDate;
  } else if (req.query.startDate || req.query.endDate) {
    filter.date.$gte = new Date(req.query.startDate);
  

    const end = new Date(req.query.endDate);
    end.setHours(23, 59, 59, 999);
    filter.date.$lte = end;
  
  }

  // Remove empty date filter if no date params provided
  if (Object.keys(filter.date).length === 0) delete filter.date;

  const [transactions, total] = await Promise.all([
    listTransactions(filter, { skip, limit }),
    countTransactions(filter)
  ]);
  console.log("🚀 ~ transactions: ========>", transactions);

  return successResponse(res, "Transactions fetched", {
    items: transactions,
    page,
    limit,
    total
  });
});
