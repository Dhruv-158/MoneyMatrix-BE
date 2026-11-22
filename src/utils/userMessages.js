/** Plain-language messages for end users (non-technical). */
export const USER_MESSAGES = {
  NO_TOKEN: "Please sign in again.",
  INVALID_TOKEN: "Please sign in again.",
  INVALID_CREDENTIALS: "Email or password is wrong.",
  EMAIL_EXISTS: "An account with this email already exists.",
  USER_NOT_FOUND: "We couldn’t find that account.",
  INSUFFICIENT_BALANCE: "Not enough money in this account.",
  BANK_NOT_FOUND: "That bank account was not found.",
  BANK_IN_USE: "You can’t delete this bank while it still has transactions or bills.",
  TRANSACTION_NOT_FOUND: "That transaction was not found.",
  VALIDATION_ERROR: "Please check the form and try again.",
  RATE_LIMIT: "You’re doing that too quickly. Please wait a moment and try again.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
  SESSION_EXPIRED: "Your session expired. Please sign in again.",
  BAD_REQUEST: "That request doesn’t look right. Please try again.",
  NOT_FOUND: "We couldn’t find what you asked for.",
  FORBIDDEN: "You don’t have permission to do that.",
  EMAIL_FAILED: "We couldn’t send the email. Please try again later.",
  PASSWORD_INCORRECT: "Current password is incorrect.",
  TELEGRAM_CODE_INVALID: "That linking code is invalid or has expired.",
  TELEGRAM_CODE_REQUIRED: "A linking code is required.",
  REFRESH_TOKEN_REQUIRED: "Please sign in again."
};

export const getUserMessage = (code, fallback) => {
  if (code && USER_MESSAGES[code]) return USER_MESSAGES[code];
  return fallback || USER_MESSAGES.INTERNAL_ERROR;
};
