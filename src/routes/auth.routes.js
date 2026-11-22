import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  getProfile,
  updateProfile,
  updatePassword,
  uploadAvatar,
  generateTelegramCode,
  verifyTelegramCode
} from "../controllers/auth.controller.js";
import { registerValidator, loginValidator } from "../validators/auth.validator.js";
import { validateRequest } from "../validators/validateRequest.js";
import { authMiddleware } from "../middlewares/auth.js";
import { avatarUpload } from "../middlewares/avatarUpload.js";

const router = Router();

router.post("/register", registerValidator, validateRequest, register);
router.post("/login", loginValidator, validateRequest, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/password", authMiddleware, updatePassword);
router.post(
  "/avatar",
  authMiddleware,
  avatarUpload.single("avatar"),
  uploadAvatar
);
router.post("/generate-telegram-code", authMiddleware, generateTelegramCode);
router.post("/verify-telegram-code", verifyTelegramCode);

export default router;
