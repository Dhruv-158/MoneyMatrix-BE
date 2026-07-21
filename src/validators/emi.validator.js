import { body } from "express-validator";

export const createEmiValidator = [
  body("title")
    .isString().withMessage("EMI name must be text (e.g., Car Loan, Home Loan, Phone EMI)")
    .notEmpty().withMessage("EMI name is required"),
  body("amount")
    .isNumeric().withMessage("Amount must be a number (e.g., 5000.50). This is your monthly/periodic EMI payment."),
  body("frequency")
    .isIn(["monthly", "yearly", "weekly"]).withMessage("Frequency must be one of: 'weekly' (every week), 'monthly' (every month), or 'yearly' (every year)"),
  body("startDate")
    .isISO8601().withMessage("Start date must be in ISO format (e.g., 2026-05-10). This is when the EMI started."),
  body("nextDueDate")
    .isISO8601().withMessage("Next due date must be in ISO format (e.g., 2026-06-10T00:00:00Z). This is the next EMI due date."),
  body("paymentMethod")
    .isIn(["bank", "cash"]).withMessage("Payment method must be either 'bank' (paid from bank account) or 'cash' (paid from wallet)"),
  body("bankId")
    .optional()
    .isString().withMessage("Bank ID must be text (required if paymentMethod is 'bank')"),
  body("categoryId")
    .optional()
    .isString().withMessage("Category ID must be text (e.g., Personal Loan, Vehicle). Helps organize your EMIs."),
  body("iconUrl")
    .optional()
    .isString().withMessage("Icon URL must be text. Leave empty for automatic icon resolution."),
  body("imageUrl")
    .optional()
    .isString().withMessage("Image URL must be text. Leave empty for automatic image resolution."),
  body("note")
    .optional()
    .isString().withMessage("Note must be text. Optional field for additional details (e.g., 'Car Loan - 36 months remaining')")
];

export const updateEmiValidator = [
  body("title")
    .optional()
    .isString().withMessage("EMI name must be text (e.g., Car Loan, Home Loan, Phone EMI)"),
  body("amount")
    .optional()
    .isNumeric().withMessage("Amount must be a number (e.g., 5000.50)."),
  body("frequency")
    .optional()
    .isIn(["monthly", "yearly", "weekly"]).withMessage("Frequency must be one of: 'weekly', 'monthly', or 'yearly'"),
  body("startDate")
    .optional()
    .isISO8601().withMessage("Start date must be in ISO format (e.g., 2026-05-10)"),
  body("nextDueDate")
    .optional()
    .isISO8601().withMessage("Next due date must be in ISO format (e.g., 2026-06-10T00:00:00Z)"),
  body("paymentMethod")
    .optional()
    .isIn(["bank", "cash"]).withMessage("Payment method must be either 'bank' or 'cash'"),
  body("bankId")
    .optional()
    .isString().withMessage("Bank ID must be text"),
  body("categoryId")
    .optional()
    .isString().withMessage("Category ID must be text"),
  body("iconUrl")
    .optional()
    .isString().withMessage("Icon URL must be text"),
  body("imageUrl")
    .optional()
    .isString().withMessage("Image URL must be text"),
  body("isActive")
    .optional()
    .isBoolean().withMessage("Active status must be true or false. Set to false to pause auto-deduction."),
  body("note")
    .optional()
    .isString().withMessage("Note must be text")
];
