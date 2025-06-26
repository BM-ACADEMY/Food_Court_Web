const LoginLog = require("../model/loginLogModel");

// Create login log
exports.createLoginLog = async (req, res) => {
  try {
    const { user_id, login_time, logout_time, location_id, upi_id } = req.body;

    const newLog = new LoginLog({
      user_id,
      login_time,
      logout_time,
      location_id,
      upi_id,
    });

    await newLog.save();
    res.status(201).json({ success: true, data: newLog });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get all login logs
exports.getAllLoginLogs = async (req, res) => {
  try {
    const logs = await LoginLog.find()
      .populate("user_id", "name email phone_number")
      .populate("location_id", "name")
      .sort({ login_time: -1 });

    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get login log by ID
exports.getLoginLogById = async (req, res) => {
  try {
    const log = await LoginLog.findById(req.params.id)
      .populate("user_id", "name")
      .populate("location_id", "name");

    if (!log) {
      return res.status(404).json({ success: false, message: "Login log not found" });
    }

    res.status(200).json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update logout time (optional)
exports.updateLogoutTime = async (req, res) => {
  try {
    const { logout_time } = req.body;

    const updated = await LoginLog.findByIdAndUpdate(
      req.params.id,
      { logout_time },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Login log not found" });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete login log
exports.deleteLoginLog = async (req, res) => {
  try {
    const deleted = await LoginLog.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Login log not found" });
    }

    res.status(200).json({ success: true, message: "Login log deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update or create last login log
const mongoose = require("mongoose");

exports.updateLastLoginLog = async (req, res) => {
  try {
    const { user_id, location_id, upi_id, login_time } = req.body;

    // Validate required fields
    if (!user_id || !location_id || !upi_id || !login_time) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(location_id)) {
      return res.status(400).json({ success: false, message: "Invalid location ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(upi_id)) {
      return res.status(400).json({ success: false, message: "Invalid UPI ID" });
    }

    // Find the most recent login log for the user
    let loginLog = await LoginLog.findOne({ user_id }).sort({ login_time: -1 });

    if (loginLog) {
      // Update existing login log
      loginLog.location_id = location_id;
      loginLog.upi_id = upi_id;
      loginLog.login_time = login_time;
      loginLog.status = true;
      await loginLog.save();
    } else {
      // Create a new login log
      loginLog = new LoginLog({
        user_id,
        location_id,
        upi_id,
        login_time,
        status: true,
      });
      await loginLog.save();
    }

    res.status(200).json({ success: true, message: "Login log updated successfully", data: loginLog });
  } catch (err) {
    console.error("Error updating login log:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};