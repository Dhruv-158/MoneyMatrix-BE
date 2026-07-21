import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/response.js";
import { getSummaryByDateRange, getBalances, getBankWiseExpenses, getTransactionCount, getCashExpenses, getBankTransfers, getDailyBreakdown } from "../services/report.service.js";

const getDateRange = (type, dateInput) => {
  // Parse date string YYYY-MM-DD and create start/end as UTC dates
  const parseDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  let startDate, endDate;
  
  if (type === "daily") {
    if (!dateInput) dateInput = new Date().toISOString().split('T')[0];
    startDate = parseDate(dateInput);
    // End of day: 23:59:59.999 same day
    endDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), 23, 59, 59, 999));
  } else if (type === "monthly") {
    if (!dateInput) dateInput = new Date().toISOString().split('T')[0];
    const [year, month] = dateInput.split('-').map(Number);
    startDate = new Date(Date.UTC(year, month - 1, 1));
    // End of month: last day at 23:59:59.999
    endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  } else if (type === "yearly") {
    if (!dateInput) dateInput = new Date().toISOString().split('T')[0];
    const year = parseInt(dateInput.split('-')[0]);
    startDate = new Date(Date.UTC(year, 0, 1));
    // End of year: Dec 31 at 23:59:59.999
    endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  }
  
  return { start: startDate, end: endDate };
};

export const getDailyReport = asyncHandler(async (req, res) => {
  const { start, end } = getDateRange("daily", req.query.date);
  const [summary, balances, bankWise, txnCount, cashExpenses, transfers] = await Promise.all([
    getSummaryByDateRange(req.user.id, start, end),
    getBalances(req.user.id, end),
    getBankWiseExpenses(req.user.id, start, end),
    getTransactionCount(req.user.id, start, end),
    getCashExpenses(req.user.id, start, end),
    getBankTransfers(req.user.id, start, end)
  ]);

  const netSavings = summary.income - summary.expense;
  return successResponse(res, "Daily report generated", {
    summary,
    netSavings,
    cashBalance: balances.cashBalance,
    bankBalances: balances.banks,
    bankWiseExpenses: bankWise,
    transactionCount: txnCount,
    cashExpenses,
    transfers
  });
});

export const getMonthlyReport = asyncHandler(async (req, res) => {
  const { start, end } = getDateRange("monthly", req.query.date);
  const [summary, balances, bankWise, txnCount, cashExpenses, transfers, dailyBreakdown] = await Promise.all([
    getSummaryByDateRange(req.user.id, start, end),
    getBalances(req.user.id, end),
    getBankWiseExpenses(req.user.id, start, end),
    getTransactionCount(req.user.id, start, end),
    getCashExpenses(req.user.id, start, end),
    getBankTransfers(req.user.id, start, end),
    getDailyBreakdown(req.user.id, start, end)
  ]);

  const netSavings = summary.income - summary.expense;
  return successResponse(res, "Monthly report generated", {
    summary,
    netSavings,
    cashBalance: balances.cashBalance,
    bankBalances: balances.banks,
    bankWiseExpenses: bankWise,
    transactionCount: txnCount,
    cashExpenses,
    transfers,
    dailyBreakdown
  });
});

export const getYearlyReport = asyncHandler(async (req, res) => {
  const { start, end } = getDateRange("yearly", req.query.date);
  const [summary, balances, bankWise, txnCount, cashExpenses, transfers, dailyBreakdown] = await Promise.all([
    getSummaryByDateRange(req.user.id, start, end),
    getBalances(req.user.id, end),
    getBankWiseExpenses(req.user.id, start, end),
    getTransactionCount(req.user.id, start, end),
    getCashExpenses(req.user.id, start, end),
    getBankTransfers(req.user.id, start, end),
    getDailyBreakdown(req.user.id, start, end)
  ]);

  const netSavings = summary.income - summary.expense;
  return successResponse(res, "Yearly report generated", {
    summary,
    netSavings,
    cashBalance: balances.cashBalance,
    bankBalances: balances.banks,
    bankWiseExpenses: bankWise,
    transactionCount: txnCount,
    cashExpenses,
    transfers,
    dailyBreakdown
  });
});
