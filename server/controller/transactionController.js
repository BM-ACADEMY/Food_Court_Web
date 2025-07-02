const Transaction = require("../model/transactionModel");
const UserBalance = require("../model/userBalanceModel");
const MasterAdmin = require("../model/masterAdminModel");
const moment = require("moment");
const Role = require("../model/roleModel");
const mongoose = require("mongoose");
const Admin = require("../model/adminModel");
const TreasurySubcom = require("../model/treasurySubcomModel");
const User = require("../model/userModel");
const Customer = require("../model/customerModel");
const { getIO } = require("../config/socket");

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
    } = req.body;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(sender_id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid sender_id format" });
    }
    if (!mongoose.Types.ObjectId.isValid(receiver_id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid receiver_id format" });
    }

    // Validate users exist
    const sender = await User.findById(sender_id).populate("role_id");
    if (!sender) {
      return res
        .status(400)
        .json({ success: false, message: "Sender not found" });
    }
    const receiver = await User.findById(receiver_id).populate("role_id");
    if (!receiver) {
      return res
        .status(400)
        .json({ success: false, message: "Receiver not found" });
    }

    // Validate roles based on transaction type
    const senderRoleId = sender.role_id?.role_id;
    const receiverRoleId = receiver.role_id?.role_id;

    if (transaction_type === "Transfer") {
      if (senderRoleId !== "role-5") {
        return res.status(400).json({
          success: false,
          message: "Sender must be a customer (role-5)",
        });
      }
      if (receiverRoleId !== "role-4") {
        return res.status(400).json({
          success: false,
          message: "Receiver must be a restaurant (role-4)",
        });
      }
    } else if (transaction_type === "Refund") {
      if (senderRoleId !== "role-4") {
        return res.status(400).json({
          success: false,
          message: "Sender must be a restaurant (role-4)",
        });
      }
      if (receiverRoleId !== "role-5") {
        return res.status(400).json({
          success: false,
          message: "Receiver must be a customer (role-5)",
        });
      }
    }

    // Validate amount format
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || !/^\d+\.\d{2}$/.test(amount)) {
      return res.status(400).json({
        success: false,
        message:
          "Amount must be a string with two decimal places (e.g., '10.00')",
      });
    }

    // Validate sender balance
    const senderBalance = await UserBalance.findOne({ user_id: sender_id });
    const senderBalanceAmount = senderBalance
      ? parseFloat(senderBalance.balance)
      : 0.0;
    if (parsedAmount > senderBalanceAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient sender balance: ${senderBalanceAmount.toFixed(
          2
        )}`,
      });
    }

    // Validate enum fields
    const validTransactionTypes = ["Transfer", "TopUp", "Refund"];
    if (!validTransactionTypes.includes(transaction_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transaction_type. Must be one of: ${validTransactionTypes.join(
          ", "
        )}`,
      });
    }
    const validPaymentMethods = ["Cash", "Gpay", "Mess bill"];
    if (payment_method && !validPaymentMethods.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment_method. Must be one of: ${validPaymentMethods.join(
          ", "
        )}`,
      });
    }
    const validStatuses = ["Pending", "Success", "Failed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const transaction = new Transaction({
      sender_id,
      receiver_id,
      amount,
      transaction_type,
      payment_method,
      status,
      remarks,
    });

    await transaction.save();

    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    console.error("Transaction creation error:", err.message, err.stack);
    res.status(400).json({
      success: false,
      message: err.message || "Failed to create transaction",
    });
  }
};

exports.createOrUpdateBalance = async (req, res) => {
  const {
    user_id,
    balance,
    transaction_type = "Credit",
    payment_method,
    remarks,
  } = req.body;

  try {
    if (
      !mongoose.Types.ObjectId.isValid(user_id) ||
      isNaN(balance) ||
      !/^\-?\d+\.\d{2}$/.test(balance.toString())
    ) {
      return res.status(400).json({ message: "Invalid data provided" });
    }

    const amount = parseFloat(balance);

    // Step 1: Fetch user & role
    const user = await User.findById(user_id).populate("role_id");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 2: If Master Admin, check point_creation_limit
    if (
      user.role_id?.name === "Master-Admin" &&
      transaction_type === "Credit"
    ) {
      const masterAdmin = await MasterAdmin.findOne({ user_id: user_id });
      const creationLimit = parseFloat(
        masterAdmin?.point_creation_limit?.toString() || "0"
      );
      if (amount > creationLimit) {
        return res.status(400).json({
          message: `Amount exceeds Master Admin's creation limit of ₹${creationLimit}`,
        });
      }
    }

    // Step 3: Validate balance for debit operations
    if (transaction_type === "Debit") {
      const currentBalance = await UserBalance.findOne({ user_id });
      const currentBalanceAmount = currentBalance
        ? parseFloat(currentBalance.balance)
        : 0.0;
      if (currentBalanceAmount + amount < 0) {
        return res.status(400).json({
          message: `Insufficient balance: ₹${currentBalanceAmount.toFixed(2)}`,
        });
      }
    }

    // Step 4: Update balance
    const updatedBalance = await UserBalance.findOneAndUpdate(
      { user_id },
      { $inc: { balance: amount } },
      { new: true, upsert: true }
    );

    // Step 5: Record transaction
    const newTransaction = await Transaction.create({
      sender_id: user_id,
      receiver_id: user_id,
      amount: Math.abs(amount).toFixed(2),
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

exports.processPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      sender_id,
      receiver_id,
      amount,
      transaction_type = "Transfer",
      payment_method = "Gpay",
      remarks,
    } = req.body;

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(sender_id) ||
      !mongoose.Types.ObjectId.isValid(receiver_id)
    ) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid sender_id or receiver_id format",
      });
    }

    // Validate users and roles
    const sender = await User.findById(sender_id)
      .populate("role_id")
      .session(session);
    if (!sender) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: "Sender not found" });
    }
    const receiver = await User.findById(receiver_id)
      .populate("role_id")
      .session(session);
    if (!receiver) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: "Receiver not found" });
    }

    if (transaction_type === "Transfer") {
      if (sender.role_id?.role_id !== "role-5") {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Sender must be a customer (role-5)",
        });
      }
      if (receiver.role_id?.role_id !== "role-4") {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Receiver must be a restaurant (role-4)",
        });
      }
    }

    // Validate amount format
    const deductAmount = parseFloat(amount);
    if (isNaN(deductAmount) || !/^\d+\.\d{2}$/.test(amount)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message:
          "Amount must be a string with two decimal places (e.g., '10.00')",
      });
    }

    // Validate sender balance
    const senderBalance = await UserBalance.findOne({
      user_id: sender_id,
    }).session(session);
    const senderBalanceAmount = senderBalance
      ? parseFloat(senderBalance.balance)
      : 0.0;
    if (deductAmount > senderBalanceAmount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Insufficient sender balance: ${senderBalanceAmount.toFixed(
          2
        )}`,
      });
    }

    // Create transaction
    const transaction = new Transaction({
      sender_id,
      receiver_id,
      amount: deductAmount.toFixed(2),
      transaction_type,
      payment_method,
      status: "Success",
      remarks,
    });
    await transaction.save({ session });

    // Update sender (customer) balance
    const updatedSenderBalance = await UserBalance.findOneAndUpdate(
      { user_id: sender_id },
      { $inc: { balance: -deductAmount } },
      { new: true, upsert: true, session }
    );

    // Update receiver (restaurant) balance
    const updatedReceiverBalance = await UserBalance.findOneAndUpdate(
      { user_id: receiver_id },
      { $inc: { balance: deductAmount } },
      { new: true, upsert: true, session }
    );

    await session.commitTransaction();

    const io = getIO();
    // io.to(receiver_id.toString()).emit("newTransaction", {
    //   transaction,
    //   balance: updatedReceiverBalance?.balance,
    // });

    // ✅ Always notify the receiver (e.g., restaurant in deduct, customer in refund)
    io.to(receiver_id.toString()).emit("newTransaction", {
      transaction,
      balance: updatedReceiverBalance?.balance,
    });

    // ✅ Also notify the sender (e.g., restaurant in refund)
    io.to(sender_id.toString()).emit("newTransaction", {
      transaction,
      balance: updatedSenderBalance?.balance,
    });

    res.status(200).json({
      success: true,
      message: `Payment successful! New Restaurant balance: ₹${(
        senderBalanceAmount - deductAmount
      ).toFixed(2)}`,
      transaction,
      senderBalance: updatedSenderBalance,
      receiverBalance: updatedReceiverBalance,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Payment processing error:", err);
    res.status(400).json({
      success: false,
      message: err.message || "Failed to process payment",
    });
  } finally {
    session.endSession();
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

      // .populate("location_id", "location_name")

      .lean();

    // Enrich transactions with customer_id
    const enrichedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
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
          const customer = await Customer.findOne({ user_id: customerUserId })
            .select("customer_id")
            .lean();
          customer_id = customer?.customer_id || "N/A";
        } else {
          customer_id = "N/A";
        }

        return {
          ...transaction,
          customer_id,
        };
      })
    );

    res.status(200).json({ success: true, data: enrichedTransactions });
  } catch (err) {
    console.error("Fetch all transactions error:", err.message, err.stack);
    res.status(400).json({
      success: false,
      message: err.message || "Failed to fetch transactions",
    });
  }
};

exports.getAllRecentTransaction = async (req, res) => {
  try {
    const debug =
      process.env.NODE_ENV !== "production" ? console.log : () => {};
    debug("Fetching recent transactions...");

    const transactions = await Transaction.find()
      .sort({ created_at: -1 })
      .limit(5)
      .populate({
        path: "sender_id",
        select: "name phone_number role_id",
        populate: {
          path: "role_id",
          model: "Role",
          select: "name _id",
        },
      })
      .populate({
        path: "receiver_id",
        select: "name phone_number role_id",
        populate: {
          path: "role_id",
          model: "Role",
          select: "name _id",
        },
      })
      .populate("edited_by_id", "name");

    debug("Raw transactions:", transactions);

    // Format the response to handle null/undefined values
    const formattedTransactions = transactions.map((transaction) => ({
      ...transaction.toObject(),
      sender_id: transaction.sender_id?._id?.toString() || "Unknown",
      sender_name: transaction.sender_id?.name || "Unknown",
      sender_phone: transaction.sender_id?.phone_number || "Unknown",
      sender_role: transaction.sender_id?.role_id?.name || "Unknown",
      sender_role_id:
        transaction.sender_id?.role_id?._id?.toString() || "Unknown",
      receiver_id: transaction.receiver_id?._id?.toString() || "Unknown",
      receiver_name: transaction.receiver_id?.name || "Unknown",
      receiver_phone: transaction.receiver_id?.phone_number || "Unknown",
      receiver_role: transaction.receiver_id?.role_id?.name || "Unknown",
      receiver_role_id:
        transaction.receiver_id?.role_id?._id?.toString() || "Unknown",
      edited_by_name: transaction.edited_by_id?.name || "Unknown",
    }));

    debug("Formatted transactions:", formattedTransactions);

    res.status(200).json({ success: true, data: formattedTransactions });
  } catch (err) {
    console.error("Error in getAllRecentTransaction:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.transferFunds = async (req, res) => {
  const {
    sender_id,
    receiver_id,
    amount,
    transaction_type,
    payment_method,
    remarks,
    mode = "normal",
  } = req.body;

  try {
    if (!sender_id || !receiver_id || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const senderBalance = await UserBalance.findOne({ user_id: sender_id });
    if (!senderBalance || parseFloat(senderBalance.balance) < amt) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(sender_id).populate("role_id"),
      User.findById(receiver_id).populate("role_id"),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "Sender or Receiver not found" });
    }

    if (mode === "normal") {
      const senderRole = sender.role_id?.name;
      const receiverRole = receiver.role_id?.name;

      if (senderRole === "Master-Admin" && receiverRole === "Admin") {
        const masterAdminData = await MasterAdmin.findOne({
          user_id: sender_id,
        });
        const transferLimit = parseFloat(
          masterAdminData?.master_admin_to_admin || "0"
        );
        if (amt > transferLimit) {
          return res.status(400).json({
            message: `Transfer exceeds Master Admin's per-transaction limit of ₹${transferLimit}`,
          });
        }
      }

      if (senderRole === "Admin" && receiverRole === "Admin") {
        const adminData = await Admin.findOne({ user_id: sender_id });
        const transferLimit = parseFloat(
          adminData?.admin_to_admin_transfer_limit || "0"
        );
        if (amt > transferLimit) {
          return res.status(400).json({
            message: `Transfer exceeds Admin to Admin limit of ₹${transferLimit}`,
          });
        }
      }

      if (senderRole === "Admin" && receiverRole === "Treasury-Subcom") {
        const adminData = await Admin.findOne({ user_id: sender_id });
        const transferLimit = parseFloat(
          adminData?.admin_to_subcom_transfer_limit || "0"
        );
        if (amt > transferLimit) {
          return res.status(400).json({
            message: `Transfer exceeds Admin to Subcom limit of ₹${transferLimit}`,
          });
        }
      }

      if (senderRole === "Treasury-Subcom" && receiverRole === "Admin") {
        const subcomData = await TreasurySubcom.findOne({ user_id: sender_id });
        const transferLimit = parseFloat(
          subcomData?.subcom_to_admin_transfer_limit || "0"
        );
        if (amt > transferLimit) {
          return res.status(400).json({
            message: `Transfer exceeds Subcom to Admin limit of ₹${transferLimit}`,
          });
        }
      }
    }

    // Convert string balance to number, perform arithmetic, and format back to string
    const senderNewBalance = (parseFloat(senderBalance.balance) - amt).toFixed(
      2
    );
    await UserBalance.updateOne(
      { user_id: sender_id },
      { $set: { balance: senderNewBalance } }
    );

    // For receiver, fetch existing balance or use 0 if not found
    const receiverBalance = await UserBalance.findOne({ user_id: receiver_id });
    const receiverNewBalance = (
      parseFloat(receiverBalance?.balance || "0") + amt
    ).toFixed(2);
    await UserBalance.updateOne(
      { user_id: receiver_id },
      { $set: { balance: receiverNewBalance } },
      { upsert: true }
    );

    const transaction = await Transaction.create({
      sender_id,
      receiver_id,
      amount: amt.toFixed(2),
      transaction_type,
      payment_method,
      remarks,
      status: "Success",
      created_at: new Date(),
    });

    res.json({
      success: true,
      message: "Funds transferred successfully",
      transaction,
    });
  } catch (error) {
    console.error("Error in transferFunds:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
};

// exports.transferFunds = async (req, res) => {
//   const {
//     sender_id,
//     receiver_id,
//     amount,
//     transaction_type,
//     payment_method,
//     remarks,
//     mode = "normal", // Default to "normal"
//   } = req.body;

//   try {
//     if (!sender_id || !receiver_id || !amount) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     const amt = Number(amount);
//     if (isNaN(amt) || amt <= 0) {
//       return res.status(400).json({ message: "Invalid amount" });
//     }

//     // ✅ Check balance
//     const senderBalance = await UserBalance.findOne({ user_id: sender_id });
//     if (!senderBalance || parseFloat(senderBalance.balance.toString()) < amt) {
//       return res.status(400).json({ message: "Insufficient balance" });
//     }

//     // ✅ Fetch roles of sender and receiver
//     const [sender, receiver] = await Promise.all([
//       User.findById(sender_id).populate("role_id"),
//       User.findById(receiver_id).populate("role_id"),
//     ]);

//     if (!sender || !receiver) {
//       return res.status(404).json({ message: "Sender or Receiver not found" });
//     }

//     // ✅ Only enforce limit check in NORMAL mode
//     if (mode === "normal") {
//       const senderRole = sender.role_id?.name;
//       const receiverRole = receiver.role_id?.name;

//       // Check if sender is Master-Admin and receiver is Admin
//       if (senderRole === "Master-Admin" && receiverRole === "Admin") {
//         const masterAdminData = await MasterAdmin.findOne({ user_id: sender_id });
//         const transferLimit = parseFloat(masterAdminData?.master_admin_to_admin?.toString() || "0");

//         if (amt > transferLimit) {
//           return res.status(400).json({
//             message: `Transfer exceeds Master Admin's per-transaction limit of ₹${transferLimit}`,
//           });
//         }
//       }
//     }

//     // ✅ Deduct from sender
//     await UserBalance.updateOne({ user_id: sender_id }, { $inc: { balance: -amt } });

//     // ✅ Credit to receiver
//     await UserBalance.findOneAndUpdate(
//       { user_id: receiver_id },
//       { $inc: { balance: amt } },
//       { upsert: true }
//     );

//     // ✅ Record transaction
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
//     console.error("Transfer error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// Get transaction by ID

exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid transaction ID format" });
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
      .populate("edited_by_id", "name")
      .lean();

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
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
      const customer = await Customer.findOne({ user_id: customerUserId })
        .select("customer_id")
        .lean();
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
    res.status(400).json({
      success: false,
      message: err.message || "Failed to fetch transaction",
    });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid transaction ID format" });
    }
    const transaction = await Transaction.findByIdAndDelete(id);
    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Transaction deleted successfully" });
  } catch (err) {
    console.error("Delete transaction error:", err.message, err.stack);
    res.status(400).json({
      success: false,
      message: err.message || "Failed to delete transaction",
    });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const {
      amount,
      transaction_type,
      payment_method,
      status,
      remarks,
      location_id,
      edited_by_id,
    } = req.body;

    // Validate transaction_id
    if (!transactionId || !transactionId.startsWith("TXN")) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid transaction ID" });
    }

    // Validate required fields
    if (!edited_by_id || !mongoose.Types.ObjectId.isValid(edited_by_id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or missing edited_by_id" });
    }

    // Prepare update object with only provided fields
    const updateData = {
      amount:
        amount !== undefined && amount !== null
          ? parseFloat(amount)
          : undefined,
      transaction_type: transaction_type || undefined,
      payment_method: payment_method || undefined,
      status: status || undefined,
      remarks: remarks || undefined,
      location_id:
        location_id && mongoose.Types.ObjectId.isValid(location_id)
          ? location_id
          : undefined,
      edited_at: new Date(),
      edited_by_id,
    };

    // Remove undefined fields to prevent overwriting with undefined
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    // Find and update the transaction
    const transaction = await Transaction.findOneAndUpdate(
      { transaction_id: transactionId },
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("sender_id", "name type")
      .populate("receiver_id", "name type")
      .populate("location_id", "name");

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    // Format response to match frontend expectations
    const formattedTransaction = {
      id: transaction.transaction_id,
      datetime: transaction.created_at.toISOString(),
      user: {
        name:
          transaction.sender_id?.name ||
          transaction.receiver_id?.name ||
          "Unknown",
        type:
          transaction.sender_id?.type ||
          transaction.receiver_id?.type ||
          "Unknown",
      },
      type: transaction.transaction_type,
      description: transaction.remarks || "",
      location: transaction.location_id?.name || "N/A",
      amount: parseFloat(transaction.amount),
      payment_method: transaction.payment_method || "",
      status: transaction.status || "Pending",
      location_id: transaction.location_id?._id?.toString() || "",
      edited_at: transaction.edited_at
        ? transaction.edited_at.toISOString()
        : null,
      edited_by_id: transaction.edited_by_id
        ? transaction.edited_by_id.toString()
        : null,
    };

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      transaction: formattedTransaction,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const buildDateFilter = (quickFilter, fromDate, toDate) => {
  let startDate, endDate;

  if (fromDate && toDate) {
    startDate = moment(fromDate).startOf("day").utc().toDate();
    endDate = moment(toDate).endOf("day").utc().toDate();
  } else if (quickFilter) {
    switch (quickFilter.toLowerCase()) {
      case "today":
        startDate = moment().startOf("day").utc().toDate();
        endDate = moment().endOf("day").utc().toDate();
        break;
      case "yesterday":
        startDate = moment().subtract(1, "day").startOf("day").utc().toDate();
        endDate = moment().subtract(1, "day").endOf("day").utc().toDate();
        break;
      case "last 7 days":
      case "last7days":
        startDate = moment().subtract(7, "days").startOf("day").utc().toDate();
        endDate = moment().endOf("day").utc().toDate();
        break;
      default:
        startDate = null;
        endDate = null;
    }
  }

  const filter =
    startDate && endDate
      ? { created_at: { $gte: startDate, $lte: endDate } }
      : {};

  return filter;
};

exports.getTransactionHistory = async (req, res) => {
  try {
    const {
      transactionType = "all",
      userType = "all",
      location = "all",
      paymentMethod = "all",
      sortBy = "date", // New: default to sort by date
      sortOrder = "desc", // New: default to descending
      fromDate,
      toDate,
      quickFilter,
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter object
    let filter = { status: "Success" };

    // Transaction type filter
    if (transactionType !== "all") {
      filter.transaction_type = transactionType;
    }

    // Location filter
    if (location !== "all") {
      filter.location_id =
        mongoose.Types.ObjectId.createFromHexString(location);
    }

    // Payment method filter with validation
    if (paymentMethod !== "all") {
      const validPaymentMethods = [
        "Cash",
        "Gpay",
        "Mess bill",
        "Balance Deduction",
      ];
      if (!validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
          error: `Invalid payment method: ${paymentMethod}. Must be one of: ${validPaymentMethods.join(
            ", "
          )}`,
        });
      }
      filter.payment_method = paymentMethod;
    } else {
      filter.payment_method = {
        $in: [
          "Cash",
          "Gpay",
          "Mess bill",
          "Balance Deduction",
          null,
          undefined,
        ],
      };
    }

    // Date filter
    const dateFilter = buildDateFilter(quickFilter, fromDate, toDate);
    if (dateFilter.created_at) {
      filter.created_at = dateFilter.created_at;
    }

    // User type and search filters
    const userFilters = [];
    if (userType !== "all") {
      const role = await Role.findOne({ name: userType });
      if (!role) {
        return res
          .status(400)
          .json({ error: `Invalid user type: ${userType}` });
      }
      const usersWithRole = await User.find({ role_id: role._id }).select(
        "_id"
      );
      const userIds = usersWithRole.map((user) => user._id);
      userFilters.push({
        $or: [
          { sender_id: { $in: userIds } },
          { receiver_id: { $in: userIds } },
        ],
      });
    }

    if (search.trim()) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone_number: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const userIds = users.map((user) => user._id);
      userFilters.push({
        $or: [
          { sender_id: { $in: userIds } },
          { receiver_id: { $in: userIds } },
        ],
      });
    }

    if (userFilters.length > 0) {
      filter.$and = userFilters;
    }

    // Sort validation and mapping
    const validSortFields = {
      date: "created_at",
      amount: "amount",
    };
    const validSortOrders = ["asc", "desc"];
    if (!validSortFields[sortBy]) {
      return res.status(400).json({
        error: `Invalid sortBy field: ${sortBy}. Must be one of: ${Object.keys(
          validSortFields
        ).join(", ")}`,
      });
    }
    if (!validSortOrders.includes(sortOrder)) {
      return res.status(400).json({
        error: `Invalid sortOrder: ${sortOrder}. Must be one of: ${validSortOrders.join(
          ", "
        )}`,
      });
    }
    const sortField = validSortFields[sortBy];
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sort = { [sortField]: sortDirection };

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch transactions
    const transactionsPromise = Transaction.find(filter)
      .populate({
        path: "sender_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "name" },
      })
      .populate({
        path: "receiver_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "name" },
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Calculate statistics
    const statsPromise = Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalRevenue: { $sum: { $toDouble: "$amount" } },
          avgTransactionValue: { $avg: { $toDouble: "$amount" } },
          totalRefunds: {
            $sum: {
              $cond: [
                { $eq: ["$transaction_type", "Refund"] },
                { $toDouble: "$amount" },
                0,
              ],
            },
          },
        },
      },
    ]);

    // Chart data: Per day (2-hour intervals)
    const hourlyChartPromise = Transaction.aggregate([
      {
        $match: {
          ...filter,
          created_at: {
            $gte: moment().startOf("day").toDate(),
            $lte: moment().endOf("day").toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            hour: { $hour: "$created_at" },
            type: "$transaction_type",
          },
          count: { $sum: 1 },
          amount: { $sum: { $toDouble: "$amount" } },
        },
      },
      {
        $group: {
          _id: {
            hour: {
              $subtract: ["$_id.hour", { $mod: ["$_id.hour", 2] }],
            },
          },
          transactions: {
            $sum: {
              $cond: [{ $ne: ["$_id.type", "Refund"] }, "$amount", 0],
            },
          },
          refunds: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "Refund"] }, "$amount", 0],
            },
          },
          topups: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "TopUp"] }, "$amount", 0],
            },
          },
        },
      },
      {
        $project: {
          label: { $concat: [{ $toString: "$_id.hour" }, ":00"] },
          transactions: 1,
          refunds: 1,
          topups: 1,
        },
      },
      { $sort: { "_id.hour": 1 } },
    ]);

    // Chart data: Daily (past week)
    const dailyChartPromise = Transaction.aggregate([
      {
        $match: {
          ...filter,
          created_at: {
            $gte: moment().subtract(7, "days").startOf("day").toDate(),
            $lte: moment().endOf("day").toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
            type: "$transaction_type",
          },
          amount: { $sum: { $toDouble: "$amount" } },
        },
      },
      {
        $group: {
          _id: "$_id.day",
          transactions: {
            $sum: {
              $cond: [{ $ne: ["$_id.type", "Refund"] }, "$amount", 0],
            },
          },
          refunds: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "Refund"] }, "$amount", 0],
            },
          },
          topups: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "TopUp"] }, "$amount", 0],
            },
          },
        },
      },
      {
        $project: {
          label: "$_id",
          transactions: 1,
          refunds: 1,
          topups: 1,
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Chart data: Weekly (past month)
    const weeklyChartPromise = Transaction.aggregate([
      {
        $match: {
          ...filter,
          created_at: {
            $gte: moment().subtract(30, "days").startOf("day").toDate(),
            $lte: moment().endOf("day").toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            week: { $week: "$created_at" },
            year: { $year: "$created_at" },
            type: "$transaction_type",
          },
          amount: { $sum: { $toDouble: "$amount" } },
        },
      },
      {
        $group: {
          _id: { week: "$_id.week", year: "$_id.year" },
          transactions: {
            $sum: {
              $cond: [{ $ne: ["$_id.type", "Refund"] }, "$amount", 0],
            },
          },
          refunds: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "Refund"] }, "$amount", 0],
            },
          },
          topups: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "TopUp"] }, "$amount", 0],
            },
          },
        },
      },
      {
        $project: {
          label: { $concat: ["Week ", { $toString: "$_id.week" }] },
          transactions: 1,
          refunds: 1,
          topups: 1,
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    // Execute all queries in parallel
    const [transactions, statsResult, hourlyChart, dailyChart, weeklyChart] =
      await Promise.all([
        transactionsPromise,
        statsPromise,
        hourlyChartPromise,
        dailyChartPromise,
        weeklyChartPromise,
      ]);

    // Format transactions for frontend
    const formattedTransactions = transactions.map((txn) => ({
      datetime: moment(txn.created_at).format("MMM DD, YYYY HH:mm"),
      id: txn.transaction_id,
      sender: {
        name: txn.sender_id?.name || "Unknown",
        role: txn.sender_id?.role_id?.name || "Unknown",
      },
      receiver: {
        name: txn.receiver_id?.name || "Unknown",
        role: txn.receiver_id?.role_id?.name || "Unknown",
      },
      type: txn.transaction_type,
      description: txn.remarks || `${txn.transaction_type} transaction`,
      location: txn.location_id?.name || "Unknown",
      amount: parseFloat(txn.amount),
      paymentMethod: txn.payment_method || "Unknown",
    }));

    // Format statistics
    const stats = {
      totalTransactions: statsResult[0]?.totalTransactions || 0,
      totalRevenue: statsResult[0]?.totalRevenue || 0,
      avgTransactionValue: statsResult[0]?.avgTransactionValue || 0,
      totalRefunds: statsResult[0]?.totalRefunds || 0,
    };

    // Format chart data
    const chartData = {
      hourly: hourlyChart,
      daily: dailyChart,
      weekly: weeklyChart,
    };

    // Total pages for pagination
    const totalTransactions = stats.totalTransactions;
    const totalPages = Math.ceil(totalTransactions / limit);

    // Send response
    res.status(200).json({
      transactions: formattedTransactions,
      stats,
      chartData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        totalTransactions,
      },
    });
  } catch (error) {
    console.error("Error in getTransactionHistory:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
exports.getTransactionTreasuryRestaurantHistory = async (req, res) => {
  try {
    const {
      transactionType = "all",
      restaurantId = "all",
      fromDate,
      toDate,
      quickFilter,
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter object
    let filter = { status: "Success" };

    // Transaction type filter (only Transfer or Refund for restaurant transactions)
    if (transactionType !== "all") {
      filter.transaction_type = transactionType;
    } else {
      filter.transaction_type = { $in: ["Transfer", "Refund"] };
    }

    // Fetch restaurant role
    const restaurantRole = await Role.findOne({ role_id: "role-4" });
    if (!restaurantRole) {
      return res.status(400).json({ error: "Restaurant role not found" });
    }

    // Fetch all restaurant user IDs
    const restaurantUsers = await User.find({
      role_id: restaurantRole._id,
    }).select("_id");
    const restaurantUserIds = restaurantUsers.map((user) => user._id);

    // Restaurant filter
    if (restaurantId !== "all") {
      if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
        return res.status(400).json({ error: "Invalid restaurant ID" });
      }
      filter.$or = [
        { sender_id: mongoose.Types.ObjectId(restaurantId) },
        { receiver_id: mongoose.Types.ObjectId(restaurantId) },
      ];
    } else {
      // Only include transactions involving restaurants
      filter.$or = [
        { sender_id: { $in: restaurantUserIds } },
        { receiver_id: { $in: restaurantUserIds } },
      ];
    }

    // Date filter
    const dateFilter = buildDateFilter(quickFilter, fromDate, toDate);
    if (dateFilter.created_at) {
      filter = { ...filter, ...dateFilter };
    }

    // Search by transaction_id, customer name, or customer_id
    if (search.trim()) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone_number: { $regex: search, $options: "i" } },
        ],
        role_id: await Role.findOne({ role_id: "role-5" }).select("_id"), // Only customers
      }).select("_id");
      const customers = await Customer.find({
        customer_id: { $regex: search, $options: "i" },
      }).select("user_id");
      const userIds = [
        ...users.map((user) => user._id),
        ...customers.map((customer) => customer.user_id),
      ];
      filter.$or = [
        { transaction_id: { $regex: search, $options: "i" } },
        { sender_id: { $in: userIds } },
        { receiver_id: { $in: userIds } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch transactions
    const transactionsPromise = Transaction.find(filter)
      .populate({
        path: "sender_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "role_id name" },
      })
      .populate({
        path: "receiver_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "role_id name" },
      })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Calculate statistics
    const statsPromise = Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalRevenue: { $sum: { $toDouble: "$amount" } },
          avgTransactionValue: { $avg: { $toDouble: "$amount" } },
          totalRefunds: {
            $sum: {
              $cond: [
                { $eq: ["$transaction_type", "Refund"] },
                { $toDouble: "$amount" },
                0,
              ],
            },
          },
        },
      },
    ]);

    const [transactions, statsResult] = await Promise.all([
      transactionsPromise,
      statsPromise,
    ]);

    // Enrich with customer_id and customer_name
    const formattedTransactions = await Promise.all(
      transactions.map(async (txn) => {
        let customer_id = "N/A";
        let customer_name = "Unknown";
        const senderRole = txn.sender_id?.role_id?.role_id;
        const receiverRole = txn.receiver_id?.role_id?.role_id;

        if (senderRole === "role-5") {
          const customer = await Customer.findOne({
            user_id: txn.sender_id._id,
          })
            .select("customer_id")
            .lean();
          customer_id = customer?.customer_id || "N/A";
          customer_name = txn.sender_id?.name || "Unknown";
        } else if (receiverRole === "role-5") {
          const customer = await Customer.findOne({
            user_id: txn.receiver_id._id,
          })
            .select("customer_id")
            .lean();
          customer_id = customer?.customer_id || "N/A";
          customer_name = txn.receiver_id?.name || "Unknown";
        }

        return {
          datetime: moment(txn.created_at).format("MMM DD, YYYY HH:mm"),
          id: txn.transaction_id || "N/A",
          customer: customer_name,
          customer_id,
          type: txn.transaction_type,
          description: txn.remarks || `${txn.transaction_type} transaction`,
          amount: parseFloat(txn.amount),
          status: txn.status || "Completed",
        };
      })
    );

    // Format statistics
    const stats = {
      totalTransactions: statsResult[0]?.totalTransactions || 0,
      totalRevenue: statsResult[0]?.totalRevenue || 0,
      avgTransactionValue: statsResult[0]?.avgTransactionValue || 0,
      totalRefunds: statsResult[0]?.totalRefunds || 0,
    };

    // Total pages for pagination
    const totalTransactions = stats.totalTransactions;
    const totalPages = Math.ceil(totalTransactions / parseInt(limit));

    res.status(200).json({
      transactions: formattedTransactions,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        totalTransactions,
      },
    });
  } catch (error) {
    console.error("Error in getTransactionHistory:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.getTransactionHistoryByUserId = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      quickFilter,
      fromDate,
      toDate,
      type,
    } = req.query;
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid userId received:", userId);
      return res
        .status(400)
        .json({ success: false, message: "Invalid or missing userId" });
    }

    let filter = {
      status: "Success",
      $or: [
        { sender_id: new mongoose.Types.ObjectId(userId) },
        { receiver_id: new mongoose.Types.ObjectId(userId) },
      ],
    };

    // Add transaction_type filter
    if (type && type !== "all") {
      filter.transaction_type = type;
    }

    // Date filter
    const dateFilter = buildDateFilter(quickFilter, fromDate, toDate);
    if (dateFilter.created_at) {
      filter = { ...filter, ...dateFilter };
    }

    // Search filter
    if (search.trim()) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone_number: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const userIds = users.map((u) => u._id);
      if (userIds.length === 0) {
        return res.status(200).json({
          success: true,
          transactions: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0,
            totalTransactions: 0,
          },
          todaysTransactions: 0,
        });
      }
      filter.$or = [
        { sender_id: { $in: userIds } },
        { receiver_id: { $in: userIds } },
      ];
    }

    const skip = (page - 1) * limit;

    const transactionsPromise = Transaction.find(filter)
      .populate({
        path: "sender_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "name" },
      })
      .populate({
        path: "receiver_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "name" },
      })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalTransactionsPromise = Transaction.countDocuments(filter);

    let todaysTransactions = 0;
    if (quickFilter === "today") {
      const todayFilter = {
        ...filter,
        created_at: {
          $gte: moment().startOf("day").utc().toDate(),
          $lte: moment().endOf("day").utc().toDate(),
        },
      };
      todaysTransactions = await Transaction.countDocuments(todayFilter);
    }

    const [transactions, totalTransactions] = await Promise.all([
      transactionsPromise,
      totalTransactionsPromise,
    ]);

    // Filter out incomplete transactions
    const safeTransactions = transactions.filter((txn) => {
      return txn?.sender_id?._id && txn?.receiver_id?._id;
    });

    const formattedTransactions = await Promise.all(
      safeTransactions.map(async (txn) => {
        const senderId = txn.sender_id._id.toString();
        const receiverId = txn.receiver_id._id.toString();

        let user = txn.sender_id;
        let amount = parseFloat(txn.amount);
        let customer_id = "N/A";

        if (receiverId === userId) {
          user = txn.receiver_id;
          amount = amount; // incoming
        } else if (senderId === userId) {
          amount = -amount; // outgoing
        }

        const customer = await Customer.findOne({ user_id: user._id })
          .select("customer_id")
          .lean();

        customer_id =
          customer?.customer_id ||
          `CUST${txn.transaction_id?.slice(-3) || "000"}`;

        return {
          id: txn.transaction_id,
          user: {
            name: user.name || "Unknown",
            type: user.role_id?.name || "Unknown",
          },
          customer_id,
          amount,
          datetime: txn.created_at,
          status: txn.status,
          type: txn.transaction_type,
        };
      })
    );

    res.status(200).json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalTransactions / limit),
        totalTransactions,
      },
      todaysTransactions,
    });
  } catch (error) {
    console.error("Error in getTransactionHistoryByUserId:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.exportTransactionHistoryByUserId = async (req, res) => {
  try {
    const { search = "", quickFilter, fromDate, toDate, type } = req.query;
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid userId received:", userId);
      return res
        .status(400)
        .json({ success: false, message: "Invalid or missing userId" });
    }

    let filter = {
      status: "Success",
      $or: [
        { sender_id: new mongoose.Types.ObjectId(userId) },
        { receiver_id: new mongoose.Types.ObjectId(userId) },
      ],
    };

    if (type && type !== "all") {
      filter.transaction_type = type;
    }

    const dateFilter = buildDateFilter(quickFilter, fromDate, toDate);
    if (dateFilter.created_at) {
      filter = { ...filter, ...dateFilter };
    }

    if (search.trim()) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone_number: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const userIds = users.map((user) => user._id);
      if (userIds.length === 0) {
        return res.status(200).json({
          success: true,
          transactions: [],
        });
      }
      filter.$or = [
        { sender_id: { $in: userIds } },
        { receiver_id: { $in: userIds } },
      ];
    }

    const transactions = await Transaction.find(filter)
      .populate({
        path: "sender_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "name" },
      })
      .populate({
        path: "receiver_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "name" },
      })
      .lean();

    const safeTransactions = transactions.filter((txn) => {
      return txn?.sender_id?._id && txn?.receiver_id?._id;
    });

    const formattedTransactions = await Promise.all(
      safeTransactions.map(async (txn) => {
        const senderId = txn.sender_id._id.toString();
        const receiverId = txn.receiver_id._id.toString();

        let user = txn.sender_id;
        let amount = parseFloat(txn.amount);
        let customer_id = "N/A";

        if (receiverId === userId) {
          user = txn.receiver_id;
          amount = amount; // Incoming
        } else if (senderId === userId) {
          amount = -amount; // Outgoing
        }

        const customer = await Customer.findOne({ user_id: user._id })
          .select("customer_id")
          .lean();
        customer_id =
          customer?.customer_id || `CUST${txn.transaction_id?.slice(-3) || "000"}`;

        return {
          id: txn.transaction_id,
          user: {
            name: user.name || "Unknown",
            type: user.role_id?.name || "Unknown",
          },
          customer_id,
          amount,
          datetime: txn.created_at,
          status: txn.status,
          type: txn.transaction_type,
        };
      })
    );

    res.status(200).json({
      success: true,
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.error("Error in exportTransactionHistoryByUserId:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getUserTransactionHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 10,
      search = "",
      quickFilter,
      fromDate,
      toDate,
      payment_method = "all", // Default to "all"
    } = req.query;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid userId format" });
    }

    // Build filter object
    let filter = {
      status: "Success",
      $or: [
        { sender_id:new mongoose.Types.ObjectId.createFromHexString(userId) },
        { receiver_id:new mongoose.Types.ObjectId.createFromHexString(userId) },
      ],
    };

    // Date filter
    const dateFilter = buildDateFilter(quickFilter, fromDate, toDate);
    if (dateFilter.created_at) {
      filter = { ...filter, ...dateFilter };
    }

    // Search filter
    if (search.trim()) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone_number: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const userIds = users.map((user) => user._id);
      filter.$or = [
        { sender_id: { $in: userIds } },
        { receiver_id: { $in: userIds } },
      ];
    }

    // Payment method filter
    if (payment_method !== "all") {
      if (
        !["Cash", "Gpay", "Mess bill", "Balance Deduction"].includes(
          payment_method
        )
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid payment method" });
      }
      filter.payment_method = payment_method;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch transactions
    const transactions = await Transaction.find(filter)
      .populate({
        path: "sender_id",
        select: "name role_id",
        populate: { path: "role_id", select: "name" },
      })
      .populate({
        path: "receiver_id",
        select: "name role_id",
        populate: { path: "role_id", select: "name" },
      })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Count total transactions
    const totalTransactions = await Transaction.countDocuments(filter);

    // Format transactions
    const formattedTransactions = await Promise.all(
      transactions.map(async (txn) => {
        let customer_id = "N/A";
        let color = "";
        let amount = parseFloat(txn.amount);

        // Determine if user is sender or receiver and set color
        if (txn.sender_id._id.toString() === userId) {
          color = "text-red-500"; // Sender: red
          amount = -amount; // Negative for outgoing
        } else {
          color = "text-green-600"; // Receiver: green
        }

        // Fetch customer_id
        const customerUserId =
          txn.sender_id.role_id?.name === "Customer"
            ? txn.sender_id._id
            : txn.receiver_id.role_id?.name === "Customer"
            ? txn.receiver_id._id
            : null;
        if (customerUserId) {
          const customer = await Customer.findOne({ user_id: customerUserId })
            .select("customer_id")
            .lean();
          customer_id = customer?.customer_id || "N/A";
        }

        return {
          id: txn.transaction_id,
          amount: `₹${Math.abs(amount).toFixed(2)}`,
          type: txn.transaction_type.toLowerCase(),
          payment_method: txn.payment_method || "N/A",
          status: txn.status,
          date: new Date(txn.created_at).toLocaleString(),
          customer_id,
          color,
          icon:
            txn.transaction_type.toLowerCase() === "topup"
              ? "➕"
              : txn.transaction_type.toLowerCase() === "refund"
              ? "↩️"
              : "🔒",
        };
      })
    );

    res.status(200).json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalTransactions / limit),
      },
    });
  } catch (error) {
    console.error("Error in getUserTransactionHistory:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getTransactionTreasuryRestaurantHistory = async (req, res) => {
  try {
    const {
      transactionType = "all",
      restaurantId = "all",
      fromDate,
      toDate,
      quickFilter,
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter object
    let filter = { status: "Success" };

    // Transaction type filter (only Transfer or Refund for restaurant transactions)
    if (transactionType !== "all") {
      filter.transaction_type = transactionType;
    } else {
      filter.transaction_type = { $in: ["Transfer", "Refund"] };
    }

    // Fetch restaurant role
    const restaurantRole = await Role.findOne({ role_id: "role-4" });
    if (!restaurantRole) {
      return res.status(400).json({ error: "Restaurant role not found" });
    }

    // Fetch all restaurant user IDs
    const restaurantUsers = await User.find({
      role_id: restaurantRole._id,
    }).select("_id");
    const restaurantUserIds = restaurantUsers.map((user) => user._id);

    // Restaurant filter
    if (restaurantId !== "all") {
      if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
        return res.status(400).json({ error: "Invalid restaurant ID" });
      }
      filter.$or = [
        { sender_id: mongoose.Types.ObjectId(restaurantId) },
        { receiver_id: mongoose.Types.ObjectId(restaurantId) },
      ];
    } else {
      // Only include transactions involving restaurants
      filter.$or = [
        { sender_id: { $in: restaurantUserIds } },
        { receiver_id: { $in: restaurantUserIds } },
      ];
    }

    // Date filter
    const dateFilter = buildDateFilter(quickFilter, fromDate, toDate);
    if (dateFilter.created_at) {
      filter = { ...filter, ...dateFilter };
    }

    // Search by transaction_id, customer name, or customer_id
    if (search.trim()) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone_number: { $regex: search, $options: "i" } },
        ],
        role_id: await Role.findOne({ role_id: "role-5" }).select("_id"), // Only customers
      }).select("_id");
      const customers = await Customer.find({
        customer_id: { $regex: search, $options: "i" },
      }).select("user_id");
      const userIds = [
        ...users.map((user) => user._id),
        ...customers.map((customer) => customer.user_id),
      ];
      filter.$or = [
        { transaction_id: { $regex: search, $options: "i" } },
        { sender_id: { $in: userIds } },
        { receiver_id: { $in: userIds } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch transactions
    const transactionsPromise = Transaction.find(filter)
      .populate({
        path: "sender_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "role_id name" },
      })
      .populate({
        path: "receiver_id",
        select: "name phone_number role_id",
        populate: { path: "role_id", select: "role_id name" },
      })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Calculate statistics
    const statsPromise = Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalRevenue: { $sum: { $toDouble: "$amount" } },
          avgTransactionValue: { $avg: { $toDouble: "$amount" } },
          totalRefunds: {
            $sum: {
              $cond: [
                { $eq: ["$transaction_type", "Refund"] },
                { $toDouble: "$amount" },
                0,
              ],
            },
          },
        },
      },
    ]);

    const [transactions, statsResult] = await Promise.all([
      transactionsPromise,
      statsPromise,
    ]);

    // Enrich with customer_id and customer_name
    const formattedTransactions = await Promise.all(
      transactions.map(async (txn) => {
        let customer_id = "N/A";
        let customer_name = "Unknown";
        const senderRole = txn.sender_id?.role_id?.role_id;
        const receiverRole = txn.receiver_id?.role_id?.role_id;

        if (senderRole === "role-5") {
          const customer = await Customer.findOne({
            user_id: txn.sender_id._id,
          })
            .select("customer_id")
            .lean();
          customer_id = customer?.customer_id || "N/A";
          customer_name = txn.sender_id?.name || "Unknown";
        } else if (receiverRole === "role-5") {
          const customer = await Customer.findOne({
            user_id: txn.receiver_id._id,
          })
            .select("customer_id")
            .lean();
          customer_id = customer?.customer_id || "N/A";
          customer_name = txn.receiver_id?.name || "Unknown";
        }

        return {
          datetime: moment(txn.created_at).format("MMM DD, YYYY HH:mm"),
          id: txn.transaction_id || "N/A",
          customer: customer_name,
          customer_id,
          type: txn.transaction_type,
          description: txn.remarks || `${txn.transaction_type} transaction`,
          amount: parseFloat(txn.amount),
          status: txn.status || "Completed",
        };
      })
    );

    // Format statistics
    const stats = {
      totalTransactions: statsResult[0]?.totalTransactions || 0,
      totalRevenue: statsResult[0]?.totalRevenue || 0,
      avgTransactionValue: statsResult[0]?.avgTransactionValue || 0,
      totalRefunds: statsResult[0]?.totalRefunds || 0,
    };

    // Total pages for pagination
    const totalTransactions = stats.totalTransactions;
    const totalPages = Math.ceil(totalTransactions / parseInt(limit));

    res.status(200).json({
      transactions: formattedTransactions,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        totalTransactions,
      },
    });
  } catch (error) {
    console.error("Error in getTransactionHistory:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// exports.exportTransactionHistoryByUserId = async (req, res) => {
//   try {
//     const { search = "", quickFilter, fromDate, toDate } = req.query;
//     const { userId } = req.params;

//     // Validate userId
//     if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
//       console.error("Invalid userId received:", userId);
//       return res.status(400).json({ success: false, message: "Invalid or missing userId" });
//     }

//     // Build filter object
//     let filter = {
//       status: "Success",
//       $or: [
//         { sender_id: new mongoose.Types.ObjectId(userId) },
//         { receiver_id: new mongoose.Types.ObjectId(userId) },
//       ],
//     };

//     // Apply date filter
//     const dateFilter = buildDateFilter(quickFilter, fromDate, toDate);
//     if (dateFilter.created_at) {
//       filter = { ...filter, ...dateFilter };
//     }

//     // Apply search filter
//     if (search.trim()) {
//       try {
//         const users = await User.find({
//           $or: [
//             { name: { $regex: search, $options: "i" } },
//             { phone_number: { $regex: search, $options: "i" } },
//           ],
//         }).select("_id");
//         const userIds = users.map((user) => user._id);
//         if (userIds.length === 0) {
//           console.log(`No users found for search term: ${search}`);
//           return res.status(200).json({ success: true, transactions: [] });
//         }
//         filter.$or = [
//           { sender_id: { $in: userIds } },
//           { receiver_id: { $in: userIds } },
//         ];
//       } catch (searchError) {
//         console.error("Search query error:", searchError.message, searchError.stack);
//         return res.status(500).json({
//           success: false,
//           message: "Failed to process search query",
//           error: searchError.message,
//         });
//       }
//     }

//     console.log("Export filter:", JSON.stringify(filter, null, 2));

//     // Fetch transactions with error handling
//     let transactions;
//     try {
//       transactions = await Transaction.find(filter)
//         .populate({
//           path: "sender_id",
//           select: "name phone_number role_id",
//           populate: { path: "role_id", select: "name" },
//         })
//         .populate({
//           path: "receiver_id",
//           select: "name phone_number role_id",
//           populate: { path: "role_id", select: "name" },
//         })
//         .lean();
//       console.log(`Fetched ${transactions.length} transactions for userId: ${userId}`);
//     } catch (dbError) {
//       console.error("Database query error:", dbError.message, dbError.stack);
//       return res.status(500).json({
//         success: false,
//         message: "Failed to fetch transactions",
//         error: dbError.message,
//       });
//     }

//     if (!transactions || transactions.length === 0) {
//       console.log(`No transactions found for userId: ${userId}`);
//       return res.status(200).json({ success: true, transactions: [] });
//     }

//     // Format transactions with robust error handling
//     const formattedTransactions = await Promise.all(
//       transactions.map(async (txn) => {
//         let user = txn.sender_id || {};
//         let amount = parseFloat(txn.amount) || 0;
//         let customer_id = "N/A";

//         // Determine if the logged-in user is sender or receiver
//         const isReceiver = txn.receiver_id?._id?.toString() === userId;
//         const isSender = txn.sender_id?._id?.toString() === userId;

//         if (isReceiver) {
//           user = txn.receiver_id || {};
//           amount = amount; // Incoming
//         } else if (isSender) {
//           amount = -amount; // Outgoing
//         }

//         // Fetch customer_id
//         try {
//           if (user._id) {
//             const customer = await Customer.findOne({ user_id: user._id }).select("customer_id").lean();
//             customer_id = customer?.customer_id || `CUST${txn.transaction_id?.slice(-3) || "000"}`;
//           } else {
//             console.warn(`No valid user._id for transaction ${txn.transaction_id || "N/A"}`);
//             customer_id = `CUST${txn.transaction_id?.slice(-3) || "000"}`;
//           }
//         } catch (customerErr) {
//           console.warn(`Failed to fetch customer_id for user ${user._id || "unknown"} in transaction ${txn.transaction_id || "N/A"}:`, customerErr.message);
//           customer_id = `CUST${txn.transaction_id?.slice(-3) || "000"}`;
//         }

//         return {
//           id: txn.transaction_id || "N/A",
//           user: {
//             name: user.name || "Unknown",
//             type: user.role_id?.name || "Unknown",
//           },
//           customer_id,
//           amount,
//           datetime: txn.created_at || new Date(),
//           status: txn.status || "N/A",
//         };
//       })
//     );

//     console.log(`Exported ${formattedTransactions.length} transactions for userId: ${userId}`);
//     return res.status(200).json({ success: true, transactions: formattedTransactions });
//   } catch (error) {
//     console.error("Error in exportTransactionHistoryByUserId:", error.message, error.stack);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// exports.getTransactionHistoryByUserId = async (req, res) => {
// };

// exports.exportTransactionHistoryByUserId = async (req, res) => {
//   try {
//     const { search = "", quickFilter, fromDate, toDate } = req.query;
//     const { userId } = req.params;

//     // Validate userId
//     if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
//       console.error("Invalid userId received:", userId);
//       return res.status(400).json({ success: false, message: "Invalid or missing userId" });
//     }

//     // Build filter object
//     let filter = {
//       status: "Success",
//       $or: [
//         { sender_id: new mongoose.Types.ObjectId(userId) },
//         { receiver_id: new mongoose.Types.ObjectId(userId) },
//       ],
//     };

//     // Apply date filter
//     const dateFilter = buildDateFilter(quickFilter, fromDate, toDate);
//     if (dateFilter.created_at) {
//       filter = { ...filter, ...dateFilter };
//     }

//     // Apply search filter
//     if (search.trim()) {
//       try {
//         const users = await User.find({
//           $or: [
//             { name: { $regex: search, $options: "i" } },
//             { phone_number: { $regex: search, $options: "i" } },
//           ],
//         }).select("_id");
//         const userIds = users.map((user) => user._id);
//         if (userIds.length === 0) {
//           console.log(`No users found for search term: ${search}`);
//           return res.status(200).json({ success: true, transactions: [] });
//         }
//         filter.$or = [
//           { sender_id: { $in: userIds } },
//           { receiver_id: { $in: userIds } },
//         ];
//       } catch (searchError) {
//         console.error("Search query error:", searchError.message, searchError.stack);
//         return res.status(500).json({
//           success: false,
//           message: "Failed to process search query",
//           error: searchError.message,
//         });
//       }
//     }

//     console.log("Export filter:", JSON.stringify(filter, null, 2));

//     // Fetch transactions
//     let transactions;
//     try {
//       transactions = await Transaction.find(filter)
//         .populate({
//           path: "sender_id",
//           select: "name phone_number role_id",
//           populate: { path: "role_id", select: "name" },
//         })
//         .populate({
//           path: "receiver_id",
//           select: "name phone_number role_id",
//           populate: { path: "role_id", select: "name" },
//         })
//         .lean();
//       console.log(`Fetched ${transactions.length} transactions for userId: ${userId}`);
//     } catch (dbError) {
//       console.error("Database query error:", dbError.message, dbError.stack);
//       return res.status(500).json({
//         success: false,
//         message: "Failed to fetch transactions",
//         error: dbError.message,
//       });
//     }

//     if (!transactions || transactions.length === 0) {
//       console.log(`No transactions found for userId: ${userId}`);
//       return res.status(200).json({ success: true, transactions: [] });
//     }

//     // Format transactions
//     const formattedTransactions = await Promise.all(
//       transactions.map(async (txn) => {
//         let user = txn.sender_id || {};
//         let amount = parseFloat(txn.amount) || 0;
//         let customer_id = "N/A";

//         // Determine if the logged-in user is sender or receiver
//         const isReceiver = txn.receiver_id?._id?.toString() === userId;
//         const isSender = txn.sender_id?._id?.toString() === userId;

//         if (isReceiver) {
//           user = txn.receiver_id || {};
//           amount = amount; // Incoming
//         } else if (isSender) {
//           amount = -amount; // Outgoing
//         }

//         try {
//           if (user._id) {
//             const customer = await Customer.findOne({ user_id: user._id }).select("customer_id").lean();
//             customer_id = customer?.customer_id || `CUST${txn.transaction_id?.slice(-3) || "000"}`;
//           } else {
//             console.warn(`No valid user._id for transaction ${txn.transaction_id || "N/A"}`);
//             customer_id = `CUST${txn.transaction_id?.slice(-3) || "000"}`;
//           }
//         } catch (customerErr) {
//           console.warn(`Failed to fetch customer_id for user ${user._id || "unknown"} in transaction ${txn.transaction_id || "N/A"}:`, customerErr.message);
//           customer_id = `CUST${txn.transaction_id?.slice(-3) || "000"}`;
//         }

//         return {
//           id: txn.transaction_id || "N/A",
//           user: {
//             name: user.name || "Unknown",
//             type: user.role_id?.name || "Unknown",
//           },
//           customer_id,
//           amount,
//           datetime: txn.created_at || new Date(),
//           status: txn.status || "N/A",
//           type: txn.transaction_type ? txn.transaction_type.toLowerCase() : "N/A", // Add transaction type
//         };
//       })
//     );

//     console.log(`Exported ${formattedTransactions.length} transactions for userId: ${userId}`);
//     return res.status(200).json({ success: true, transactions: formattedTransactions });
//   } catch (error) {
//     console.error("Error in exportTransactionHistoryByUserId:", error.message, error.stack);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// exports.getTransactionHistoryByUserId = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       search = "",
//       quickFilter,
//       fromDate,
//       toDate,
//       type, // Add type to destructured query params
//     } = req.query;
//     const { userId } = req.params;

//     if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
//       console.error("Invalid userId received:", userId);
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid or missing userId" });
//     }

//     let filter = {
//       status: "Success",
//       $or: [
//         { sender_id: mongoose.Types.ObjectId.createFromHexString(userId) },
//         { receiver_id: mongoose.Types.ObjectId.createFromHexString(userId) },
//       ],
//     };

//     // Date filter
//     const dateFilter = buildDateFilter(quickFilter, fromDate, toDate);
//     if (dateFilter.created_at) {
//       filter = { ...filter, ...dateFilter };
//     }

//     // Type filter
//     if (type && type !== "all") {
//       filter.transaction_type = type.charAt(0).toUpperCase() + type.slice(1);
//     }

//     // Search filter
//     if (search.trim()) {
//       const users = await User.find({
//         $or: [
//           { name: { $regex: search, $options: "i" } },
//           { phone_number: { $regex: search, $options: "i" } },
//         ],
//       }).select("_id");
//       const userIds = users.map((user) => user._id);
//       filter.$or = [
//         { sender_id: { $in: userIds } },
//         { receiver_id: { $in: userIds } },
//       ];
//     }

//     const skip = (page - 1) * limit;

//     const transactionsPromise = Transaction.find(filter)
//       .populate({
//         path: "sender_id",
//         select: "name phone_number role_id",
//         populate: { path: "role_id", select: "name" },
//       })
//       .populate({
//         path: "receiver_id",
//         select: "name phone_number role_id",
//         populate: { path: "role_id", select: "name" },
//       })
//       .skip(skip)
//       .limit(parseInt(limit))
//       .lean();

//     const totalTransactionsPromise = Transaction.countDocuments(filter);

//     let todaysTransactions = 0;
//     if (quickFilter === "today") {
//       const todayFilter = {
//         ...filter,
//         created_at: {
//           $gte: moment().startOf("day").utc().toDate(),
//           $lte: moment().endOf("day").utc().toDate(),
//         },
//       };
//       todaysTransactions = await Transaction.countDocuments(todayFilter);
//     }

//     const [transactions, totalTransactions] = await Promise.all([
//       transactionsPromise,
//       totalTransactionsPromise,
//     ]);

//     const formattedTransactions = await Promise.all(
//       transactions.map(async (txn) => {
//         let user = txn.sender_id;
//         let amount = parseFloat(txn.amount);
//         let customer_id = "N/A";

//         if (txn.receiver_id._id.toString() === userId) {
//           user = txn.receiver_id;
//           amount = amount;
//         } else if (txn.sender_id._id.toString() === userId) {
//           amount = -amount;
//         }

//         const customer = await Customer.findOne({ user_id: user._id })
//           .select("customer_id")
//           .lean();
//         customer_id =
//           customer?.customer_id || `CUST${txn.transaction_id.slice(-3)}`;

//         return {
//           id: txn.transaction_id,
//           user: {
//             name: user.name || "Unknown",
//             type: user.role_id?.name || "Unknown",
//           },
//           customer_id,
//           amount,
//           datetime: txn.created_at,
//           status: txn.status,
//           type: txn.transaction_type
//             ? txn.transaction_type.toLowerCase()
//             : "N/A",
//         };
//       })
//     );

//     res.status(200).json({
//       success: true,
//       transactions: formattedTransactions,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         totalPages: Math.ceil(totalTransactions / limit),
//         totalTransactions,
//       },
//       todaysTransactions,
//     });
//   } catch (error) {
//     console.error("Error in getTransactionHistoryByUserId:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };
exports.getTransactionTypes = async (req, res) => {
  try {
    // Get the transaction schema
    const transactionSchema = require("../model/transactionModel").schema;
    // Extract the enum values for transaction_type
    const transactionTypes =
      transactionSchema.path("transaction_type").enumValues;
    res.status(200).json({ success: true, data: transactionTypes });
  } catch (error) {
    console.error(
      "Error fetching transaction types:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch transaction types",
        error: error.message,
      });
  }
};

exports.getTodayBalance = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid userId format" });
    }

    // Fetch user and validate role
    const user = await User.findById(userId).populate("role_id");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.role_id?.role_id !== "role-4") {
      return res
        .status(400)
        .json({ success: false, message: "User is not a restaurant (role-4)" });
    }

    // Define today's date range
    const startOfDay = moment().startOf("day").utc().toDate();
    const endOfDay = moment().endOf("day").utc().toDate();

    // Fetch transactions for today where the user is sender or receiver
    const transactions = await Transaction.find({
      $or: [{ sender_id: userId }, { receiver_id: userId }],
      status: "Success",
      transaction_type: { $in: ["Transfer", "Refund"] },
      created_at: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    // Calculate today's balance
    let todayBalance = 0;
    transactions.forEach((txn) => {
      const amount = parseFloat(txn.amount);
      if (
        txn.transaction_type === "Transfer" &&
        txn.receiver_id.toString() === userId
      ) {
        todayBalance += amount; // Incoming transfer (customer to restaurant)
      } else if (
        txn.transaction_type === "Refund" &&
        txn.sender_id.toString() === userId
      ) {
        todayBalance -= amount; // Outgoing refund (restaurant to customer)
      }
    });

    res.status(200).json({
      success: true,
      data: {
        todayBalance: todayBalance.toFixed(2),
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    console.error("Error in getTodayBalance:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
