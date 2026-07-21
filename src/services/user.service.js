import { User } from "../models/User.js";

export const createUser = async (payload, session) => {
  return User.create([{ ...payload }], session ? { session } : undefined).then((res) => res[0]);
};

export const findUserByEmail = async (email) => {
  return User.findOne({ email });
};

export const findUserById = async (id) => {
  return User.findById(id);
};

export const listUsersForEmail = async () => {
  return User.find({}).select("_id name email");
};
