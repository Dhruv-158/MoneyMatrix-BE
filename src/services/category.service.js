import { Category } from "../models/Category.js";

const BUILTIN_CATEGORIES = ["Food", "Travel", "Salary", "Shopping", "Fuel", "Bills"];

export const createCategory = async (payload, session) => {
  return Category.create([{ ...payload }], session ? { session } : undefined).then((res) => res[0]);
};

export const updateCategory = async (categoryId, userId, payload) => {
  return Category.findOneAndUpdate({ _id: categoryId, userId }, payload, { new: true });
};

export const deleteCategory = async (categoryId, userId) => {
  return Category.findOneAndDelete({ _id: categoryId, userId });
};

export const getCategories = async (userId) => {
  return Category.find({ userId }).sort({ name: 1 });
};

export const getCategoryById = async (categoryId, userId) => {
  return Category.findOne({ _id: categoryId, userId });
};

export const createBuiltinCategories = async (userId, session) => {
  const docs = BUILTIN_CATEGORIES.map((name) => ({ userId, name, isBuiltin: true }));
  return Category.insertMany(docs, { ordered: false, session });
};
