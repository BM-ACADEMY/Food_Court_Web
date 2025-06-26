const Transaction = require("../model/transactionModel");
const User = require("../model/userModel");
const UserBalance = require("../model/userBalanceModel");
const mongoose = require("mongoose");
const Customer = require("../model/customerModel");

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

    console.log("createTransaction - Request body:", req.body);

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
    const senderRoleId = sender.role_id?.role_id;
    const receiverRoleId = receiver.role_id?.role_id;
    console.log("createTransaction - senderRoleId:", senderRoleId, "receiverRoleId:", receiverRoleId);
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
    });

    await transaction.save();
    console.log(`Transaction created: ${transaction._id} - ${transaction.transaction_id}`);
    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    console.error("Transaction creation error:", err.message, err.stack);
    res.status(400).json({ success: false, message: err.message || "Failed to create transaction" });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
     .sort({ created_at: -1 }) 
      .populate({
        path: "sender_id",
        select: "name email phone_number role_id",
        populate: { path: "role_id", select: "_id role_id name" },
      })
      .populate({
        path: "receiver_id",
        select: "name email phone_number role_id",
        populate: { path: "role_id", select: "_id role_id name" },
      })
      .populate("location_id", "location_name")
      .lean();

    // Enrich transactions with customer_id
    const enrichedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        let customer_id = null;
        let customerUserId = null;

        const senderRole = transaction.sender_id?.role_id?.role_id;
        const receiverRole = transaction.receiver_id?.role_id?.role_id;

        console.log(
          `Transaction ${transaction.transaction_id}: senderRole=${senderRole}, receiverRole=${receiverRole}`
        );

        if (senderRole === "role-5") {
          customerUserId = transaction.sender_id._id;
        } else if (receiverRole === "role-5") {
          customerUserId = transaction.receiver_id._id;
        }

        if (customerUserId) {
          const customer = await Customer.findOne({ user_id: customerUserId }).select("customer_id").lean();
          customer_id = customer?.customer_id || "N/A";
          console.log(
            `Transaction ${transaction.transaction_id}: customerUserId=${customerUserId}, customer_id=${customer_id}`
          );
        } else {
          console.log(`Transaction ${transaction.transaction_id}: No customer involved`);
          customer_id = "N/A";
        }

        return {
          ...transaction,
          customer_id,
        };
      })
    );

    console.log("Enriched transactions count:", enrichedTransactions.length);
    res.status(200).json({ success: true, data: enrichedTransactions });
  } catch (err) {
    console.error("Fetch all transactions error:", err.message, err.stack);
    res.status(400).json({ success: false, message: err.message || "Failed to fetch transactions" });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid transaction ID format" });
    }
    const transaction = await Transaction.findById(id)
      .populate({
        path: "sender_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "_id role_id name" },
      })
      .populate({
        path: "receiver_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "_id role_id name" },
      })
      .populate("location_id", "location_name")
      .populate("edited_by_id", "name")
      .lean();

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    let customer_id = null;
    let customerUserId = null;

    const senderRole = transaction.sender_id?.role_id?.role_id;
    const receiverRole = transaction.receiver_id?.role_id?.role_id;

    if (senderRole === "role-5") {
      customerUserId = transaction.sender_id._id;
    } else if (receiverRole === "role-5") {
      customerUserId = transaction.receiver_id._id;
    }

    if (customerUserId) {
      const customer = await Customer.findOne({ user_id: customerUserId }).select("customer_id").lean();
      customer_id = customer?.customer_id || "N/A";
    } else {
      customer_id = "N/A";
    }

    res.status(200).json({
      success: true,
      data: {
        ...transaction,
        customer_id,
      },
    });
  } catch (err) {
    console.error("Fetch transaction by ID error:", err.message, err.stack);
    res.status(400).json({ success: false, message: err.message || "Failed to fetch transaction" });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid transaction ID format" });
    }
    const updates = req.body;
    const validUpdates = ["amount", "transaction_type", "payment_method", "status", "remarks", "location_id"];
    const isValidUpdate = Object.keys(updates).every((update) => validUpdates.includes(update));
    if (!isValidUpdate) {
      return res.status(400).json({ success: false, message: "Invalid update fields" });
    }

    const transaction = await Transaction.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("sender_id", "name email phone_number")
      .populate("receiver_id", "name email phone_number")
      .populate("location_id", "location_name")
      .lean();

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    let customer_id = null;
    let customerUserId = null;

    const senderRole = transaction.sender_id?.role_id?.role_id;
    const receiverRole = transaction.receiver_id?.role_id?.role_id;

    if (senderRole === "role-5") {
      customerUserId = transaction.sender_id._id;
    } else if (receiverRole === "role-5") {
      customerUserId = transaction.receiver_id._id;
    }

    if (customerUserId) {
      const customer = await Customer.findOne({ user_id: customerUserId }).select("customer_id").lean();
      customer_id = customer?.customer_id || "N/A";
    } else {
      customer_id = "N/A";
    }

    res.status(200).json({
      success: true,
      data: {
        ...transaction,
        customer_id,
      },
    });
  } catch (err) {
    console.error("Update transaction error:", err.message, err.stack);
    res.status(400).json({ success: false, message: err.message || "Failed to update transaction" });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid transaction ID format" });
    }
    const transaction = await Transaction.findByIdAndDelete(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    res.status(200).json({ success: true, message: "Transaction deleted successfully" });
  } catch (err) {
    console.error("Delete transaction error:", err.message, err.stack);
    res.status(400).json({ success: false, message: err.message || "Failed to delete transaction" });
  }
};