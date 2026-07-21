import { asyncHandler } from "../utils/asyncHandler.js";
import { createdResponse, successResponse, errorResponse } from "../utils/response.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { createUser, findUserByEmail } from "../services/user.service.js";
import { createBuiltinCategories } from "../services/category.service.js";
import { getOrCreateWallet } from "../services/cash.service.js";
import { startSessionIfEnabled, commitSession, abortSession } from "../utils/transactionSession.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await findUserByEmail(email);
  if (existing) {
    return errorResponse(res, 409, "Email already exists", { code: "EMAIL_EXISTS" });
  }

  const session = await startSessionIfEnabled();
  try {
    const hashed = await hashPassword(password);
    const user = await createUser({ name, email, password: hashed }, session);
    await getOrCreateWallet(user._id, session);
    await createBuiltinCategories(user._id, session).catch(() => null);
    await commitSession(session);

    const token = signToken({ id: user._id, email: user.email });
    return createdResponse(res, "User registered", { token, user: { id: user._id, name, email } });
  } catch (err) {
    await abortSession(session);
    throw err;
  }
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user) {
    return errorResponse(res, 401, "Invalid credentials", { code: "INVALID_CREDENTIALS" });
  }

  const match = await comparePassword(password, user.password);
  if (!match) {
    return errorResponse(res, 401, "Invalid credentials", { code: "INVALID_CREDENTIALS" });
  }

  const token = signToken({ id: user._id, email: user.email });
  return successResponse(res, "Login successful", {
    token,
    user: { id: user._id, name: user.name, email: user.email }
  });
});
