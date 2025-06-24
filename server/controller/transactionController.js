const Transaction = require("../model/transactionModel");
const UserBalance=require('../model/userBalanceModel')
const MasterAdmin=require('../model/masterAdminModel');
const User=require('../model/userModel')

// Create Transaction
exports.createTransaction = async (req, res) => {
  try {
    const {
      sender_id,
      receiver_id,
      amount,
      transaction_type,
      payment_method,
      status = "Pending",
      remarks,
      location_id,
    } = req.body;

    const transaction = new Transaction({
      sender_id,
      receiver_id,
      amount,
      transaction_type,
      payment_method,
      status,
      remarks,
      location_id,
    });

    await transaction.save();
    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("sender_id", "name phone_number")
      .populate("receiver_id", "name phone_number")
      .populate("location_id", "name")
      .populate("edited_by_id", "name");
    res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllRecentTransaction = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ created_at: -1 }) // ⬅️ Sort by newest
      .limit(5)                 // ⬅️ Limit to last 5
      .populate("sender_id", "name phone_number")   // ⬅️ From User
      .populate("receiver_id", "name phone_number") // ⬅️ From User
      .populate("location_id", "name")
      .populate("edited_by_id", "name");

    res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// controller/transactionController.js

// exports.transferFunds = async (req, res) => {
//   const {
//     sender_id,
//     receiver_id,
//     amount,
//     transaction_type,
//     payment_method,
//     remarks,
//   } = req.body;

//   try {
//     if (!sender_id || !receiver_id || !amount) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     const amt = Number(amount);
//     const senderBalance = await UserBalance.findOne({ user_id: sender_id });

//     if (!senderBalance || parseFloat(senderBalance.balance.toString()) < amt) {
//       return res.status(400).json({ message: "Insufficient balance" });
//     }

//     // Deduct from sender
//     await UserBalance.updateOne(
//       { user_id: sender_id },
//       { $inc: { balance: -amt } }
//     );

//     // Credit to receiver
//     await UserBalance.findOneAndUpdate(
//       { user_id: receiver_id },
//       { $inc: { balance: amt } },
//       { upsert: true }
//     );

//     // Save transaction
//     const transaction = await Transaction.create({
//       sender_id,
//       receiver_id,
//       amount,
//       transaction_type,
//       payment_method,
//       remarks,
//       status: "Success",
//     });

//     return res.status(200).json({ success: true, transaction });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };
exports.transferFunds = async (req, res) => {
  const {
    sender_id,
    receiver_id,
    amount,
    transaction_type,
    payment_method,
    remarks,
    mode = "normal", // Default to "normal"
  } = req.body;

  try {
    if (!sender_id || !receiver_id || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // ✅ Check balance
    const senderBalance = await UserBalance.findOne({ user_id: sender_id });
    if (!senderBalance || parseFloat(senderBalance.balance.toString()) < amt) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // ✅ Fetch roles of sender and receiver
    const [sender, receiver] = await Promise.all([
      User.findById(sender_id).populate("role_id"),
      User.findById(receiver_id).populate("role_id"),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "Sender or Receiver not found" });
    }

    // ✅ Only enforce limit check in NORMAL mode
    if (mode === "normal") {
      const senderRole = sender.role_id?.name;
      const receiverRole = receiver.role_id?.name;

      // Check if sender is Master-Admin and receiver is Admin
      if (senderRole === "Master-Admin" && receiverRole === "Admin") {
        const masterAdminData = await MasterAdmin.findOne({ user_id: sender_id });
        const transferLimit = parseFloat(masterAdminData?.master_admin_to_admin?.toString() || "0");

        if (amt > transferLimit) {
          return res.status(400).json({
            message: `Transfer exceeds Master Admin's per-transaction limit of ₹${transferLimit}`,
          });
        }
      }
    }

    // ✅ Deduct from sender
    await UserBalance.updateOne({ user_id: sender_id }, { $inc: { balance: -amt } });

    // ✅ Credit to receiver
    await UserBalance.findOneAndUpdate(
      { user_id: receiver_id },
      { $inc: { balance: amt } },
      { upsert: true }
    );

    // ✅ Record transaction
    const transaction = await Transaction.create({
      sender_id,
      receiver_id,
      amount,
      transaction_type,
      payment_method,
      remarks,
      status: "Success",
    });

    return res.status(200).json({ success: true, transaction });

  } catch (err) {
    console.error("Transfer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("sender_id", "name phone_number")
      .populate("receiver_id", "name phone_number")
      .populate("location_id", "name")
      .populate("edited_by_id", "name");

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update a transaction (edit only editable fields like remarks/status/edited_by_id)
exports.updateTransaction = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      edited_at: new Date(),
    };

    const updated = await Transaction.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete a transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const deleted = await Transaction.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    res.status(200).json({ success: true, message: "Transaction deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
