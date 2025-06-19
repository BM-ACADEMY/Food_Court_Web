const Card = require("../model/cardModel");

// Create a card
exports.createCard = async (req, res) => {
  try {
    const { customer_id, qr_code, status = "Active" } = req.body;

    const newCard = new Card({
      customer_id,
      qr_code,
      status,
    });

    await newCard.save();
    res.status(201).json({ success: true, data: newCard });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get all cards
exports.getAllCards = async (req, res) => {
  try {
    const cards = await Card.find()
      .populate("customer_id", "user_id registration_type qr_code");
    res.status(200).json({ success: true, data: cards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get a card by ID
exports.getCardById = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id)
      .populate("customer_id", "user_id registration_type qr_code");
    if (!card) {
      return res.status(404).json({ success: false, message: "Card not found" });
    }

    res.status(200).json({ success: true, data: card });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update a card
exports.updateCard = async (req, res) => {
  try {
    const updated = await Card.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Card not found" });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete a card
exports.deleteCard = async (req, res) => {
  try {
    const deleted = await Card.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Card not found" });
    }

    res.status(200).json({ success: true, message: "Card deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
