import { Router } from "express";
import authRoutes from "./auth.routes.js";
import bankRoutes from "./bank.routes.js";
import cashRoutes from "./cash.routes.js";
import categoryRoutes from "./category.routes.js";
import transactionRoutes from "./transaction.routes.js";
import emiRoutes from "./emi.routes.js";
import subscriptionRoutes from "./subscription.routes.js";
import reportRoutes from "./report.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import pdfRoutes from "./pdf.routes.js";
import telegramRoutes from "./telegram.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/banks", bankRoutes);
router.use("/cash", cashRoutes);
router.use("/categories", categoryRoutes);
router.use("/transactions", transactionRoutes);
router.use("/emis", emiRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/reports", reportRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/pdf", pdfRoutes);
router.use("/telegram", telegramRoutes);

export default router;
