const express =require('express')
const router = express.Router();
const dashboardController = require("../controller/dashboardController");

// Route to fetch dashboard statistics
router.get("/dashboard/stats", dashboardController.getDashboardStats);

// Route to fetch transactions with filtering
router.get("/transactions", dashboardController.getTransactions);

// Route to fetch all roles for user type dropdown
router.get("/roles/fetch-all-roles", dashboardController.getRoles);

// Route to export transaction data
router.get("/export", dashboardController.getExportData);

module.exports = router;