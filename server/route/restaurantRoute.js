const express = require("express");
const router = express.Router();
const restaurantController = require("../controller/restaurantController");

// Base: /api/restaurants

// Create
router.post("/create-restaurant", restaurantController.createRestaurant);

// Get all
router.get("/fetch-all-restaurant", restaurantController.getRestaurants);

// Get by ID
router.get("/fetch-restaurant-by-id/:id", restaurantController.getRestaurantById);

// Update
router.put("/update-restaurant/:id", restaurantController.updateRestaurant);

// Delete
router.delete("/delete-restaurant/:id", restaurantController.deleteRestaurant);

module.exports = router;
