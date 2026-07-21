import { body } from "express-validator";

export const createTransactionValidator = [
  body("type")
    .isIn(["income", "expense", "transfer"]).withMessage("Type must be one of: 'income' (money coming in), 'expense' (money going out), or 'transfer' (moving between accounts)"),
  body("amount")
    .isNumeric().withMessage("Amount must be a number (e.g., 500.50). Cannot contain letters or special characters.")
    .custom((val) => val > 0).withMessage("Amount must be greater than 0. Enter the value you received or spent."),
  body("paymentMethod")
    .optional()
    .isIn(["bank", "cash"]).withMessage("Payment method must be either 'bank' (from your bank account) or 'cash' (from your wallet)"),
  body("bankId")
    .optional()
    .isString().withMessage("Bank ID must be text (provided when selecting a bank account)"),
  body("categoryId")
    .optional()
    .isString().withMessage("Category ID must be text (provided when selecting a category like Food, Transport)"),
  body("transferType")
    .optional()
    .isIn(["bank_to_cash", "cash_to_bank", "bank_to_bank"]).withMessage("Transfer type must be one of: 'bank_to_cash', 'cash_to_bank', or 'bank_to_bank'. Use when moving money between accounts."),
  body("fromBankId")
    .optional()
    .isString().withMessage("Source bank ID must be text (bank account you're transferring FROM)"),
  body("toBankId")
    .optional()
    .isString().withMessage("Destination bank ID must be text (bank account you're transferring TO)"),
  body("date")
    .optional()
    .isISO8601().withMessage("Date must be in ISO format (e.g., 2026-05-10 or 2026-05-10T14:30:00Z). Use today's date if unsure.")
];
