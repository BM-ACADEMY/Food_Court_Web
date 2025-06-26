const express = require("express");
const router = express.Router();
const controller = require("../controller/loginLogController");

// Base: /api/login-logs

router.post("/create-loginlog", controller.createLoginLog);
router.get("/fetch-all-loginlog", controller.getAllLoginLogs);
router.get("/fetch-all-loginlog-by-id/:id", controller.getLoginLogById);
router.put("/logout/:id", controller.updateLogoutTime);
router.delete("/delete-loginlog/:id", controller.deleteLoginLog);
router.put("/update-last-loginlog", controller.updateLastLoginLog);

module.exports = router;
