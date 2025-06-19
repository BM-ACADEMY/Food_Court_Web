const MasterAdmin = require("../model/masterAdminModel");

// Create Master Admin
exports.createMasterAdmin = async (req, res) => {
  try {
    const { user_id, point_creation_limit = 500000.00 } = req.body;

    const masterAdmin = new MasterAdmin({
      user_id,
      point_creation_limit,
    });

    await masterAdmin.save();
    res.status(201).json({ success: true, data: masterAdmin });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get All Master Admins
exports.getMasterAdmins = async (req, res) => {
  try {
    const masterAdmins = await MasterAdmin.find().populate("user_id", "name email phone_number");
    res.status(200).json({ success: true, data: masterAdmins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Master Admin by ID
exports.getMasterAdminById = async (req, res) => {
  try {
    const masterAdmin = await MasterAdmin.findById(req.params.id).populate("user_id");
    if (!masterAdmin) {
      return res.status(404).json({ success: false, message: "Master Admin not found" });
    }

    res.status(200).json({ success: true, data: masterAdmin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Master Admin
exports.updateMasterAdmin = async (req, res) => {
  try {
    const updated = await MasterAdmin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Master Admin not found" });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Master Admin
exports.deleteMasterAdmin = async (req, res) => {
  try {
    const deleted = await MasterAdmin.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Master Admin not found" });
    }

    res.status(200).json({ success: true, message: "Master Admin deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
