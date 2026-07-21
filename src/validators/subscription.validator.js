import { body } from "express-validator";

export const createSubscriptionValidator = [
  body("title")
    .isString().withMessage("Subscription name must be text (e.g., Netflix, Spotify, Gym Membership)")
    .notEmpty().withMessage("Subscription name is required"),
  body("amount")
    .isNumeric().withMessage("Amount must be a number (e.g., 199.99). This is how much you pay each billing cycle."),
  body("frequency")
    .isIn(["monthly", "yearly", "weekly"]).withMessage("Frequency must be one of: 'weekly' (every week), 'monthly' (every month), or 'yearly' (every year)"),
  body("startDate")
    .isISO8601().withMessage("Start date must be in ISO format (e.g., 2026-05-10 or 2026-05-10T00:00:00Z). This is when the subscription began."),
  body("nextDueDate")
    .isISO8601().withMessage("Next due date must be in ISO format (e.g., 2026-06-10T00:00:00Z). This is the next billing date."),
  body("paymentMethod")
    .isIn(["bank", "cash"]).withMessage("Payment method must be either 'bank' (paid from bank account) or 'cash' (paid from wallet)"),
  body("bankId")
    .optional()
    .isString().withMessage("Bank ID must be text (required if paymentMethod is 'bank')"),
  body("categoryId")
    .optional()
    .isString().withMessage("Category ID must be text (e.g., Entertainment, Health). Helps organize your subscriptions."),
  body("iconUrl")
    .optional()
    .isString().withMessage("Icon URL must be text (e.g., https://example.com/netflix.png). Automatically fetched if left empty."),
  body("imageUrl")
    .optional()
    .isString().withMessage("Image URL must be text (e.g., https://example.com/netflix-logo.png). Automatically fetched if left empty."),
  body("note")
    .optional()
    .isString().withMessage("Note must be text. Optional field for any additional details (e.g., 'Family plan with 5 users')")
];

export const updateSubscriptionValidator = [
  body("title")
    .optional()
    .isString().withMessage("Subscription name must be text (e.g., Netflix, Spotify, Gym Membership)"),
  body("amount")
    .optional()
    .isNumeric().withMessage("Amount must be a number (e.g., 199.99)."),
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
