const express = require("express");
const router = express.Router();
const subownerController = require("../controller/restaurantSubController");

// Base: /api/restaurant-subowners

// Create
router.post("/create-restaurant-sub", subownerController.createSubowner);

// Get all
router.get("/fetch-all-restaurant-sub", subownerController.getSubowners);

// Get by ID
router.get("/fetch-restaurant-sub-by-id/:id", subownerController.getSubownerById);

// Update
router.put("/update-restaurant-sub/:id", subownerController.updateSubowner);

// Delete
router.delete("/delete-restaurant-sub/:id", subownerController.deleteSubowner);

module.exports = router;
