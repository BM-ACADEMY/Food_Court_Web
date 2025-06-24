const Role = require("../model/roleModel");

// Create Role
exports.createRole = async (req, res) => {
  try {
    let { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    name = name.trim();

    if (name.length < 3 || name.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Role name must be between 3 and 50 characters',
      });
    }

    const isValidName = /^[a-zA-Z0-9\s-]+$/.test(name);
    if (!isValidName) {
      return res.status(400).json({
        success: false,
        message: 'Role name contains invalid characters',
      });
    }

    const existingRole = await Role.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });

    if (existingRole) {
      return res.status(409).json({ success: false, message: 'Role already exists' });
    }

    const role = new Role({ name });
    await role.save();

    res.status(201).json({
      success: true,
      message: 'Role Added Successfully',
      data: role,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Get All Roles
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ created_at: -1 });
    res.status(200).json({ success: true,message:"Fetch role successfully", data: roles });
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
    const { name } = req.body;
    const { id } = req.params;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 3 || trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Role name must be between 3 and 50 characters',
      });
    }

    const isValidName = /^[a-zA-Z0-9\s-]+$/.test(trimmedName);
    if (!isValidName) {
      return res.status(400).json({
        success: false,
        message: 'Role name contains invalid characters',
      });
    }

    // Check for duplicate name in other roles
    const duplicate = await Role.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      _id: { $ne: id }, // Exclude the current role
    });

    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Role name already in use' });
    }

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      { name: trimmedName },
      { new: true }
    );

    if (!updatedRole) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    res.status(200).json({ success: true, message: 'Role updated successfully', data: updatedRole });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
