import { Transaction } from "../models/Transaction.js";
import { Bank } from "../models/Bank.js";
import { CashWallet } from "../models/CashWallet.js";

export const getDashboardSummary = async (userId, startDate, endDate) => {
  const [cash, banks, totals] = await Promise.all([
    CashWallet.findOne({ userId }),
    Bank.find({ userId }).select("currentBalance"),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: startDate, $lte: endDate } } },
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
  return Transaction.find({ userId }).sort({ date: -1 }).limit(limit);
};

export const getGraphAnalytics = async (userId, startDate, endDate) => {
  return Transaction.aggregate([
    { $match: { userId, date: { $gte: startDate, $lte: endDate } } },
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
};
