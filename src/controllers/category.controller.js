import { asyncHandler } from "../utils/asyncHandler.js";
import { createdResponse, successResponse, errorResponse } from "../utils/response.js";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategoryById
} from "../services/category.service.js";
import { resolveIconFields } from "../utils/iconResolver.js";

export const createCategoryController = asyncHandler(async (req, res) => {
  const iconFields = resolveIconFields({
    title: req.body.name,
    iconUrl: req.body.iconUrl,
    imageUrl: req.body.imageUrl
  });
  const category = await createCategory({ ...req.body, ...iconFields, userId: req.user.id });
  return createdResponse(res, "Category created", category);
});

export const getCategoriesController = asyncHandler(async (req, res) => {
  const categories = await getCategories(req.user.id);
  return successResponse(res, "Categories fetched", categories);
});

export const updateCategoryController = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.body.iconUrl || req.body.imageUrl || req.body.name) {
    const iconFields = resolveIconFields({
      title: req.body.name,
      iconUrl: req.body.iconUrl,
      imageUrl: req.body.imageUrl
    });
    updates.iconUrl = iconFields.iconUrl;
    updates.imageUrl = iconFields.imageUrl;
  }
  const category = await updateCategory(req.params.id, req.user.id, updates);
  if (!category) {
    return errorResponse(res, 404, "Category not found", { code: "CATEGORY_NOT_FOUND" });
  }
  return successResponse(res, "Category updated", category);
});

export const deleteCategoryController = asyncHandler(async (req, res) => {
  const category = await getCategoryById(req.params.id, req.user.id);
  if (!category) {
    return errorResponse(res, 404, "Category not found", { code: "CATEGORY_NOT_FOUND" });
  }
  if (category.isBuiltin) {
    return errorResponse(res, 400, "Built-in categories cannot be deleted", { code: "BUILTIN_CATEGORY" });
  }
  const deleted = await deleteCategory(req.params.id, req.user.id);
  return successResponse(res, "Category deleted", deleted);
});
