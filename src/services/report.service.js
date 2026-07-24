import { Transaction } from "../models/Transaction.js";
import { Bank } from "../models/Bank.js";
import { CashWallet } from "../models/CashWallet.js";
import mongoose from "mongoose";

const toObjectId = (id) => {
  if (typeof id === "string") return new mongoose.Types.ObjectId(id);
  return id;
};

export const getSummaryByDateRange = async (userId, startDate, endDate) => {
  const userObjId = toObjectId(userId);
  const match = { userId: userObjId, date: { $gte: startDate, $lte: endDate } };
  const result = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" }
      }
    }
  ]);

  const totals = result.reduce(
    (acc, item) => {
      acc[item._id] = item.total;
      return acc;
    },
    { income: 0, expense: 0, transfer: 0 }
  );

  return totals;
};

export const getBankWiseExpenses = async (userId, startDate, endDate) => {
  const userObjId = toObjectId(userId);
  return Transaction.aggregate([
    {
      $match: {
        userId: userObjId,
        type: "expense",
        paymentMethod: "bank",
        date: { $gte: startDate, $lte: endDate }
      }
    },
    { $group: { _id: "$bankId", total: { $sum: "$amount" } } },
    { $lookup: { from: "banks", localField: "_id", foreignField: "_id", as: "bank" } },
    { $unwind: { path: "$bank", preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, bankId: "$bank._id", bankName: "$bank.bankName", total: 1 } }
  ]);
};

export const getCategoryWiseExpenses = async (userId, startDate, endDate) => {
  const userObjId = toObjectId(userId);
  return Transaction.aggregate([
    {
      $match: {
        userId: userObjId,
        type: "expense",
        date: { $gte: startDate, $lte: endDate }
      }
    },
    { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
    { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        name: { $ifNull: ["$category.name", "Uncategorized"] },
        category: { $ifNull: ["$category.name", "Uncategorized"] },
        total: 1
      }
    },
    { $sort: { total: -1 } }
  ]);
};

// Get transaction count by type
export const getTransactionCount = async (userId, startDate, endDate) => {
  const userObjId = toObjectId(userId);
  return Transaction.aggregate([
    { $match: { userId: userObjId, date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: "$type", count: { $sum: 1 } } }
  ]);
};

// Get cash expenses
export const getCashExpenses = async (userId, startDate, endDate) => {
  const userObjId = toObjectId(userId);
  const result = await Transaction.aggregate([
    {
      $match: {
        userId: userObjId,
        type: "expense",
        paymentMethod: "cash",
        date: { $gte: startDate, $lte: endDate }
      }
    },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  return result[0]?.total || 0;
};

// Get bank transfers
export const getBankTransfers = async (userId, startDate, endDate) => {
  const userObjId = toObjectId(userId);
  const result = await Transaction.aggregate([
    {
      $match: {
        userId: userObjId,
        type: "transfer",
        date: { $gte: startDate, $lte: endDate }
      }
    },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  return result[0]?.total || 0;
};

// Get cash withdrawals (Bank -> Cash transfers)
export const getCashWithdrawals = async (userId, startDate, endDate) => {
  const userObjId = toObjectId(userId);
  const result = await Transaction.aggregate([
    {
      $match: {
        userId: userObjId,
        type: "transfer",
        transferType: "bank_to_cash",
        date: { $gte: startDate, $lte: endDate }
      }
    },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  return result[0]?.total || 0;
};

export const getBalances = async (userId, atDate = null) => {
  const userObjId = toObjectId(userId);
  const banks = await Bank.find({ userId: userObjId }).select("bankName currentBalance accountType");
  
  // Get current cash balance
  const currentCashWallet = await CashWallet.findOne({ userId: userObjId });
  let cashBalance = currentCashWallet ? currentCashWallet.balance : 0;
  
  // If a specific date is provided, calculate historical balance
  if (atDate) {
    // Get all cash-related transactions AFTER the specified date to reverse them
    const futureTransactions = await Transaction.aggregate([
      {
        $match: {
          userId: userObjId,
          date: { $gt: atDate },
          $or: [
            { paymentMethod: "cash" },
            { transferType: { $in: ["bank_to_cash", "cash_to_bank"] } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalAfter: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$type", "income"] },
                    { $eq: ["$transferType", "bank_to_cash"] }
                  ]
                },
                "$amount",
                { $multiply: ["$amount", -1] }
              ]
            }
          }
        }
      }
    ]);

    const futureAmount = futureTransactions[0]?.totalAfter || 0;
    cashBalance = cashBalance - futureAmount; // Reverse future transactions to get historical balance
  }
  
  return { cashBalance, banks };
};

// Get daily breakdown for line chart (income and expense by day)
export const getDailyBreakdown = async (userId, startDate, endDate) => {
  const userObjId = toObjectId(userId);
  const result = await Transaction.aggregate([
    {
      $match: {
        userId: userObjId,
        type: { $in: ["income", "expense"] },
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          type: "$type"
        },
        total: { $sum: "$amount" }
      }
    },
    { $sort: { "_id.date": 1 } }
  ]);

  // Format data for line chart
  const chartData = {};
  result.forEach(item => {
    const date = item._id.date;
    if (!chartData[date]) {
      chartData[date] = { date, income: 0, expense: 0 };
    }
    chartData[date][item._id.type] = item.total;
  });

  return Object.values(chartData);
};
