const express = require('express');
const router = express.Router();
const userBalanceController = require('../controller/userBalanceController');

// Routes
router.post('/create-or-update-balance', userBalanceController.createOrUpdateBalance); // create or update
router.get('/fetch-all-balance', userBalanceController.getAllUserBalances); // list all

router.get('/dashboard-summary', userBalanceController.getDashboardSummary); // list all
router.get('/fetch-balance-by-id/:user_id', userBalanceController.getBalanceByUserId); // get by user_id
router.delete('/delete-balance/:id', userBalanceController.deleteBalance); // delete by balance _id

module.exports = router;