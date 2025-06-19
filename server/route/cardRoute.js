const express = require("express");
const router = express.Router();
const cardController = require("../controller/cardController");

// Base: /api/cards

router.post("/create-card", cardController.createCard);
router.get("/fetch-all-card", cardController.getAllCards);
router.get("/fetch-card-by-id/:id", cardController.getCardById);
router.put("/update-card/:id", cardController.updateCard);
router.delete("/delete-card/:id", cardController.deleteCard);

module.exports = router;
