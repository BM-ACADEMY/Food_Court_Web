const Customer = require("../model/customerModel");

// Create Customer
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
    res.status(201).json({ success: true,message:"User added Successfully", data: customer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get All Customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().populate("user_id", "name email phone_number");
    res.status(200).json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Customer by ID
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

// Update Customer
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

// Delete Customer
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
