import { Router } from "express";
import { register, login, updateProfile, updatePassword } from "../controllers/auth.controller.js";
import { registerValidator, loginValidator } from "../validators/auth.validator.js";
import { validateRequest } from "../validators/validateRequest.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.post("/register", registerValidator, validateRequest, register);
router.post("/login", loginValidator, validateRequest, login);
router.put("/profile", authMiddleware, updateProfile);
router.put("/password", authMiddleware, updatePassword);

export default router;
