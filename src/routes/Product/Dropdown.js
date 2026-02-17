import express from 'express';
import {
  createGSTType, getAllGSTTypes, getGSTTypeById, updateGSTType, deleteGSTType,
  createPlant, getAllPlants, getPlantById, updatePlant, deletePlant,
  createLab, getAllLabs, getLabById, updateLab, deleteLab,
  createFittingCenter, getAllFittingCenters, getFittingCenterById, updateFittingCenter, deleteFittingCenter,
  createCreditDay, getAllCreditDays, getCreditDayById, updateCreditDay, deleteCreditDay,
  createCourierName, getAllCourierNames, getCourierNameById, updateCourierName, deleteCourierName,
  createCourierTime, getAllCourierTimes, getCourierTimeById, updateCourierTime, deleteCourierTime,
  createState, getAllStates, getStateById, updateState, deleteState,
  createCountry, getAllCountries, getCountryById, updateCountry, deleteCountry,
  createBillingCurrency, getAllBillingCurrencies, getBillingCurrencyById, updateBillingCurrency, deleteBillingCurrency,
  createSpecificLab, getAllSpecificLabs, getSpecificLabById, updateSpecificLab, deleteSpecificLab
} from '../../core/controllers/Product/DropdownController.js';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';

const dropdownRouter = express.Router();

dropdownRouter.use(ProtectUser);

// GST Type Routes
dropdownRouter.post('/gst-types', createGSTType);
dropdownRouter.get('/gst-types', getAllGSTTypes);
dropdownRouter.get('/gst-types/:id', getGSTTypeById);
dropdownRouter.put('/gst-types/:id', updateGSTType);
dropdownRouter.delete('/gst-types/:id', deleteGSTType);

// Plant Routes
dropdownRouter.post('/plants', createPlant);
dropdownRouter.get('/plants', getAllPlants);
dropdownRouter.get('/plants/:id', getPlantById);
dropdownRouter.put('/plants/:id', updatePlant);
dropdownRouter.delete('/plants/:id', deletePlant);

// Lab Routes
dropdownRouter.post('/labs', createLab);
dropdownRouter.get('/labs', getAllLabs);
dropdownRouter.get('/labs/:id', getLabById);
dropdownRouter.put('/labs/:id', updateLab);
dropdownRouter.delete('/labs/:id', deleteLab);

// Fitting Center Routes
dropdownRouter.post('/fitting-centers', createFittingCenter);
dropdownRouter.get('/fitting-centers', getAllFittingCenters);
dropdownRouter.get('/fitting-centers/:id', getFittingCenterById);
dropdownRouter.put('/fitting-centers/:id', updateFittingCenter);
dropdownRouter.delete('/fitting-centers/:id', deleteFittingCenter);

// Credit Day Routes
dropdownRouter.post('/credit-days', createCreditDay);
dropdownRouter.get('/credit-days', getAllCreditDays);
dropdownRouter.get('/credit-days/:id', getCreditDayById);
dropdownRouter.put('/credit-days/:id', updateCreditDay);
dropdownRouter.delete('/credit-days/:id', deleteCreditDay);

// Courier Name Routes
dropdownRouter.post('/courier-names', createCourierName);
dropdownRouter.get('/courier-names', getAllCourierNames);
dropdownRouter.get('/courier-names/:id', getCourierNameById);
dropdownRouter.put('/courier-names/:id', updateCourierName);
dropdownRouter.delete('/courier-names/:id', deleteCourierName);

// Courier Time Routes
dropdownRouter.post('/courier-times', createCourierTime);
dropdownRouter.get('/courier-times', getAllCourierTimes);
dropdownRouter.get('/courier-times/:id', getCourierTimeById);
dropdownRouter.put('/courier-times/:id', updateCourierTime);
dropdownRouter.delete('/courier-times/:id', deleteCourierTime);

// State Routes
dropdownRouter.post('/states', createState);
dropdownRouter.get('/states', getAllStates);
dropdownRouter.get('/states/:id', getStateById);
dropdownRouter.put('/states/:id', updateState);
dropdownRouter.delete('/states/:id', deleteState);

// Country Routes
dropdownRouter.post('/countries', createCountry);
dropdownRouter.get('/countries', getAllCountries);
dropdownRouter.get('/countries/:id', getCountryById);
dropdownRouter.put('/countries/:id', updateCountry);
dropdownRouter.delete('/countries/:id', deleteCountry);

// Billing Currency Routes
dropdownRouter.post('/billing-currencies', createBillingCurrency);
dropdownRouter.get('/billing-currencies', getAllBillingCurrencies);
dropdownRouter.get('/billing-currencies/:id', getBillingCurrencyById);
dropdownRouter.put('/billing-currencies/:id', updateBillingCurrency);
dropdownRouter.delete('/billing-currencies/:id', deleteBillingCurrency);

// Specific Lab Routes
dropdownRouter.post('/specific-labs', createSpecificLab);
dropdownRouter.get('/specific-labs', getAllSpecificLabs);
dropdownRouter.get('/specific-labs/:id', getSpecificLabById);
dropdownRouter.put('/specific-labs/:id', updateSpecificLab);
dropdownRouter.delete('/specific-labs/:id', deleteSpecificLab);

export default dropdownRouter;
