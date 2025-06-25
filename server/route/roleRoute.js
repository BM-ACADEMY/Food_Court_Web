const express = require("express");
const router = express.Router();
const roleController = require("../controller/roleController");

router.post("/create-role", roleController.createRole);
router.get("/fetch-all-roles", roleController.getRoles);
router.get("/fetch-role-by-id/:id", roleController.getRoleById);
router.put("/update-role/:id", roleController.updateRole);
router.delete("/delete-role/:id", roleController.deleteRole);

module.exports = router;
