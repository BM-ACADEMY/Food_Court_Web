const Fee = require('../model/feeModel');

// Create Fee Record
exports.createFee = async (req, res) => {
  try {
    const { user_id, amount } = req.body;

    if (!user_id || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user_id or amount' });
    }

    const fee = new Fee({
      user_id,
      amount,
    });

    await fee.save();
    res.status(201).json({ success: true, data: fee });
  } catch (err) {
    console.error('Error creating fee:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get All Fees
exports.getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find().populate('user_id', 'name email');
    res.status(200).json({ success: true, data: fees });
  } catch (err) {
    console.error('Error fetching fees:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Fee by User ID
exports.getFeeByUserId = async (req, res) => {
  try {
    const fees = await Fee.find({ user_id: req.params.user_id }).populate('user_id', 'name email');
    if (!fees.length) {
      return res.status(404).json({ success: false, message: 'No fees found for this user' });
    }
    res.status(200).json({ success: true, data: fees });
  } catch (err) {
    console.error('Error fetching fee by user ID:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};