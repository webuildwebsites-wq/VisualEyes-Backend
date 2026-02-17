import GSTType from "../../../models/Product/GSTType.js";
import Plant from "../../../models/Product/Plant.js";
import Lab from "../../../models/Product/Lab.js";
import FittingCenter from "../../../models/Product/FittingCenter.js";
import CreditDay from "../../../models/Product/CreditDay.js";
import CourierName from "../../../models/Product/CourierName.js";
import CourierTime from "../../../models/Product/CourierTime.js";
import State from "../../../models/Product/State.js";
import Country from "../../../models/Product/Country.js";
import BillingCurrency from "../../../models/Product/BillingCurrency.js";
import SpecificLab from "../../../models/Product/SpecificLab.js";
import { sendErrorResponse, sendSuccessResponse } from "../../../Utils/response/responseHandler.js";

// Generic CRUD functions
const createGenericItem = (Model, itemName) => async (req, res) => {
  try {
    const { name, description, days, location, time } = req.body;

    if (Model.modelName === 'CreditDay' && days === undefined) {
      return sendErrorResponse(res, 400, "VALIDATION_ERROR", `${itemName} days is required`);
    }

    if (Model.modelName === 'CourierTime' && (!location || !time)) {
      return sendErrorResponse(res, 400, "VALIDATION_ERROR", "Location and time are required");
    }

    if (Model.modelName !== 'CreditDay' && Model.modelName !== 'CourierTime' && !name) {
      return sendErrorResponse(res, 400, "VALIDATION_ERROR", `${itemName} name is required`);
    }

    const query = Model.modelName === 'CreditDay' 
      ? { days } 
      : Model.modelName === 'CourierTime'
      ? { location: location.trim(), time: time.trim() }
      : { name: name.trim() };

    const existingItem = await Model.findOne(query);
    if (existingItem) {
      return sendErrorResponse(res, 409, "DUPLICATE_ERROR", `${itemName} already exists`);
    }

    const itemData = Model.modelName === 'CreditDay'
      ? { days, description, createdBy: req.user._id }
      : Model.modelName === 'CourierTime'
      ? { location: location.trim(), time: time.trim(), description, createdBy: req.user._id }
      : { name: name.trim(), description, createdBy: req.user._id };

    const item = await Model.create(itemData);

    return sendSuccessResponse(res, 201, item, `${itemName} created successfully`);
  } catch (error) {
    console.error(`Create ${itemName} Error:`, error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", `Failed to create ${itemName}`);
  }
};

const getAllGenericItems = (Model, itemName) => async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const sortField = Model.modelName === 'CreditDay' ? { days: 1 } : { name: 1 };
    const items = await Model.find(filter).sort(sortField);

    return sendSuccessResponse(res, 200, items, `${itemName}s retrieved successfully`);
  } catch (error) {
    console.error(`Get All ${itemName}s Error:`, error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", `Failed to retrieve ${itemName}s`);
  }
};

const getGenericItemById = (Model, itemName) => async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Model.findById(id);

    if (!item) {
      return sendErrorResponse(res, 404, "NOT_FOUND", `${itemName} not found`);
    }

    return sendSuccessResponse(res, 200, item, `${itemName} retrieved successfully`);
  } catch (error) {
    console.error(`Get ${itemName} Error:`, error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", `Failed to retrieve ${itemName}`);
  }
};

const updateGenericItem = (Model, itemName) => async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, days, location, time } = req.body;

    const item = await Model.findById(id);
    if (!item) {
      return sendErrorResponse(res, 404, "NOT_FOUND", `${itemName} not found`);
    }

    if (Model.modelName === 'CreditDay' && days !== undefined && days !== item.days) {
      const existingItem = await Model.findOne({ days });
      if (existingItem) {
        return sendErrorResponse(res, 409, "DUPLICATE_ERROR", `${itemName} days already exists`);
      }
      item.days = days;
    }

    if (Model.modelName === 'CourierTime') {
      if (location && location.trim() !== item.location || time && time.trim() !== item.time) {
        const existingItem = await Model.findOne({ 
          location: location ? location.trim() : item.location, 
          time: time ? time.trim() : item.time,
          _id: { $ne: id }
        });
        if (existingItem) {
          return sendErrorResponse(res, 409, "DUPLICATE_ERROR", `${itemName} already exists`);
        }
        if (location) item.location = location.trim();
        if (time) item.time = time.trim();
      }
    }

    if (Model.modelName !== 'CreditDay' && Model.modelName !== 'CourierTime' && name && name.trim() !== item.name) {
      const existingItem = await Model.findOne({ name: name.trim() });
      if (existingItem) {
        return sendErrorResponse(res, 409, "DUPLICATE_ERROR", `${itemName} name already exists`);
      }
      item.name = name.trim();
    }

    if (description !== undefined) item.description = description;
    if (isActive !== undefined) item.isActive = isActive;

    await item.save();

    return sendSuccessResponse(res, 200, item, `${itemName} updated successfully`);
  } catch (error) {
    console.error(`Update ${itemName} Error:`, error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", `Failed to update ${itemName}`);
  }
};

