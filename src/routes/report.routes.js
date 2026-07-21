import { Router } from "express";
import { getDailyReport, getMonthlyReport, getYearlyReport } from "../controllers/report.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { reportQueryValidator } from "../validators/report.validator.js";
import { validateRequest } from "../validators/validateRequest.js";

const router = Router();

router.use(authMiddleware);

router.get("/daily", reportQueryValidator, validateRequest, getDailyReport);
router.get("/monthly", reportQueryValidator, validateRequest, getMonthlyReport);
router.get("/yearly", reportQueryValidator, validateRequest, getYearlyReport);

export default router;
