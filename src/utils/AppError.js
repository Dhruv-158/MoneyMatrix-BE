import { getUserMessage } from "./userMessages.js";

export class AppError extends Error {
  /**
   * @param {object} opts
   * @param {number} [opts.status=500]
   * @param {string} opts.code
   * @param {string} [opts.userMessage]
   * @param {string} [opts.logMessage]
   * @param {Error} [opts.cause]
   * @param {object} [opts.details]
   */
  constructor({ status = 500, code = "INTERNAL_ERROR", userMessage, logMessage, cause, details } = {}) {
    const friendly = userMessage || getUserMessage(code);
    super(friendly);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.userMessage = friendly;
    this.logMessage = logMessage || cause?.message || friendly;
    this.cause = cause;
    this.details = details;
  }
}

export const isAppError = (err) => err instanceof AppError;
