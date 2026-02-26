import express from 'express';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';
import { requireSubAdminOrHigher } from '../../middlewares/Auth/AdminMiddleware/roleMiddleware.js';
import { createZoneLocation, getAllLocations, getLocationByZone, addState, addCity, addZipCode, getStatesByZone, getCitiesByState, getZipCodesByCity, assignRegionalManager, updateLocation, deactivateLocation, searchByZipCode } from '../../core/controllers/Location/LocationController.js';

const locationRouter = express.Router();

// Protect all routes
locationRouter.use(ProtectUser);

// Zone (Location) routes
locationRouter.post('/create-zone', requireSubAdminOrHigher, createZoneLocation);
locationRouter.get('/all-zone', getAllLocations);
locationRouter.get('/zone/:zone', getLocationByZone);
locationRouter.put('/zone/:zone', requireSubAdminOrHigher, updateLocation);
locationRouter.delete('/zone/:zone', requireSubAdminOrHigher, deactivateLocation);

// State routes
locationRouter.post('/zone/:zone/add-state', requireSubAdminOrHigher, addState);
locationRouter.get('/zone/:zone/get-states', getStatesByZone);

// City routes
locationRouter.post('/zone/:zone/state/:stateId/city', requireSubAdminOrHigher, addCity);
locationRouter.get('/zone/:zone/state/:stateId/get-cities', getCitiesByState);

// Zip code routes
locationRouter.post('/zone/:zone/state/:stateId/city/:cityId/add-zipcode', requireSubAdminOrHigher, addZipCode);
locationRouter.get('/zone/:zone/state/:stateId/city/:cityId/get-zipcodes', getZipCodesByCity);

// Regional manager routes
locationRouter.put('/zone/:zone/regional-manager', requireSubAdminOrHigher, assignRegionalManager);

// Search routes
locationRouter.get('/search/zipcode/:zipCode', searchByZipCode);

export default locationRouter;
