import { query } from "express-validator";

export const reportQueryValidator = [
  query("date")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("Date must be in YYYY-MM-DD format (e.g., 2026-05-10). Leave empty for today.")
];