const deleteGenericItem = (Model, itemName) => async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Model.findById(id);
    if (!item) {
      return sendErrorResponse(res, 404, "NOT_FOUND", `${itemName} not found`);
    }

    await Model.findByIdAndDelete(id);

    return sendSuccessResponse(res, 200, null, `${itemName} deleted successfully`);
  } catch (error) {
    console.error(`Delete ${itemName} Error:`, error);
    return sendErrorResponse(res, 500, "INTERNAL_ERROR", `Failed to delete ${itemName}`);
  }
};

// GST Type
export const createGSTType = createGenericItem(GSTType, "GST type");
export const getAllGSTTypes = getAllGenericItems(GSTType, "GST type");
export const getGSTTypeById = getGenericItemById(GSTType, "GST type");
export const updateGSTType = updateGenericItem(GSTType, "GST type");
export const deleteGSTType = deleteGenericItem(GSTType, "GST type");

// Plant
export const createPlant = createGenericItem(Plant, "Plant");
export const getAllPlants = getAllGenericItems(Plant, "Plant");
export const getPlantById = getGenericItemById(Plant, "Plant");
export const updatePlant = updateGenericItem(Plant, "Plant");
export const deletePlant = deleteGenericItem(Plant, "Plant");

// Lab
export const createLab = createGenericItem(Lab, "Lab");
export const getAllLabs = getAllGenericItems(Lab, "Lab");
export const getLabById = getGenericItemById(Lab, "Lab");
export const updateLab = updateGenericItem(Lab, "Lab");
export const deleteLab = deleteGenericItem(Lab, "Lab");

// Fitting Center
export const createFittingCenter = createGenericItem(FittingCenter, "Fitting center");
export const getAllFittingCenters = getAllGenericItems(FittingCenter, "Fitting center");
export const getFittingCenterById = getGenericItemById(FittingCenter, "Fitting center");
export const updateFittingCenter = updateGenericItem(FittingCenter, "Fitting center");
export const deleteFittingCenter = deleteGenericItem(FittingCenter, "Fitting center");

// Credit Day
export const createCreditDay = createGenericItem(CreditDay, "Credit day");
export const getAllCreditDays = getAllGenericItems(CreditDay, "Credit day");
export const getCreditDayById = getGenericItemById(CreditDay, "Credit day");
export const updateCreditDay = updateGenericItem(CreditDay, "Credit day");
export const deleteCreditDay = deleteGenericItem(CreditDay, "Credit day");

// Courier Name
export const createCourierName = createGenericItem(CourierName, "Courier name");
export const getAllCourierNames = getAllGenericItems(CourierName, "Courier name");
export const getCourierNameById = getGenericItemById(CourierName, "Courier name");
export const updateCourierName = updateGenericItem(CourierName, "Courier name");
export const deleteCourierName = deleteGenericItem(CourierName, "Courier name");

// Courier Time
export const createCourierTime = createGenericItem(CourierTime, "Courier time");
export const getAllCourierTimes = getAllGenericItems(CourierTime, "Courier time");
export const getCourierTimeById = getGenericItemById(CourierTime, "Courier time");
export const updateCourierTime = updateGenericItem(CourierTime, "Courier time");
export const deleteCourierTime = deleteGenericItem(CourierTime, "Courier time");

// State
export const createState = createGenericItem(State, "State");
export const getAllStates = getAllGenericItems(State, "State");
export const getStateById = getGenericItemById(State, "State");
export const updateState = updateGenericItem(State, "State");
export const deleteState = deleteGenericItem(State, "State");

// Country
export const createCountry = createGenericItem(Country, "Country");
export const getAllCountries = getAllGenericItems(Country, "Country");
export const getCountryById = getGenericItemById(Country, "Country");
export const updateCountry = updateGenericItem(Country, "Country");
export const deleteCountry = deleteGenericItem(Country, "Country");

// Billing Currency
export const createBillingCurrency = createGenericItem(BillingCurrency, "Billing currency");
export const getAllBillingCurrencies = getAllGenericItems(BillingCurrency, "Billing currency");
export const getBillingCurrencyById = getGenericItemById(BillingCurrency, "Billing currency");
export const updateBillingCurrency = updateGenericItem(BillingCurrency, "Billing currency");
export const deleteBillingCurrency = deleteGenericItem(BillingCurrency, "Billing currency");

// Specific Lab
export const createSpecificLab = createGenericItem(SpecificLab, "Specific lab");
export const getAllSpecificLabs = getAllGenericItems(SpecificLab, "Specific lab");
export const getSpecificLabById = getGenericItemById(SpecificLab, "Specific lab");
export const updateSpecificLab = updateGenericItem(SpecificLab, "Specific lab");
export const deleteSpecificLab = deleteGenericItem(SpecificLab, "Specific lab");
