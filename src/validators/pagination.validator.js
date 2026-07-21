import { query } from "express-validator";

export const paginationValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page number must be a whole number starting from 1. Example: page=2 gets second page."),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be a number between 1 and 100. Controls how many items per page. Example: limit=20 shows 20 items per page.")
];
