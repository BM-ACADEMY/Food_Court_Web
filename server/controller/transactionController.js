const Transaction = require("../model/transactionModel");
const User = require("../model/userModel");
const mongoose = require("mongoose");

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

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(sender_id)) {
      return res.status(400).json({ success: false, message: "Invalid sender_id" });
    }
    if (!mongoose.Types.ObjectId.isValid(receiver_id)) {
      return res.status(400).json({ success: false, message: "Invalid receiver_id" });
    }

    // Validate users exist
    const sender = await User.findById(sender_id);
    if (!sender) {
      return res.status(400).json({ success: false, message: "Sender not found" });
    }
    const receiver = await User.findById(receiver_id).populate("role_id");
    if (!receiver) {
      return res.status(400).json({ success: false, message: "Receiver not found" });
    }

    // Validate receiver role for Transfer
    if (transaction_type === "Transfer" && receiver.role_id?.role_id !== "role-4") {
      return res.status(400).json({ success: false, message: "Receiver must be a Restaurant for Transfer transactions" });
    }

    // Validate amount
    if (!/^\d+\.\d{2}$/.test(amount)) {
      return res.status(400).json({ success: false, message: "Amount must be a string with two decimal places (e.g., '10.00')" });
    }

    // Validate enum fields
    const validTransactionTypes = ["Transfer", "TopUp", "Refund"];
    if (!validTransactionTypes.includes(transaction_type)) {
      return res.status(400).json({ success: false, message: "Invalid transaction_type" });
    }
    const validPaymentMethods = ["Cash", "Gpay", "Mess bill"];
    if (payment_method && !validPaymentMethods.includes(payment_method)) {
      return res.status(400).json({ success: false, message: "Invalid payment_method" });
    }
    const validStatuses = ["Pending", "Success", "Failed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

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
    console.log(`Transaction created: ${transaction._id} - ${transaction.transaction_id}`);
    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    console.error("Transaction creation error:", err);
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
    console.error("Error fetching transactions:", err);
    res.status(500).json({ success: false, message: err.message });
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
    console.error("Error fetching transaction:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update a transaction
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

    console.log(`Transaction updated: ${updated._id} - ${updated.transaction_id}`);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("Error updating transaction:", err);
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

    console.log(`Transaction deleted: ${req.params.id}`);
    res.status(200).json({ success: true, message: "Transaction deleted successfully" });
  } catch (err) {
    console.error("Error deleting transaction:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};