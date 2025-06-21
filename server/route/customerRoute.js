const express = require("express");
const router = express.Router();
const customerController = require("../controller/customerController");

// Base: /api/customers

// Create
router.post("/create-customer", customerController.createCustomer);

// Get all
router.get("/fetch-all-customer", customerController.getCustomers);

// Get by ID
router.get("/fetch-customer-by-id/:id", customerController.getCustomerById);

// Update
router.put("/update-customer/:id", customerController.updateCustomer);

// Delete
router.delete("/delete-customer/:id", customerController.deleteCustomer);

module.exports = router;
