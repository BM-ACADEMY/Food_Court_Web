const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");

// Base: /api/admins

router.post("/create-admin", adminController.createAdmin);
router.get("/fetch-all-admins", adminController.getAdmins);
router.get("/fetch-single-admin-details/:adminId", adminController.getAdminDetails);
router.get("/fetch-single-admins-transactions/:adminId/transactions", adminController.getAdminTransactions);

router.get("/fetch-all-admins-details", adminController.getAllAdminDetails);
router.get("/fetch-admin-by-id/:id", adminController.getAdminById);
router.put("/update-admin/:id", adminController.updateAdmin);
router.delete("/delete-admin/:id", adminController.deleteAdmin);

module.exports = router;
