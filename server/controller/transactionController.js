const Transaction = require("../model/transactionModel");
const User = require("../model/userModel");
const Customer = require("../model/customerModel");
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

    console.log("Create Transaction Request:", req.body);

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(sender_id)) {
      return res.status(400).json({ success: false, message: "Invalid sender_id format" });
    }
    if (!mongoose.Types.ObjectId.isValid(receiver_id)) {
      return res.status(400).json({ success: false, message: "Invalid receiver_id format" });
    }

    // Validate users exist
    const sender = await User.findById(sender_id).populate("role_id");
    if (!sender) {
      return res.status(400).json({ success: false, message: "Sender not found" });
    }
    const receiver = await User.findById(receiver_id).populate("role_id");
    if (!receiver) {
      return res.status(400).json({ success: false, message: "Receiver not found" });
    }

    // Validate roles based on transaction type
    const senderRoleId = sender.role_id?._id.toString();
    const receiverRoleId = receiver.role_id?._id.toString();
    if (transaction_type === "Transfer") {
      if (senderRoleId !== "role-5") {
        return res.status(400).json({ success: false, message: "Sender must be a customer (role-5)" });
      }
      if (receiverRoleId !== "role-4") {
        return res.status(400).json({ success: false, message: "Receiver must be a restaurant (role-4)" });
      }
    } else if (transaction_type === "Refund") {
      if (senderRoleId !== "role-4") {
        return res.status(400).json({ success: false, message: "Sender must be a restaurant (role-4)" });
      }
      if (receiverRoleId !== "role-5") {
        return res.status(400).json({ success: false, message: "Receiver must be a customer (role-5)" });
      }
    }

    // Validate amount format
    if (!/^\d+\.\d{2}$/.test(amount)) {
      return res.status(400).json({ success: false, message: "Amount must be a string with two decimal places (e.g., '10.00')" });
    }

    // Validate sender balance
    const senderBalance = await UserBalance.findOne({ user_id: sender_id });
    const senderBalanceAmount = senderBalance ? parseFloat(senderBalance.balance) : 0.0;
    if (parseFloat(amount) > senderBalanceAmount) {
      return res.status(400).json({ success: false, message: `Insufficient sender balance: ${senderBalanceAmount.toFixed(2)}` });
    }

    // Validate enum fields
    const validTransactionTypes = ["Transfer", "TopUp", "Refund"];
    if (!validTransactionTypes.includes(transaction_type)) {
      return res.status(400).json({ success: false, message: `Invalid transaction_type. Must be one of: ${validTransactionTypes.join(", ")}` });
    }
    const validPaymentMethods = ["Cash", "Gpay", "Mess bill"];
    if (payment_method && !validPaymentMethods.includes(payment_method)) {
      return res.status(400).json({ success: false, message: `Invalid payment_method. Must be one of: ${validPaymentMethods.join(", ")}` });
    }
    const validStatuses = ["Pending", "Success", "Failed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
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
      transaction_id: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    });

    await transaction.save();
    console.log(`Transaction created: ${transaction._id} - ${transaction.transaction_id}`);
    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    console.error("Transaction creation error:", err.message, err.stack);
    res.status(400).json({ success: false, message: err.message || "Failed to create transaction" });
  }
};

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    // Fetch all transactions with populated fields
    let transactions = await Transaction.find()
      .populate({
        path: "sender_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "_id role_id" },
      })
      .populate({
        path: "receiver_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "_id role_id" },
      })
      .populate("location_id", "name")
      .populate("edited_by_id", "name");

    // Fetch all customers to map user_id to customer_id
    const customers = await Customer.find().select("user_id customer_id");
    const customerMap = new Map(customers.map((c) => [c.user_id.toString(), c.customer_id]));

    // Filter out invalid transactions and add customer_id
    transactions = transactions
      .filter((txn) => {
        if (!txn.sender_id || !txn.receiver_id) {
          console.warn(`Transaction ${txn._id} has invalid sender_id or receiver_id`);
          return false;
        }
        return true;
      })
      .map((txn) => {
        let customer_id = null;
        let customerUserId = null;

        // Determine customer (role-5) user
        const senderRoleId = txn.sender_id.role_id?.role_id;
        const receiverRoleId = txn.receiver_id.role_id?.role_id;
        if (senderRoleId === "role-5") {
          customerUserId = txn.sender_id._id.toString();
        } else if (receiverRoleId === "role-5") {
          customerUserId = txn.receiver_id._id.toString();
        }

        // Get customer_id from map
        if (customerUserId) {
          customer_id = customerMap.get(customerUserId) || null;
          if (!customer_id) {
            console.warn(`No customer_id found for user ${customerUserId} in transaction ${txn._id}`);
          }
        }

        return {
          ...txn.toObject(),
          customer_id,
        };
      });

    res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    console.error("Error fetching transactions:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate({
        path: "sender_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "_id role_id" },
      })
      .populate({
        path: "receiver_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "_id role_id" },
      })
      .populate("location_id", "name")
      .populate("edited_by_id", "name");

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    // Fetch customer_id
    let customer_id = null;
    const customers = await Customer.find().select("user_id customer_id");
    const customerMap = new Map(customers.map((c) => [c.user_id.toString(), c.customer_id]));
    if (transaction.sender_id && transaction.receiver_id) {
      const senderRoleId = transaction.sender_id.role_id?.role_id;
      const receiverRoleId = transaction.receiver_id.role_id?.role_id;
      let customerUserId = null;
      if (senderRoleId === "role-5") {
        customerUserId = transaction.sender_id._id.toString();
      } else if (receiverRoleId === "role-5") {
        customerUserId = transaction.receiver_id._id.toString();
      }
      if (customerUserId) {
        customer_id = customerMap.get(customerUserId) || null;
        if (!customer_id) {
          console.warn(`No customer_id found for user ${customerUserId} in transaction ${transaction._id}`);
        }
      }
    }

    res.status(200).json({ success: true, data: { ...transaction.toObject(), customer_id } });
  } catch (err) {
    console.error("Error fetching transaction:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Failed to fetch transaction" });
  }
};

// Update transaction
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
    console.error("Error updating transaction:", err.message, err.stack);
    res.status(400).json({ success: false, message: "Failed to update transaction" });
  }
};

// Delete transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const deleted = await Transaction.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    console.log(`Transaction deleted: ${req.params.id}`);
    res.status(200).json({ success: true, message: "Transaction deleted successfully" });
  } catch (err) {
    console.error("Error deleting transaction:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Failed to delete transaction" });
  }
};