const express = require("express");
const router = express.Router();
const controller = require("../controller/transactionController");

// Base: /api/transactions

router.post("/create-transaction", controller.createTransaction);

router.post("/transfer", controller.transferFunds);

router.get("/fetch-all-transaction", controller.getAllTransactions);


router.get(
  "/fetch-treasury-subcom-restaurant-history",
  controller.getTransactionTreasuryRestaurantHistory
);




router.get("/history", controller.getTransactionHistory);


router.post("/process-payment", controller.processPayment);

router.get("/fetch-all-recent-transaction", controller.getAllRecentTransaction);


router.get("/fetch-transaction-by-id/:id", controller.getTransactionById);
// router.put("/update-transaction/:id", controller.updateTransaction);

router.put("/update-transaction/:transactionId", controller.updateTransaction);

router.delete("/delete-transaction/:id", controller.deleteTransaction);
router.get("/history/user/:userId", controller.getTransactionHistoryByUserId);
router.get("/history/user/:userId/export", controller.exportTransactionHistoryByUserId);
router.get("/history/user/:userId/detailed", controller.getUserTransactionHistory);
router.get("/types", controller.getTransactionTypes);
router.get("/fetch-treasury-subcom-restaurant-history", controller.getTransactionTreasuryRestaurantHistory);
router.get("/today-balance/:userId", controller.getTodayBalance);
module.exports = router;