import { Router } from "express";
import { register, login, getProfile, updateProfile, updatePassword, generateTelegramCode, verifyTelegramCode } from "../controllers/auth.controller.js";
import { registerValidator, loginValidator } from "../validators/auth.validator.js";
import { validateRequest } from "../validators/validateRequest.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.post("/register", registerValidator, validateRequest, register);
router.post("/login", loginValidator, validateRequest, login);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/password", authMiddleware, updatePassword);
router.post("/generate-telegram-code", authMiddleware, generateTelegramCode);
router.post("/verify-telegram-code", verifyTelegramCode);

export default router;
