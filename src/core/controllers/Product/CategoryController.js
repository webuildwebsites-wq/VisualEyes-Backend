import Category from "../../../models/Product/Category.js";
import Brand from "../../../models/Product/Brand.js";
import { sendErrorResponse, sendSuccessResponse } from "../../../Utils/response/responseHandler.js";

export const createCategory = async (req, res) => {
  try {
    const { name, brand, description } = req.body;

    if (!name || !brand) {
      return sendErrorResponse(res, 400, "VALIDATION_ERROR", "Category name and brand are required");
    }

    const brandExists = await Brand.findById(brand);
    if (!brandExists) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Brand not found");
    }

    const existingCategory = await Category.findOne({ name, brand });
    if (existingCategory) {
      return sendErrorResponse(res, 409, "DUPLICATE_ERROR", "Category already exists for this brand");
    }

    const category = await Category.create({
      name,
      brand,
      description,
      createdBy: req.user._id,
    });

    const populatedCategory = await Category.findById(category._id).populate('brand', 'name');

    return sendSuccessResponse(res, 201, populatedCategory, "Category created successfully");
  } catch (error) {
    console.error("Create Category Error:", error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to create category");
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const { brand, isActive } = req.query;
    
    const filter = {};
    if (brand) filter.brand = brand;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const categories = await Category.find(filter)
      .populate('brand', 'name')
      .sort({ name: 1 });

    return sendSuccessResponse(res, 200, categories, "Categories retrieved successfully");
  } catch (error) {
    console.error("Get All Categories Error:", error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to retrieve categories");
  }
};

export const getCategoriesByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Brand not found");
    }

    const categories = await Category.find({ brand: brandId, isActive: true })
      .select('name description')
      .sort({ name: 1 });

    return sendSuccessResponse(
      res, 
      200, 
      { brand: brand.name, categories },
      "Categories retrieved successfully"
    );
  } catch (error) {
    console.error("Get Categories by Brand Error:", error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to retrieve categories");
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).populate('brand', 'name description');

    if (!category) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Category not found");
    }

    return sendSuccessResponse(res, 200, category, "Category retrieved successfully");
  } catch (error) {
    console.error("Get Category Error:", error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to retrieve category");
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, description, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Category not found");
    }
    if (brand && brand !== category.brand.toString()) {
      const brandExists = await Brand.findById(brand);
      if (!brandExists) {
        return sendErrorResponse(res, 404, "NOT_FOUND", "Brand not found");
      }
      category.brand = brand;
    }
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name, 
        brand: category.brand,
        _id: { $ne: id }
      });
      if (existingCategory) {
        return sendErrorResponse(res, 409, "DUPLICATE_ERROR", "Category name already exists for this brand");
      }
      category.name = name;
    }

    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    const updatedCategory = await Category.findById(id).populate('brand', 'name');

    return sendSuccessResponse(res, 200, updatedCategory, "Category updated successfully");
  } catch (error) {
    console.error("Update Category Error:", error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to update category");
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return sendErrorResponse(res, 404, "NOT_FOUND", "Category not found");
    }

    await Category.findByIdAndDelete(id);

    return sendSuccessResponse(res, 200, null, "Category deleted successfully");
  } catch (error) {
    console.error("Delete Category Error:", error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to delete category");
  }
};
