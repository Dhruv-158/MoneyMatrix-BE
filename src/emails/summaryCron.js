import { listUsersForEmail } from "../services/user.service.js";
import { getSummaryByDateRange, getBalances, getBankWiseExpenses } from "../services/report.service.js";
import { buildSummaryEmail } from "./summaryEmail.js";
import { sendEmail } from "./emailSender.js";

const getDateRange = (type, dateInput) => {
  const parseDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  let startDate, endDate;
  
  if (type === "daily") {
    if (!dateInput) dateInput = new Date().toISOString().split('T')[0];
    startDate = parseDate(dateInput);
    endDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), 23, 59, 59, 999));
  } else if (type === "monthly") {
    if (!dateInput) dateInput = new Date().toISOString().split('T')[0];
    const [year, month] = dateInput.split('-').map(Number);
    startDate = new Date(Date.UTC(year, month - 1, 1));
    endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  } else if (type === "yearly") {
    if (!dateInput) dateInput = new Date().toISOString().split('T')[0];
    const year = parseInt(dateInput.split('-')[0]);
    startDate = new Date(Date.UTC(year, 0, 1));
    endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  }
  
  return { start: startDate, end: endDate };
};

const sendSummaryForUser = async (user, type) => {
  const { start, end } = getDateRange(type);
  const [summary, balances, bankWise] = await Promise.all([
    getSummaryByDateRange(user._id, start, end),
    getBalances(user._id, end),
    getBankWiseExpenses(user._id, start, end)
  ]);

  const payload = {
    type,
    income: summary.income,
    expense: summary.expense,
    net: summary.income - summary.expense,
    cashBalance: balances.cashBalance,
    bankBalances: balances.banks,
    bankWiseExpenses: bankWise,
    brandName: "Expense Tracker"
  };

  const { subject, text, html } = buildSummaryEmail(payload);
  await sendEmail({ to: user.email, subject, text, html });
};

export const runDailySummaryEmails = async () => {
  const users = await listUsersForEmail();
  for (const user of users) {
    if (!user.email) continue;
    await sendSummaryForUser(user, "daily");
  }
};

export const runMonthlySummaryEmails = async () => {
  const users = await listUsersForEmail();
  for (const user of users) {
    if (!user.email) continue;
    await sendSummaryForUser(user, "monthly");
  }
};
