import City from '../../../models/Location/City.js';
import Region from '../../../models/Location/Region.js';
import Zone from '../../../models/Location/Zone.js';
import { sendSuccessResponse, sendErrorResponse } from '../../../Utils/response/responseHandler.js';

export const createCity = async (req, res) => {
  try {
    const { name, code, regionId, description } = req.body;

    const region = await Region.findById(regionId);
    if (!region) {
      return sendErrorResponse(res, 404, 'REGION_NOT_FOUND', 'Region not found');
    }

    const existingCity = await City.findOne({ 
      regionId, 
      $or: [{ name }, { code }] 
    });

    if (existingCity) {
      return sendErrorResponse(res, 400, 'CITY_EXISTS', 'City with this name or code already exists in this region');
    }

    const city = await City.create({
      name,
      code,
      regionId,
      description,
      createdBy: req.user._id
    });

    return sendSuccessResponse(res, 201, city, 'City created successfully');
  } catch (error) {
    console.error('Create City Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to create city');
  }
};

export const getAllCities = async (req, res) => {
  try {
    const { regionId, isActive, search } = req.query;
    const filter = {};

    if (regionId) {
      filter.regionId = regionId;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const cities = await City.find(filter)
      .populate('regionId', 'name code')
      .populate('createdBy', 'employeeName email')
      .sort({ name: 1 });

    return sendSuccessResponse(res, 200, cities, 'Cities fetched successfully');
  } catch (error) {
    console.error('Get Cities Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to fetch cities');
  }
};

export const getCitiesByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;

    const region = await Region.findById(regionId);
    if (!region) {
      return sendErrorResponse(res, 404, 'REGION_NOT_FOUND', 'Region not found');
    }

    const cities = await City.find({ regionId, isActive: true })
      .populate('createdBy', 'employeeName email')
      .sort({ name: 1 });

    return sendSuccessResponse(res, 200, cities, 'Cities fetched successfully');
  } catch (error) {
    console.error('Get Cities by Region Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to fetch cities');
  }
};

export const getCityById = async (req, res) => {
  try {
    const { id } = req.params;

    const city = await City.findById(id)
      .populate('regionId', 'name code')
      .populate('createdBy', 'employeeName email')
      .populate({
        path: 'zones',
        match: { isActive: true }
      });

    if (!city) {
      return sendErrorResponse(res, 404, 'CITY_NOT_FOUND', 'City not found');
    }

    return sendSuccessResponse(res, 200, city, 'City fetched successfully');
  } catch (error) {
    console.error('Get City Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to fetch city');
  }
};

export const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, regionId, description, isActive } = req.body;

    const city = await City.findById(id);
    if (!city) {
      return sendErrorResponse(res, 404, 'CITY_NOT_FOUND', 'City not found');
    }

    if (regionId && regionId !== city.regionId.toString()) {
      const region = await Region.findById(regionId);
      if (!region) {
        return sendErrorResponse(res, 404, 'REGION_NOT_FOUND', 'Region not found');
      }
    }

    if (name && name !== city.name) {
      const existingName = await City.findOne({ 
        name, 
        regionId: regionId || city.regionId,
        _id: { $ne: id } 
      });
      if (existingName) {
        return sendErrorResponse(res, 400, 'CITY_EXISTS', 'City with this name already exists in this region');
      }
    }

    const updatedCity = await City.findByIdAndUpdate(
      id,
      { name, code, regionId, description, isActive },
      { new: true, runValidators: true }
    ).populate('regionId', 'name code');

    return sendSuccessResponse(res, 200, updatedCity, 'City updated successfully');
  } catch (error) {
    console.error('Update City Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to update city');
  }
};

export const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    const zonesCount = await Zone.countDocuments({ cityId: id });
    if (zonesCount > 0) {
      return sendErrorResponse(res, 400, 'CITY_HAS_ZONES', 'Cannot delete city with associated zones');
    }

    const city = await City.findByIdAndDelete(id);
    if (!city) {
      return sendErrorResponse(res, 404, 'CITY_NOT_FOUND', 'City not found');
    }

    return sendSuccessResponse(res, 200, null, 'City deleted successfully');
  } catch (error) {
    console.error('Delete City Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to delete city');
  }
};
