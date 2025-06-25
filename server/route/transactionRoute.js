const express = require("express");
const router = express.Router();
const controller = require("../controller/transactionController");

// Base: /api/transactions

router.post("/create-transaction", controller.createTransaction);

router.post("/transfer", controller.transferFunds);
router.get("/fetch-all-transaction", controller.getAllTransactions);

router.get("/fetch-all-recent-transaction", controller.getAllRecentTransaction);
router.get("/history", controller.getTransactionHistory);


router.get("/fetch-transaction-by-id/:id", controller.getTransactionById);
// router.put("/update-transaction/:id", controller.updateTransaction);

router.put("/update-transaction/:transactionId", controller.updateTransaction);
router.delete("/delete-transaction/:id", controller.deleteTransaction);

module.exports = router;
