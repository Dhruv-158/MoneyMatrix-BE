import { body } from "express-validator";

export const createBankValidator = [
  body("bankName")
    .isString().withMessage("Bank name must be text")
    .notEmpty().withMessage("Bank name is required"),
  body("accountType")
    .isString().withMessage("Account type must be text (e.g., Savings, Checking)")
    .notEmpty().withMessage("Account type is required"),
  body("currentBalance")
    .optional()
    .isNumeric().withMessage("Current balance must be a number (e.g., 5000.50)"),
  body("accountNumberLast4")
    .isString().withMessage("Last 4 digits must be text")
    .isLength({ min: 4, max: 4 }).withMessage("Last 4 digits of account number must be exactly 4 characters"),
  body("color")
    .optional()
    .isString().withMessage("Color must be text (e.g., #FF5733 or blue)"),
  body("icon")
    .optional()
    .isString().withMessage("Icon name must be text"),
  body("iconUrl")
    .optional()
    .isString().withMessage("Icon URL must be text (e.g., https://example.com/icon.png)"),
  body("imageUrl")
    .optional()
    .isString().withMessage("Image URL must be text (e.g., https://example.com/bank.png)")
];

export const updateBankValidator = [
  body("bankName")
    .optional()
    .isString().withMessage("Bank name must be text"),
  body("accountType")
    .optional()
    .isString().withMessage("Account type must be text (e.g., Savings, Checking)"),
  body("currentBalance")
    .optional()
    .isNumeric().withMessage("Current balance must be a number (e.g., 5000.50)"),
  body("accountNumberLast4")
    .optional()
    .isString().withMessage("Last 4 digits must be text")
    .isLength({ min: 4, max: 4 }).withMessage("Last 4 digits must be exactly 4 characters"),
  body("color")
    .optional()
    .isString().withMessage("Color must be text (e.g., #FF5733 or blue)"),
  body("icon")
    .optional()
    .isString().withMessage("Icon name must be text"),
  body("iconUrl")
    .optional()
    .isString().withMessage("Icon URL must be text (e.g., https://example.com/icon.png)"),
  body("imageUrl")
    .optional()
    .isString().withMessage("Image URL must be text (e.g., https://example.com/bank.png)")
];
