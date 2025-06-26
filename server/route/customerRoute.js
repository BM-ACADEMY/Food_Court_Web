const express = require("express");
const router = express.Router();
const customerController = require("../controller/customerController");
const authMiddleware=require('../middleware/authMiddleware')

// Base: /api/customers

// Create
router.post("/create-customer", customerController.createCustomer);

// Get all
router.get("/fetch-all-customer", customerController.getCustomers);

router.get("/fetch-all-customer-details", customerController.getAllCustomerDetails);

// Get by ID
router.get("/fetch-customer-by-id/:id", customerController.getCustomerById);

// Get by QR code
router.get("/fetch-by-qr", customerController.getCustomerByQrCode);

// Update
router.put("/update-customer/:id", customerController.updateCustomer);

// Delete
router.delete("/delete-customer/:id", customerController.deleteCustomer);

router.get("/fetch-single-customer-details/:customerId", customerController.getCustomerDetails);

router.get("/fetch-single-customer-transaction/:customerId/transactions", customerController.getCustomerTransactions);

module.exports = router;