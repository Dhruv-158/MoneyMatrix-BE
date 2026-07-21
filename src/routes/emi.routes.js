import { Router } from "express";
import {
  createEmiController,
  getEmisController,
  updateEmiController,
  deleteEmiController,
  toggleEmiController
} from "../controllers/emi.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { createEmiValidator, updateEmiValidator } from "../validators/emi.validator.js";
import { validateRequest } from "../validators/validateRequest.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createEmiValidator, validateRequest, createEmiController);
router.get("/", getEmisController);
router.put("/:id", updateEmiValidator, validateRequest, updateEmiController);
router.patch("/:id/status", updateEmiValidator, validateRequest, toggleEmiController);
router.delete("/:id", deleteEmiController);

export default router;
