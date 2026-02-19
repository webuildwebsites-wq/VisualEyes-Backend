import express from 'express';
import { createCity, getAllCities, getCitiesByRegion, getCityById, updateCity, deleteCity } from '../../core/controllers/Location/CityController.js';
import { ProtectUser } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';
import { createRegion, getAllRegions, getRegionById, updateRegion, deleteRegion } from '../../core/controllers/Location/RegionController.js';
import { createZone, getAllZones, getZonesByCity, getZoneById, updateZone, deleteZone } from '../../core/controllers/Location/ZoneController.js';
const locationRouter = express.Router();

locationRouter.post('/add-region', ProtectUser, createRegion);
locationRouter.get('/get-all-region', ProtectUser, getAllRegions);
locationRouter.get('/get-region/:id', ProtectUser, getRegionById);
locationRouter.put('/update-region/:id', ProtectUser, updateRegion);
locationRouter.delete('/delete-region/:id', ProtectUser, deleteRegion);

locationRouter.post('/add-city', ProtectUser, createCity);
locationRouter.get('/get-all-city', ProtectUser, getAllCities);
locationRouter.get('/get-city-by-region/:regionId', ProtectUser, getCitiesByRegion);
locationRouter.get('/get-city/:id', ProtectUser, getCityById);
locationRouter.put('/update-city/:id', ProtectUser, updateCity);
locationRouter.delete('/delete-city/:id', ProtectUser, deleteCity);

locationRouter.post('/add-zone', ProtectUser, createZone);
locationRouter.get('/get-all-zones', ProtectUser, getAllZones);
locationRouter.get('/get-zone-by-city/:cityId', ProtectUser, getZonesByCity);
locationRouter.get('/get-zone/:id', ProtectUser, getZoneById);
locationRouter.put('/update-zone/:id', ProtectUser, updateZone);
locationRouter.delete('/delete-zone/:id', ProtectUser, deleteZone);

export default locationRouter;
