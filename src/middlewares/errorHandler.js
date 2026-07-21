import { errorResponse } from "../utils/response.js";

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Server error";
  return errorResponse(res, status, message, { name: err.name });
};
