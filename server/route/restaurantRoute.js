const express = require("express");
const router = express.Router();
const restaurantController = require("../controller/restaurantController");

// Base: /api/restaurants

// Create
router.post("/create-restaurant", restaurantController.createRestaurant);

// Get all
router.get("/fetch-all-restaurant", restaurantController.getRestaurants);

router.get("/fetch-all-restaurant-details", restaurantController.getAllRestaurantDetails);

router.get("/fetch-single-restaurant-details/:restaurantId", restaurantController.getRestaurantDetails);

router.get("/fetch-single-restaurant-transactions/:restaurantId/transactions", restaurantController.getRestaurantTransactions);

// Get by ID
router.get("/fetch-restaurant-by-id/:id", restaurantController.getRestaurantById);

// Get by QR code
router.get("/fetch-by-qr", restaurantController.getRestaurantByQrCode);

// Update
router.put("/update-restaurant/:id", restaurantController.updateRestaurant);

// Delete
router.delete("/delete-restaurant/:id", restaurantController.deleteRestaurant);

module.exports = router;