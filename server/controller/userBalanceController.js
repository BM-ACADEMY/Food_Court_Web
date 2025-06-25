const UserBalance = require("../model/userBalanceModel");
const Transaction = require("../model/transactionModel");

exports.createOrUpdateBalance = async (req, res) => {
  const {
    user_id,
    balance,
    transaction_type = "Credit",
    payment_method,
    remarks,
  } = req.body;

  try {
    if (!user_id || isNaN(balance) || Number(balance) <= 0) {
      return res.status(400).json({ message: "Invalid data provided" });
    }

    const amount = Number(balance);

    // ✅ Step 1: Fetch user & role
    const user = await User.findById(user_id).populate("role_id");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Step 2: If Master Admin, check point_creation_limit
    if (user.role_id?.name === "Master-Admin") {
      const masterAdmin = await MasterAdmin.findOne({ user_id: user_id });
      const creationLimit = parseFloat(masterAdmin?.point_creation_limit?.toString() || "0");

      if (amount > creationLimit) {
        return res.status(400).json({
          message: `Amount exceeds Master Admin's creation limit of ₹${creationLimit}`,
        });
      }
    }

    // ✅ Step 3: Update balance
    const updatedBalance = await UserBalance.findOneAndUpdate(
      { user_id },
      { $inc: { balance: amount } },
      { new: true, upsert: true }
    );

    // ✅ Step 4: Record transaction
    const newTransaction = await Transaction.create({
      sender_id: user_id,
      receiver_id: user_id,
      amount,
      transaction_type,
      payment_method,
      remarks,
      status: "Success",
    });

    return res.status(200).json({
      success: true,
      message: "Balance updated and transaction recorded",
      balance: updatedBalance,
      transaction: newTransaction,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Balance by User ID
exports.getBalanceByUserId = async (req, res) => {
  const { user_id } = req.params;

  try {
    const balance = await UserBalance.findOne({ user_id });

    if (!balance) {
      return res
        .status(404)
        .json({ success: false, message: "Balance not found" });
    }

    res.status(200).json({ success: true, data: balance });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get All Balances
exports.getAllUserBalances = async (req, res) => {
  try {
    const balances = await UserBalance.find().populate("user_id", "name email");
    res.status(200).json({ success: true, data: balances });
  } catch (error) {
    console.error("Error fetching all balances:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete Balance by ID
exports.deleteBalance = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await UserBalance.findByIdAndDelete(id);
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    res.status(200).json({ success: true, message: "User balance deleted" });
  } catch (error) {
    console.error("Error deleting balance:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};