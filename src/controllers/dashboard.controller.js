import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/response.js";
import { getDashboardSummary, getRecentTransactions, getGraphAnalytics } from "../services/dashboard.service.js";

const getMonthlyRange = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

export const getDashboard = asyncHandler(async (req, res) => {
  const { start, end } = getMonthlyRange(req.query.date);
  const [summary, recent, graph] = await Promise.all([
    getDashboardSummary(req.user.id, start, end),
    getRecentTransactions(req.user.id, 10),
    getGraphAnalytics(req.user.id, start, end)
  ]);

  return successResponse(res, "Dashboard fetched", {
    ...summary,
    recentTransactions: recent,
    analytics: graph
  });
});
