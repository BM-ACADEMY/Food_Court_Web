const ApiIntegration = require("../model/apiIntegrationModel");

// Create API Integration
exports.createIntegration = async (req, res) => {
  try {
    const { type, api_key, status = "Inactive" } = req.body;

    const integration = new ApiIntegration({ type, api_key, status });
    await integration.save();

    res.status(201).json({ success: true, data: integration });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get All Integrations
exports.getAllIntegrations = async (req, res) => {
  try {
    const integrations = await ApiIntegration.find().sort({ created_at: -1 });
    res.status(200).json({ success: true, data: integrations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Integration by ID
exports.getIntegrationById = async (req, res) => {
  try {
    const integration = await ApiIntegration.findById(req.params.id);
    if (!integration) {
      return res.status(404).json({ success: false, message: "Integration not found" });
    }
    res.status(200).json({ success: true, data: integration });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Integration
exports.updateIntegration = async (req, res) => {
  try {
    const updated = await ApiIntegration.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Integration not found" });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Integration
exports.deleteIntegration = async (req, res) => {
  try {
    const deleted = await ApiIntegration.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Integration not found" });
    }
    res.status(200).json({ success: true, message: "Integration deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
