const Customer = require("../model/customerModel");

// Existing controller functions (unchanged)
exports.createCustomer = async (req, res) => {
  try {
    const {
      user_id,
      registration_type,
      registration_fee_paid = false,
      qr_code,
    } = req.body;

    const customer = new Customer({
      user_id,
      registration_type,
      registration_fee_paid,
      qr_code,
    });

    await customer.save();
    res.status(201).json({ success: true, message: "User added Successfully", data: customer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().populate("user_id", "name email phone_number");
    res.status(200).json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate("user_id");
    if (!customer)
      return res.status(404).json({ success: false, message: "Customer not found" });

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!customer)
      return res.status(404).json({ success: false, message: "Customer not found" });

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer)
      return res.status(404).json({ success: false, message: "Customer not found" });

    res.status(200).json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// New function to fetch customer by QR code
exports.getCustomerByQrCode = async (req, res) => {
  try {
    const { qr_code } = req.query;
    if (!qr_code) {
      return res.status(400).json({ success: false, message: "QR code is required" });
    }

    const customer = await Customer.findOne({ qr_code }).populate("user_id", "name email phone_number");
    if (!customer) {
      return res.status(404).json({ success: false, message: "No customer found for this QR code" });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};