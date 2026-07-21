import { body } from "express-validator";

export const updateCashValidator = [
  body("balance")
    .isNumeric().withMessage("Cash balance must be a number (e.g., 1000.50). Cannot contain letters or special characters.")
];
