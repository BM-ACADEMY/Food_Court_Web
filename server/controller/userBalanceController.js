const UserBalance = require('../model/userBalanceModel');

// Create or Initialize Balance for a User
exports.createOrUpdateBalance = async (req, res) => {
  const { user_id, balance } = req.body;

  try {
    const updated = await UserBalance.findOneAndUpdate(
      { user_id },
      { $set: { balance } },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating/creating balance:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Balance by User ID
exports.getBalanceByUserId = async (req, res) => {
  const { user_id } = req.params;

  try {
    const balance = await UserBalance.findOne({ user_id });

    if (!balance) {
      return res.status(404).json({ success: false, message: 'Balance not found' });
    }

    res.status(200).json({ success: true, data: balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get All Balances
exports.getAllUserBalances = async (req, res) => {
  try {
    const balances = await UserBalance.find().populate('user_id', 'name email');
    res.status(200).json({ success: true, data: balances });
  } catch (error) {
    console.error('Error fetching all balances:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete Balance by ID
exports.deleteBalance = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await UserBalance.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    res.status(200).json({ success: true, message: 'User balance deleted' });
  } catch (error) {
    console.error('Error deleting balance:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
