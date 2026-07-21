import { Router } from "express";
import {
  createBankController,
  getBanksController,
  updateBankController,
  deleteBankController,
  getBankController
} from "../controllers/bank.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { createBankValidator, updateBankValidator } from "../validators/bank.validator.js";
import { validateRequest } from "../validators/validateRequest.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createBankValidator, validateRequest, createBankController);
router.get("/", getBanksController);
router.get("/:id", getBankController);
router.put("/:id", updateBankValidator, validateRequest, updateBankController);
router.delete("/:id", deleteBankController);

export default router;
