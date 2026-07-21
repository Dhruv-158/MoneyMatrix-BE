import { Router } from "express";
import {
  createSubscriptionController,
  getSubscriptionsController,
  updateSubscriptionController,
  deleteSubscriptionController,
  toggleSubscriptionController
} from "../controllers/subscription.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { createSubscriptionValidator, updateSubscriptionValidator } from "../validators/subscription.validator.js";
import { validateRequest } from "../validators/validateRequest.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createSubscriptionValidator, validateRequest, createSubscriptionController);
router.get("/", getSubscriptionsController);
router.put("/:id", updateSubscriptionValidator, validateRequest, updateSubscriptionController);
router.patch("/:id/status", updateSubscriptionValidator, validateRequest, toggleSubscriptionController);
router.delete("/:id", deleteSubscriptionController);

export default router;
