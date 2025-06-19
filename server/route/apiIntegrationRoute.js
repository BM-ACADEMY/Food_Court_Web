const express = require("express");
const router = express.Router();
const controller = require("../controller/apiIntegrationController");

// Base: /api/integrations

router.post("/create-api-integration", controller.createIntegration);
router.get("/fetch-all-api-integration", controller.getAllIntegrations);
router.get("/view/:id", controller.getIntegrationById);
router.put("/update-api-integration/:id", controller.updateIntegration);
router.delete("/delete-api-integration/:id", controller.deleteIntegration);

module.exports = router;
