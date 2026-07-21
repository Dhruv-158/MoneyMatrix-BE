import { validationResult } from "express-validator";
import { errorResponse } from "../utils/response.js";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, "Validation error", errors.array());
  }
  return next();
};
