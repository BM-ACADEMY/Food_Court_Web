const Admin = require("../model/adminModel");

// Create Admin
exports.createAdmin = async (req, res) => {
  try {
    const {
      user_id,
      admin_to_admin_transfer_limit ,
      admin_to_subcom_transfer_limit ,
    } = req.body;

    const admin = new Admin({
      user_id,
      admin_to_admin_transfer_limit,
      admin_to_subcom_transfer_limit,
    });

    await admin.save();
    res.status(201).json({ success: true, data: admin });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get All Admins
exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().populate("user_id", "name email phone_number");
    res.status(200).json({ success: true, data: admins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Admin by ID
exports.getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).populate("user_id");
    if (!admin)
      return res.status(404).json({ success: false, message: "Admin not found" });

    res.status(200).json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Admin
exports.updateAdmin = async (req, res) => {
  try {
    const updated = await Admin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({ success: false, message: "Admin not found" });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Admin
exports.deleteAdmin = async (req, res) => {
  try {
    const deleted = await Admin.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ success: false, message: "Admin not found" });

    res.status(200).json({ success: true, message: "Admin deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
