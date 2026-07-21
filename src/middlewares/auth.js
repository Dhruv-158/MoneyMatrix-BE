import { verifyToken } from "../utils/jwt.js";
import { errorResponse } from "../utils/response.js";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return errorResponse(res, 401, "Unauthorized", { code: "NO_TOKEN" });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    return errorResponse(res, 401, "Invalid token", { code: "INVALID_TOKEN" });
  }
};
