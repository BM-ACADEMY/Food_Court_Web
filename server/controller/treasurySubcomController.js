const TreasurySubcom = require("../model/treasurySubcomModel");

// Create Treasury Subcom
exports.createSubcom = async (req, res) => {
  try {
    const { user_id, top_up_limit = 5000.00 } = req.body;

    const subcom = new TreasurySubcom({
      user_id,
      top_up_limit,
    });

    await subcom.save();
    res.status(201).json({ success: true, data: subcom });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get all Treasury Subcom members
exports.getAllSubcoms = async (req, res) => {
  try {
    const subcoms = await TreasurySubcom.find().populate("user_id", "name email phone_number");
    res.status(200).json({ success: true, data: subcoms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get a Treasury Subcom by ID
exports.getSubcomById = async (req, res) => {
  try {
    const subcom = await TreasurySubcom.findById(req.params.id).populate("user_id");
    if (!subcom)
      return res.status(404).json({ success: false, message: "Subcom not found" });

    res.status(200).json({ success: true, data: subcom });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Treasury Subcom
exports.updateSubcom = async (req, res) => {
  try {
    const updated = await TreasurySubcom.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({ success: false, message: "Subcom not found" });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Treasury Subcom
exports.deleteSubcom = async (req, res) => {
  try {
    const deleted = await TreasurySubcom.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Subcom not found" });

    res.status(200).json({ success: true, message: "Subcom deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
