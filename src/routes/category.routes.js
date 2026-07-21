import { Router } from "express";
import {
  createCategoryController,
  getCategoriesController,
  updateCategoryController,
  deleteCategoryController
} from "../controllers/category.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { createCategoryValidator, updateCategoryValidator } from "../validators/category.validator.js";
import { validateRequest } from "../validators/validateRequest.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createCategoryValidator, validateRequest, createCategoryController);
router.get("/", getCategoriesController);
router.put("/:id", updateCategoryValidator, validateRequest, updateCategoryController);
router.delete("/:id", deleteCategoryController);

export default router;
