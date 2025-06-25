const express = require("express");
const router = express.Router();
const masterAdminController = require("../controller/masterAdminController");

// Base: /api/master-admins

router.post("/create-master-admin", masterAdminController.createMasterAdmin);
router.get("/fetch-all-master-admin", masterAdminController.getMasterAdmins);
router.get("/fetch-master-admin-by-id/:id", masterAdminController.getMasterAdminById);
router.put("/update-master-admin/:id", masterAdminController.updateMasterAdmin);
router.delete("/delete-master-admin/:id", masterAdminController.deleteMasterAdmin);

module.exports = router;
