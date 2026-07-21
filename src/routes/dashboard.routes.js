import { Router } from "express";
import { getDashboard } from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getDashboard);

export default router;
