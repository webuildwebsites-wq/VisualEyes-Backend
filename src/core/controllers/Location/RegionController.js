import Region from '../../../models/Location/Region.js';
import City from '../../../models/Location/City.js';
import { sendSuccessResponse, sendErrorResponse } from '../../../Utils/response/responseHandler.js';

export const createRegion = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    const existingRegion = await Region.findOne({ 
      $or: [{ name }, { code }] 
    });

    if (existingRegion) {
      return sendErrorResponse(res, 400, 'REGION_EXISTS', 'Region with this name or code already exists');
    }

    const region = await Region.create({
      name,
      code,
      description,
      createdBy: req.user._id
    });

    return sendSuccessResponse(res, 201, region, 'Region created successfully');
  } catch (error) {
    console.error('Create Region Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to create region');
  }
};

export const getAllRegions = async (req, res) => {
  try {
    const { isActive, search } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const regions = await Region.find(filter)
      .populate('createdBy', 'employeeName email')
      .sort({ name: 1 });

    return sendSuccessResponse(res, 200, regions, 'Regions fetched successfully');
  } catch (error) {
    console.error('Get Regions Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to fetch regions');
  }
};

export const getRegionById = async (req, res) => {
  try {
    const { id } = req.params;

    const region = await Region.findById(id)
      .populate('createdBy', 'employeeName email')
      .populate({
        path: 'cities',
        match: { isActive: true }
      });

    if (!region) {
      return sendErrorResponse(res, 404, 'REGION_NOT_FOUND', 'Region not found');
    }

    return sendSuccessResponse(res, 200, region, 'Region fetched successfully');
  } catch (error) {
    console.error('Get Region Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to fetch region');
  }
};

export const updateRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, isActive } = req.body;

    const region = await Region.findById(id);
    if (!region) {
      return sendErrorResponse(res, 404, 'REGION_NOT_FOUND', 'Region not found');
    }

    if (name && name !== region.name) {
      const existingName = await Region.findOne({ name, _id: { $ne: id } });
      if (existingName) {
        return sendErrorResponse(res, 400, 'REGION_EXISTS', 'Region with this name already exists');
      }
    }

    if (code && code !== region.code) {
      const existingCode = await Region.findOne({ code, _id: { $ne: id } });
      if (existingCode) {
        return sendErrorResponse(res, 400, 'REGION_EXISTS', 'Region with this code already exists');
      }
    }

    const updatedRegion = await Region.findByIdAndUpdate(
      id,
      { name, code, description, isActive },
      { new: true, runValidators: true }
    );

    return sendSuccessResponse(res, 200, updatedRegion, 'Region updated successfully');
  } catch (error) {
    console.error('Update Region Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to update region');
  }
};

export const deleteRegion = async (req, res) => {
  try {
    const { id } = req.params;

    const citiesCount = await City.countDocuments({ regionId: id });
    if (citiesCount > 0) {
      return sendErrorResponse(res, 400, 'REGION_HAS_CITIES', 'Cannot delete region with associated cities');
    }

    const region = await Region.findByIdAndDelete(id);
    if (!region) {
      return sendErrorResponse(res, 404, 'REGION_NOT_FOUND', 'Region not found');
    }

    return sendSuccessResponse(res, 200, null, 'Region deleted successfully');
  } catch (error) {
    console.error('Delete Region Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to delete region');
  }
};
