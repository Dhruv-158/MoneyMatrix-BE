import { body } from "express-validator";

export const createCategoryValidator = [
  body("name")
    .isString().withMessage("Category name must be text")
    .notEmpty().withMessage("Category name is required (e.g., Food, Transport, Entertainment)"),
  body("iconUrl")
    .optional()
    .isString().withMessage("Icon URL must be text (e.g., https://example.com/food.png)"),
  body("imageUrl")
    .optional()
    .isString().withMessage("Image URL must be text (e.g., https://example.com/category.png)")
];

export const updateCategoryValidator = [
  body("name")
    .optional()
    .isString().withMessage("Category name must be text")
    .notEmpty().withMessage("Category name cannot be empty if provided"),
  body("iconUrl")
    .optional()
    .isString().withMessage("Icon URL must be text (e.g., https://example.com/food.png)"),
  body("imageUrl")
    .optional()
    .isString().withMessage("Image URL must be text (e.g., https://example.com/category.png)")
];
