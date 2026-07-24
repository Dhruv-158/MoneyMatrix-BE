import { Router } from "express";
import { createTransactionController, listTransactionsController, settleFriendTransactionController } from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { createTransactionValidator } from "../validators/transaction.validator.js";
import { validateRequest } from "../validators/validateRequest.js";
import { paginationValidator } from "../validators/pagination.validator.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createTransactionValidator, validateRequest, createTransactionController);
router.get("/", paginationValidator, validateRequest, listTransactionsController);
router.patch("/:id/settle-friend", settleFriendTransactionController);

export default router;
