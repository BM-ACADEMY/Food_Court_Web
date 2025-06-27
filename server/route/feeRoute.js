const express = require('express');
const router = express.Router();
const feeController = require('../controller/feeController');

// Routes
router.post('/create-fee', feeController.createFee); // Create fee
router.get('/fetch-all-fees', feeController.getAllFees); // Get all fees
router.get('/fetch-fee-by-user-id/:user_id', feeController.getFeeByUserId); // Get fees by user_id
router.post('/fee-deduction', feeController.feeDeduction); // Fee deduction

module.exports = router;