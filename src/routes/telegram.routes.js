import { Router } from "express";
import {
  telegramAddIncome,
  telegramAddExpense,
  telegramTransfer,
  telegramGetBalances
} from "../controllers/telegram.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.post("/income", telegramAddIncome);
router.post("/expense", telegramAddExpense);
router.post("/transfer", telegramTransfer);
router.get("/balances", telegramGetBalances);

export default router;
