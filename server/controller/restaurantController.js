// const Restaurant = require("../model/restaurantModel");

// // Create Restaurant
// exports.createRestaurant = async (req, res) => {
//   try {
//     const {
//       user_id,
//       restaurant_name,
//       location,
//       qr_code,
//     } = req.body;

//     const restaurant = new Restaurant({
//       user_id,
//       restaurant_name,
//       location,
//       qr_code,
//     });

//     await restaurant.save();
//     res.status(201).json({ success: true, data: restaurant });
//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

// // Get All Restaurants
// exports.getRestaurants = async (req, res) => {
//   try {
//     const restaurants = await Restaurant.find().populate("user_id", "name email");
//     res.status(200).json({ success: true, data: restaurants });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // Get Restaurant by ID
// exports.getRestaurantById = async (req, res) => {
//   try {
//     const restaurant = await Restaurant.findById(req.params.id).populate("user_id");
//     if (!restaurant)
//       return res.status(404).json({ success: false, message: "Restaurant not found" });

//     res.status(200).json({ success: true, data: restaurant });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // Get Restaurant by QR Code
// exports.getRestaurantByQrCode = async (req, res) => {
//   try {
//     const { qr_code } = req.query;
//     if (!qr_code) {
//       return res.status(400).json({ success: false, message: "QR code is required" });
//     }

//     const restaurant = await Restaurant.findOne({ qr_code }).populate("user_id", "name email");
//     if (!restaurant) {
//       return res.status(404).json({ success: false, message: "No restaurant found for this QR code" });
//     }

//     res.status(200).json({ success: true, data: restaurant });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // Update Restaurant
// exports.updateRestaurant = async (req, res) => {
//   try {
//     const updated = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//     });

//     if (!updated)
//       return res.status(404).json({ success: false, message: "Restaurant not found" });

//     res.status(200).json({ success: true, data: updated });
//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

// // Delete Restaurant
// exports.deleteRestaurant = async (req, res) => {
//   try {
//     const deleted = await Restaurant.findByIdAndDelete(req.params.id);

//     if (!deleted)
//       return res.status(404).json({ success: false, message: "Restaurant not found" });

//     res.status(200).json({ success: true, message: "Restaurant deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

const Restaurant = require("../model/restaurantModel");
const mongoose = require("mongoose");

exports.createRestaurant = async (req, res) => {
  try {
    const {
      user_id,
      name,
      restaurant_name,
      location,
      qr_code,
      status = "Active",
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ success: false, message: "Invalid user_id format" });
    }

    const restaurant = new Restaurant({
      user_id,
      name,
      restaurant_name,
      location,
      qr_code,
      status,
    });

    await restaurant.save();
    res.status(201).json({ success: true, data: restaurant });
  } catch (err) {
    console.error("Create restaurant error:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate("user_id", "name email role_id")
      .select("name restaurant_name restaurant_id qr_code user_id status");
    res.status(200).json({ success: true, data: restaurants });
  } catch (err) {
    console.error("Fetch all restaurants error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid restaurant ID format" });
    }
    const restaurant = await Restaurant.findById(id)
      .populate("user_id", "name email role_id")
      .select("name restaurant_name restaurant_id qr_code user_id status");
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    res.status(200).json({ success: true, data: restaurant });
  } catch (err) {
    console.error("Fetch restaurant by ID error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRestaurantByQrCode = async (req, res) => {
  try {
    const { qr_code } = req.query;
    if (!qr_code) {
      return res.status(400).json({ success: false, message: "QR code is required" });
    }
    const restaurant = await Restaurant.findOne({ qr_code })
      .populate("user_id", "name email role_id")
      .select("name restaurant_name restaurant_id qr_code user_id status");
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "No restaurant found for this QR code" });
    }
    res.status(200).json({ success: true, data: restaurant });
  } catch (err) {
    console.error("Fetch restaurant by QR code error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid restaurant ID format" });
    }
    const updated = await Restaurant.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("Update restaurant error:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid restaurant ID format" });
    }
    const deleted = await Restaurant.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    res.status(200).json({ success: true, message: "Restaurant deleted successfully" });
  } catch (err) {
    console.error("Delete restaurant error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};