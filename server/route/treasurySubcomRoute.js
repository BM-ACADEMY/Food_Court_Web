const express = require("express");
const router = express.Router();
const controller = require("../controller/treasurySubcomController");

// Base: /api/treasury-subcoms

router.post("/create-treasurysubcom", controller.createSubcom);
router.get("/fetch-all-treasurysubcom", controller.getAllSubcoms);
router.get("/fetch-treasurysubcom-by-id/:id", controller.getSubcomById);
router.put("/update-treasurysubcom/:id", controller.updateSubcom);
router.delete("/delete-treasurysubcom/:id", controller.deleteSubcom);

module.exports = router;
