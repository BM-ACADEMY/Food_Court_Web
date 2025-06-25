const Upi = require("../model/upiModel");

exports.createUpi = async (req, res) => {
  try {
    const { upiId, upiName } = req.body;
    if (!upiId || !upiName) {
      return res.status(400).json({ error: "UPI ID and UPI Name are required" });
    }
    const upi = new Upi({ upiId, upiName });
    await upi.save();
    res.status(201).json({ message: "UPI created successfully", upi });
  } catch (error) {
    console.error("Error creating UPI:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.getAllUpis = async (req, res) => {
  try {
    const upis = await Upi.find().sort({ created_at: -1 });
    res.status(200).json({ data: upis, total: upis.length });
  } catch (error) {
    console.error("Error fetching UPIs:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.getUpiById = async (req, res) => {
  try {
    const { id } = req.params;
    const upi = await Upi.findById(id);
    if (!upi) {
      return res.status(404).json({ error: "UPI not found" });
    }
    res.status(200).json({ upi });
  } catch (error) {
    console.error("Error fetching UPI:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.updateUpi = async (req, res) => {
  try {
    const { id } = req.params;
    const { upiId, upiName } = req.body;
    if (!upiId || !upiName) {
      return res.status(400).json({ error: "UPI ID and UPI Name are required" });
    }
    const upi = await Upi.findByIdAndUpdate(
      id,
      { upiId, upiName },
      { new: true, runValidators: true }
    );
    if (!upi) {
      return res.status(404).json({ error: "UPI not found" });
    }
    res.status(200).json({ message: "UPI updated successfully", upi });
  } catch (error) {
    console.error("Error updating UPI:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.deleteUpi = async (req, res) => {
  try {
    const { id } = req.params;
    const upi = await Upi.findByIdAndDelete(id);
    if (!upi) {
      return res.status(404).json({ error: "UPI not found" });
    }
    res.status(200).json({ message: "UPI deleted successfully" });
  } catch (error) {
    console.error("Error deleting UPI:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};