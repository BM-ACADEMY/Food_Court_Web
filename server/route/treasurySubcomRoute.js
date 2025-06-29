const express = require("express");
const router = express.Router();
const controller = require("../controller/treasurySubcomController");

// Base: /api/treasury-subcoms

router.post("/create-treasurysubcom", controller.createSubcom);
router.get("/fetch-all-treasurysubcom", controller.getAllSubcoms);
router.get("/fetch-all-treasurysubcom-details", controller.getAllTreasurySubcomDetails);
router.get("/fetch-session-report/:userId", controller.getSessionReport);

router.get("/fetch-single-treasurysubcom-transactions/:subcom/transactions", controller.getTreasuryTransactions);
router.get("/fetch-single-treasurysubcom-details/:subcom", controller.getTreasuryDetails);
router.get("/fetch-treasurysubcom-by-id/:id", controller.getSubcomById);
router.put("/update-treasurysubcom/:id", controller.updateSubcom);
router.delete("/delete-treasurysubcom/:id", controller.deleteSubcom);

module.exports = router;
1