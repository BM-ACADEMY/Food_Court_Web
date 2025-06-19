const Location = require("../model/locationModel");

// Create Location
exports.createLocation = async (req, res) => {
  try {
    const { name } = req.body;

    const location = new Location({ name });
    await location.save();

    res.status(201).json({ success: true, data: location });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get all Locations
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ created_at: -1 });
    res.status(200).json({ success: true, data: locations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Location by ID
exports.getLocationById = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location)
      return res.status(404).json({ success: false, message: "Location not found" });

    res.status(200).json({ success: true, data: location });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Location
exports.updateLocation = async (req, res) => {
  try {
    const updated = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated)
      return res.status(404).json({ success: false, message: "Location not found" });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Location
exports.deleteLocation = async (req, res) => {
  try {
    const deleted = await Location.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Location not found" });

    res.status(200).json({ success: true, message: "Location deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
