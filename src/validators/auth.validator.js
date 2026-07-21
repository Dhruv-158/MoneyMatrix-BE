import { body } from "express-validator";

export const registerValidator = [
  body("name")
    .isString().withMessage("Name must be text")
    .isLength({ min: 2 }).withMessage("Name must be at least 2 characters long"),
  body("email")
    .isEmail().withMessage("Email must be valid (e.g., user@example.com)"),
  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long")
];

export const loginValidator = [
  body("email")
    .isEmail().withMessage("Email must be valid (e.g., user@example.com)"),
  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long")
];
