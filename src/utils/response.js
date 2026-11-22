import { getUserMessage } from "./userMessages.js";

export const successResponse = (res, message, data = {}) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    requestId: res.locals.requestId
  });
};

export const createdResponse = (res, message, data = {}) => {
  return res.status(201).json({
    success: true,
    message,
    data,
    requestId: res.locals.requestId
  });
};

/**
 * @param {import('express').Response} res
 * @param {number} status
 * @param {string} messageOrCode - friendly message OR known error code
 * @param {object} error - may include { code, fields, ... }
 */
export const errorResponse = (res, status, messageOrCode, error = {}) => {
  const code = error.code || (USER_CODE_HINT[messageOrCode] ? messageOrCode : undefined);
  const resolvedCode = code || error.code || (status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST");
  // Prefer mapped text for known codes; keep plain sentences when callers pass them
  const message = USER_CODE_HINT[messageOrCode]
    ? getUserMessage(resolvedCode)
    : (messageOrCode || getUserMessage(resolvedCode));

  return res.status(status).json({
    success: false,
    message,
    code: resolvedCode,
    requestId: res.locals.requestId,
    error: {
      ...error,
      code: resolvedCode
    }
  });
};

// Treat these string args as codes when passed as messageOrCode
const USER_CODE_HINT = {
  NO_TOKEN: true,
  INVALID_TOKEN: true,
  INVALID_CREDENTIALS: true,
  EMAIL_EXISTS: true,
  USER_NOT_FOUND: true,
  INSUFFICIENT_BALANCE: true,
  BANK_NOT_FOUND: true,
  BANK_IN_USE: true,
  TRANSACTION_NOT_FOUND: true,
  VALIDATION_ERROR: true,
  RATE_LIMIT: true,
  INTERNAL_ERROR: true,
  BAD_REQUEST: true,
  NOT_FOUND: true,
  FORBIDDEN: true,
  EMAIL_FAILED: true,
  PASSWORD_INCORRECT: true,
  TELEGRAM_CODE_INVALID: true,
  TELEGRAM_CODE_REQUIRED: true
};
