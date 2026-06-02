const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const authMiddleware = require("../middleware/authMiddleware");

// All product routes should be accessible by the restaurant
// and we'll apply authMiddleware to ensure the user is logged in
router.use(authMiddleware);

// Create a new product
router.post("/create", productController.createProduct);

// Get products for the logged-in restaurant
router.get("/fetch-by-restaurant", productController.getProductsByRestaurant);

// Update a product by ID
router.put("/update/:id", productController.updateProduct);

// Delete a product by ID
router.delete("/delete/:id", productController.deleteProduct);

// Customer facing route: Get products by restaurant's ID
router.get("/customer/fetch-by-restaurant/:id", productController.getProductsForCustomer);

module.exports = router;
