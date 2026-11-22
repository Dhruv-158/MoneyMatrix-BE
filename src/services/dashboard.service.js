import { Transaction } from "../models/Transaction.js";
import { Bank } from "../models/Bank.js";
import { CashWallet } from "../models/CashWallet.js";
import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

export const getDashboardSummary = async (userId, startDate, endDate) => {
  const [cash, banks, totals] = await Promise.all([
    CashWallet.findOne({ userId }),
    Bank.find({ userId }).select("currentBalance"),
    Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      { $group: { _id: "$type", total: { $sum: "$amount" } } }
    ])
  ]);

  const totalsMap = totals.reduce(
    (acc, item) => {
      acc[item._id] = item.total;
      return acc;
    },
    { income: 0, expense: 0, transfer: 0 }
  );

  const totalBankBalance = banks.reduce((sum, bank) => sum + bank.currentBalance, 0);
  const cashBalance = cash ? cash.balance : 0;
  const totalBalance = cashBalance + totalBankBalance;

  return {
    totalBalance,
    cashBalance,
    totalBankBalance,
    monthlyIncome: totalsMap.income,
    monthlyExpense: totalsMap.expense,
    savings: totalsMap.income - totalsMap.expense
  };
};

export const getRecentTransactions = async (userId, limit = 10) => {
  try {
    return Transaction.find({ userId })
      .populate("categoryId", "name")
      .populate("bankId", "bankName accountType")
      .sort({ date: -1 })
      .limit(limit);
  } catch (error) {
    logger.error("getRecentTransactions failed", { stack: error?.stack, msg: error?.message });
  }
};

export const getGraphAnalytics = async (userId, startDate, endDate) => {
  try {
    return Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { type: "$type", month: { $month: "$date" } },
          total: { $sum: "$amount" }
        }
      },
      {
        $project: {
          _id: 0,
          type: "$_id.type",
          month: "$_id.month",
          total: 1
        }
      },
      { $sort: { month: 1 } }
    ]);
  } catch (error) {
    logger.error("getGraphAnalytics failed", { stack: error?.stack, msg: error?.message });
  }
};

export const getCategoryExpenses = async (userId, startDate, endDate) => {
  try {
    return Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: "expense",
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$categoryId",
          total: { $sum: "$amount" }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          name: { $ifNull: ["$category.name", "Uncategorized"] },
          total: 1
        }
      },
      { $sort: { total: -1 } }
    ]);
  } catch (error) {
    logger.error("getCategoryExpenses failed", { stack: error?.stack, msg: error?.message });
    return [];
  }
};
