const RestaurantSubowner = require("../model/restaurantSubModel");

// Create Subowner
exports.createSubowner = async (req, res) => {
  try {
    const { restaurant_id, user_id, refund_limit = 1000.00 } = req.body;

    const subowner = new RestaurantSubowner({
      restaurant_id,
      user_id,
      refund_limit,
    });

    await subowner.save();
    res.status(201).json({ success: true, data: subowner });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get all Subowners
exports.getSubowners = async (req, res) => {
  try {
    const subowners = await RestaurantSubowner.find()
      .populate("user_id", "name email phone_number")
      .populate("restaurant_id", "restaurant_name location");
    res.status(200).json({ success: true, data: subowners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Subowner by ID
exports.getSubownerById = async (req, res) => {
  try {
    const subowner = await RestaurantSubowner.findById(req.params.id)
      .populate("user_id")
      .populate("restaurant_id");

    if (!subowner)
      return res.status(404).json({ success: false, message: "Subowner not found" });

    res.status(200).json({ success: true, data: subowner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Subowner
exports.updateSubowner = async (req, res) => {
  try {
    const updated = await RestaurantSubowner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ success: false, message: "Subowner not found" });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Subowner
exports.deleteSubowner = async (req, res) => {
  try {
    const deleted = await RestaurantSubowner.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ success: false, message: "Subowner not found" });

    res.status(200).json({ success: true, message: "Subowner deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
