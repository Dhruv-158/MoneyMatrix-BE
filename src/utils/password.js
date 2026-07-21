import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

export const hashPassword = async (plain) => {
  const salt = await bcrypt.genSalt(env.bcryptSaltRounds);
  return bcrypt.hash(plain, salt);
};

export const comparePassword = async (plain, hashed) => {
  return bcrypt.compare(plain, hashed);
};
