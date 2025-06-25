const express = require("express");
const router = express.Router();
const upiController = require("../controller/upiController");

router.post("/create-upi", upiController.createUpi);
router.get("/fetch-all-upis", upiController.getAllUpis);
router.get("/fetch-upi/:id", upiController.getUpiById);
router.put("/update-upi/:id", upiController.updateUpi);
router.delete("/delete-upi/:id", upiController.deleteUpi);

module.exports = router;