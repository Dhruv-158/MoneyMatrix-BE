import { asyncHandler } from "../utils/asyncHandler.js";
import { createdResponse, successResponse } from "../utils/response.js";
import { getPagination } from "../utils/pagination.js";
import { createTransaction, listTransactions, countTransactions } from "../services/transaction.service.js";
import { getBankById, updateBankBalance } from "../services/bank.service.js";
import { getOrCreateWallet, updateCashBalance } from "../services/cash.service.js";
import { startSessionIfEnabled, commitSession, abortSession } from "../utils/transactionSession.js";
import { Transaction } from "../models/Transaction.js";
import { sendEmail } from "../emails/emailSender.js";

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
    date,
    friendDetails
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
        date,
        friendDetails
      },
      session
    );

    await commitSession(session);

    // Populate related fields to match listTransactionsController response
    await transaction.populate([
      { path: "bankId", select: "bankName accountType" },
      { path: "categoryId", select: "name" }
    ]);

    // Async Email Notification to Friend if provided
    if (friendDetails?.email && friendDetails?.sendNotification !== false) {
      const senderName = req.user?.name || "A MoneyMatrix user";
      const formattedAmount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
      
      const subject = `MoneyMatrix: New transaction record from ${senderName}`;
      const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">
          <h2 style="color: #3b82f6; margin-bottom: 8px;">Hi ${friendDetails.name || "Friend"},</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">
            <strong>${senderName}</strong> has added a new transaction involving you on MoneyMatrix:
          </p>

          <div style="background-color: #1e293b; border: 1px solid rgba(255,255,255,0.1); padding: 18px; border-radius: 10px; margin-bottom: 20px;">
            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase;">Amount</p>
            <p style="font-size: 24px; font-weight: 800; color: #ef4444; margin: 0;">${formattedAmount}</p>
            ${finalNote ? `<p style="font-size: 13px; color: #cbd5e1; margin-top: 10px;"><strong>Note:</strong> ${finalNote}</p>` : ""}
          </div>

          <p style="font-size: 12px; color: #64748b;">
            Automated monthly reminders will be sent if this balance remains pending.
          </p>
        </div>
      `;

      sendEmail({
        to: friendDetails.email,
        subject,
        text: `Hi ${friendDetails.name}, ${senderName} recorded a transaction of ${formattedAmount} with you.`,
        html
      }).catch((err) => console.error("Error sending initial friend email:", err));
    }

    return createdResponse(res, "Transaction created", transaction);
  } catch (err) {
    await abortSession(session);
    throw err;
  }
});

export const listTransactionsController = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  console.log("query ===>",req.query);
  const { page, limit, skip } = getPagination(req.query);

  const filter = { userId };
  console.log("reqQueryType =====>", req.query.type);
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
  
  if (req.query.startDate && req.query.endDate) {
    const startDate = new Date(req.query.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(req.query.endDate);
    endDate.setHours(23, 59, 59, 999)
    filter.date.$gte = startDate;
    filter.date.$lte = endDate;
  }else if (req.query.year && req.query.month) {
    // 2. Specific Month and Year (e.g. Year 2021, Month 7)
    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10); // 1-indexed (1 = Jan, 7 = July)
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    filter.date.$gte = startDate;
    filter.date.$lte = endDate;
  }else if (req.query.year) {
    const year = parseInt(req.query.year, 10);
    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    filter.date.$gte = startDate;
    filter.date.$lte = endDate;
  }else if (req.query.startDate || req.query.endDate) {
    if (req.query.startDate) {
      const start = new Date(req.query.startDate);
      start.setHours(0, 0, 0, 0);
      filter.date.$gte = start;
    }
    if (req.query.endDate) {
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
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

export const settleFriendTransactionController = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const transaction = await Transaction.findOne({ _id: id, userId });
  if (!transaction) throwNotFound("Transaction not found");

  if (!transaction.friendDetails) {
    throwBadRequest("Transaction does not contain friend details");
  }

  transaction.friendDetails.status = "settled";
  transaction.friendDetails.autoReminder = false;
  transaction.friendDetails.settledAt = new Date();

  await transaction.save();

  return successResponse(res, "Friend transaction marked as settled", transaction);
});
