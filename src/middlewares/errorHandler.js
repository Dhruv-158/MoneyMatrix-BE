import { errorResponse } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import { isAppError } from "../utils/AppError.js";
import { getUserMessage } from "../utils/userMessages.js";
import { trackServerError } from "../utils/monitoring.js";

const looksTechnical = (msg = "") => {
  const s = String(msg);
  return (
    /mongoose|mongo|econnrefused|jwt|stack|typescript|cannot read|undefined is not|CastError|ValidationError:/i.test(
      s
    ) || s.length > 180
  );
};

export const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || res.locals.requestId;
  const status = err.status || err.statusCode || 500;

  let code = "INTERNAL_ERROR";
  let userMessage = getUserMessage("INTERNAL_ERROR");
  let details;

  if (isAppError(err)) {
    code = err.code || code;
    userMessage = err.userMessage || getUserMessage(code);
    details = err.details;
  } else if (err.code && typeof err.code === "string" && !err.code.startsWith("E")) {
    code = err.code;
    userMessage = getUserMessage(code, looksTechnical(err.message) ? undefined : err.message);
  } else if (status < 500 && err.message && !looksTechnical(err.message)) {
    code = status === 404 ? "NOT_FOUND" : status === 401 ? "INVALID_TOKEN" : "BAD_REQUEST";
    userMessage = err.message;
  }

  logger.error(err.logMessage || err.message || "Request failed", {
    requestId,
    code,
    status,
    path: req.originalUrl || req.url,
    method: req.method,
    stack: err.stack,
    cause: err.cause?.message
  });

  const finalStatus = status >= 400 ? status : 500;
  if (finalStatus >= 500) {
    trackServerError(requestId, req.originalUrl || req.url, finalStatus).catch(() => {});
  }

  if (res.headersSent) {
    return next(err);
  }

  return errorResponse(res, finalStatus, userMessage, {
    code,
    ...(details ? { fields: details } : {})
  });
};
