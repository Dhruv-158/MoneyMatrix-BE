import { Router } from "express";
import { downloadMonthlyReportPdf } from "../controllers/pdf.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/monthly", downloadMonthlyReportPdf);

export default router;
