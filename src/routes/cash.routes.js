import { Router } from "express";
import { getCashWallet, updateCashWallet } from "../controllers/cash.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { updateCashValidator } from "../validators/cash.validator.js";
import { validateRequest } from "../validators/validateRequest.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getCashWallet);
router.put("/", updateCashValidator, validateRequest, updateCashWallet);

export default router;
