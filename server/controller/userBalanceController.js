const UserBalance = require("../model/userBalanceModel");
const User = require("../model/userModel");
const mongoose = require("mongoose");

// Create or Initialize Balance for a User
exports.createOrUpdateBalance = async (req, res) => {
  const { user_id, balance } = req.body;

  try {
    // Validate user_id
    if (!mongoose.isValidObjectId(user_id)) {
      return res.status(400).json({ success: false, message: "Invalid user_id" });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // Validate balance
    const parsedBalance = parseFloat(balance);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      return res.status(400).json({ success: false, message: "Invalid balance amount" });
    }

    const updated = await UserBalance.findOneAndUpdate(
      { user_id },
      { $set: { balance: parsedBalance.toFixed(2) } },
      { upsert: true, new: true }
    );

    console.log(`Balance updated for user ${user_id}: ${parsedBalance.toFixed(2)}`);

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating/creating balance:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Get Balance by User ID
exports.getBalanceByUserId = async (req, res) => {
  const { user_id } = req.params;

  try {
    if (!mongoose.isValidObjectId(user_id)) {
      return res.status(400).json({ success: false, message: "Invalid user_id" });
    }

    const balance = await UserBalance.findOne({ user_id });

    if (!balance) {
      return res.status(200).json({
        success: true,
        data: { user_id, balance: "0.00" },
      });
    }

    res.status(200).json({ success: true, data: balance });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get All Balances
exports.getAllUserBalances = async (req, res) => {
  try {
    const balances = await UserBalance.find().populate("user_id", "name email");
    res.status(200).json({ success: true, data: balances });
  } catch (error) {
    console.error("Error fetching all balances:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete Balance by ID
exports.deleteBalance = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await UserBalance.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    res.status(200).json({ success: true, message: "User balance deleted" });
  } catch (error) {
    console.error("Error deleting balance:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};