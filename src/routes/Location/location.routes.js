import express from 'express';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';
import { requireSubAdminOrHigher } from '../../middlewares/Auth/AdminMiddleware/roleMiddleware.js';
import {
  createLocation,
  getAllLocations,
  getLocationByZone,
  addState,
  addCity,
  addZipCode,
  getStatesByZone,
  getCitiesByState,
  getZipCodesByCity,
  assignRegionalManager,
  updateLocation,
  deactivateLocation,
  searchByZipCode
} from '../../core/controllers/Location/LocationController.js';

const locationRouter = express.Router();

// Protect all routes
locationRouter.use(ProtectUser);

// Zone (Location) routes
locationRouter.post('/create', requireSubAdminOrHigher, createLocation);
locationRouter.get('/all', getAllLocations);
locationRouter.get('/zone/:zone', getLocationByZone);
locationRouter.put('/zone/:zone', requireSubAdminOrHigher, updateLocation);
locationRouter.delete('/zone/:zone', requireSubAdminOrHigher, deactivateLocation);

// State routes
locationRouter.post('/zone/:zone/state', requireSubAdminOrHigher, addState);
locationRouter.get('/zone/:zone/states', getStatesByZone);

// City routes
locationRouter.post('/zone/:zone/state/:stateName/city', requireSubAdminOrHigher, addCity);
locationRouter.get('/zone/:zone/state/:stateName/cities', getCitiesByState);

// Zip code routes
locationRouter.post('/zone/:zone/state/:stateName/city/:cityName/zipcode', requireSubAdminOrHigher, addZipCode);
locationRouter.get('/zone/:zone/state/:stateName/city/:cityName/zipcodes', getZipCodesByCity);

// Regional manager routes
locationRouter.put('/zone/:zone/regional-manager', requireSubAdminOrHigher, assignRegionalManager);

// Search routes
locationRouter.get('/search/zipcode/:zipCode', searchByZipCode);

export default locationRouter;
