const express = require("express");
const router = express.Router();
const locationController = require("../controller/locationController");

// Base: /api/locations

router.post("/create-location", locationController.createLocation);
router.get("/fetch-all-locations", locationController.getAllLocations);
router.get("/fetch-location-by-id/:id", locationController.getLocationById);
router.put("/update-location/:id", locationController.updateLocation);
router.delete("/delete-location/:id", locationController.deleteLocation);

module.exports = router;
