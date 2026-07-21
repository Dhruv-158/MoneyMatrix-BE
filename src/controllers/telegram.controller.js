import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/response.js";
import { createTransactionController } from "./transaction.controller.js";
import { getBalances } from "../services/report.service.js";

export const telegramAddIncome = asyncHandler(async (req, res, next) => {
  req.body.type = "income";
  return createTransactionController(req, res, next);
});

export const telegramAddExpense = asyncHandler(async (req, res, next) => {
  req.body.type = "expense";
  return createTransactionController(req, res, next);
});

export const telegramTransfer = asyncHandler(async (req, res, next) => {
  req.body.type = "transfer";
  return createTransactionController(req, res, next);
});

export const telegramGetBalances = asyncHandler(async (req, res) => {
  const balances = await getBalances(req.user.id);
  return successResponse(res, "Balances fetched", balances);
});
