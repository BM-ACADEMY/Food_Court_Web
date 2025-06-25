const Restaurant = require("../model/restaurantModel");

// Create Restaurant
exports.createRestaurant = async (req, res) => {
  try {
    const {
      user_id,
      restaurant_name,
      location,
      qr_code,
    } = req.body;

    const restaurant = new Restaurant({
      user_id,
      restaurant_name,
      location,
      qr_code,
    });

    await restaurant.save();
    res.status(201).json({ success: true, data: restaurant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get All Restaurants
exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().populate("user_id", "name email");
    res.status(200).json({ success: true, data: restaurants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Restaurant by ID
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate("user_id");
    if (!restaurant)
      return res.status(404).json({ success: false, message: "Restaurant not found" });

    res.status(200).json({ success: true, data: restaurant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Restaurant by QR Code
exports.getRestaurantByQrCode = async (req, res) => {
  try {
    const { qr_code } = req.query;
    if (!qr_code) {
      return res.status(400).json({ success: false, message: "QR code is required" });
    }

    const restaurant = await Restaurant.findOne({ qr_code }).populate("user_id", "name email");
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "No restaurant found for this QR code" });
    }

    res.status(200).json({ success: true, data: restaurant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Restaurant
exports.updateRestaurant = async (req, res) => {
  try {
    const updated = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({ success: false, message: "Restaurant not found" });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Restaurant
exports.deleteRestaurant = async (req, res) => {
  try {
    const deleted = await Restaurant.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ success: false, message: "Restaurant not found" });

    res.status(200).json({ success: true, message: "Restaurant deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};