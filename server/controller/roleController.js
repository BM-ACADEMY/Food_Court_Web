const Role = require("../model/roleModel");

// Create Role
exports.createRole = async (req, res) => {
  try {
    const { name } = req.body;
    const role = new Role({ name });
    await role.save();
    res.status(201).json({ success: true, data: role });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get All Roles
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ created_at: -1 });
    res.status(200).json({ success: true, data: roles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Single Role
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findOne({ role_id: req.params.id });
    if (!role) return res.status(404).json({ success: false, message: "Role not found" });
    res.status(200).json({ success: true, data: role });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Role
exports.updateRole = async (req, res) => {
  try {
    const role = await Role.findOneAndUpdate(
      { role_id: req.params.id },
      { name: req.body.name },
      { new: true }
    );
    if (!role) return res.status(404).json({ success: false, message: "Role not found" });
    res.status(200).json({ success: true, data: role });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Role
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findOneAndDelete({ role_id: req.params.id });
    if (!role) return res.status(404).json({ success: false, message: "Role not found" });
    res.status(200).json({ success: true, message: "Role deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
