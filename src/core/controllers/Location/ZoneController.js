import Zone from '../../../models/Location/Zone.js';
import City from '../../../models/Location/City.js';
import { sendSuccessResponse, sendErrorResponse } from '../../../Utils/response/responseHandler.js';

export const createZone = async (req, res) => {
  try {
    const { name, code, cityId, description } = req.body;

    const city = await City.findById(cityId);
    if (!city) {
      return sendErrorResponse(res, 404, 'CITY_NOT_FOUND', 'City not found');
    }

    const existingZone = await Zone.findOne({ 
      cityId, 
      $or: [{ name }, { code }] 
    });

    if (existingZone) {
      return sendErrorResponse(res, 400, 'ZONE_EXISTS', 'Zone with this name or code already exists in this city');
    }

    const zone = await Zone.create({
      name,
      code,
      cityId,
      description,
      createdBy: req.user._id
    });

    return sendSuccessResponse(res, 201, zone, 'Zone created successfully');
  } catch (error) {
    console.error('Create Zone Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to create zone');
  }
};

export const getAllZones = async (req, res) => {
  try {
    const { cityId, isActive, search } = req.query;
    const filter = {};

    if (cityId) {
      filter.cityId = cityId;
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

    const zones = await Zone.find(filter)
      .populate({
        path: 'cityId',
        select: 'name code regionId',
        populate: {
          path: 'regionId',
          select: 'name code'
        }
      })
      .populate('createdBy', 'employeeName email')
      .sort({ name: 1 });

    return sendSuccessResponse(res, 200, zones, 'Zones fetched successfully');
  } catch (error) {
    console.error('Get Zones Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to fetch zones');
  }
};

export const getZonesByCity = async (req, res) => {
  try {
    const { cityId } = req.params;

    const city = await City.findById(cityId);
    if (!city) {
      return sendErrorResponse(res, 404, 'CITY_NOT_FOUND', 'City not found');
    }

    const zones = await Zone.find({ cityId, isActive: true })
      .populate('createdBy', 'employeeName email')
      .sort({ name: 1 });

    return sendSuccessResponse(res, 200, zones, 'Zones fetched successfully');
  } catch (error) {
    console.error('Get Zones by City Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to fetch zones');
  }
};

export const getZoneById = async (req, res) => {
  try {
    const { id } = req.params;

    const zone = await Zone.findById(id)
      .populate({
        path: 'cityId',
        select: 'name code regionId',
        populate: {
          path: 'regionId',
          select: 'name code'
        }
      })
      .populate('createdBy', 'employeeName email');

    if (!zone) {
      return sendErrorResponse(res, 404, 'ZONE_NOT_FOUND', 'Zone not found');
    }

    return sendSuccessResponse(res, 200, zone, 'Zone fetched successfully');
  } catch (error) {
    console.error('Get Zone Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to fetch zone');
  }
};

export const updateZone = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, cityId, description, isActive } = req.body;

    const zone = await Zone.findById(id);
    if (!zone) {
      return sendErrorResponse(res, 404, 'ZONE_NOT_FOUND', 'Zone not found');
    }

    if (cityId && cityId !== zone.cityId.toString()) {
      const city = await City.findById(cityId);
      if (!city) {
        return sendErrorResponse(res, 404, 'CITY_NOT_FOUND', 'City not found');
      }
    }

    if (name && name !== zone.name) {
      const existingName = await Zone.findOne({ 
        name, 
        cityId: cityId || zone.cityId,
        _id: { $ne: id } 
      });
      if (existingName) {
        return sendErrorResponse(res, 400, 'ZONE_EXISTS', 'Zone with this name already exists in this city');
      }
    }

    const updatedZone = await Zone.findByIdAndUpdate(
      id,
      { name, code, cityId, description, isActive },
      { new: true, runValidators: true }
    ).populate({
      path: 'cityId',
      select: 'name code regionId',
      populate: {
        path: 'regionId',
        select: 'name code'
      }
    });

    return sendSuccessResponse(res, 200, updatedZone, 'Zone updated successfully');
  } catch (error) {
    console.error('Update Zone Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to update zone');
  }
};

export const deleteZone = async (req, res) => {
  try {
    const { id } = req.params;

    const zone = await Zone.findByIdAndDelete(id);
    if (!zone) {
      return sendErrorResponse(res, 404, 'ZONE_NOT_FOUND', 'Zone not found');
    }

    return sendSuccessResponse(res, 200, null, 'Zone deleted successfully');
  } catch (error) {
    console.error('Delete Zone Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to delete zone');
  }
};
