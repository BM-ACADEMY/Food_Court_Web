const Transaction = require("../model/transactionModel");
const UserBalance=require('../model/userBalanceModel')
const MasterAdmin=require('../model/masterAdminModel');
const User=require('../model/userModel')
const moment=require('moment');
const Role =require('../model/roleModel');
const mongoose=require('mongoose');

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
// exports.updateTransaction = async (req, res) => {
//   try {
//     const updateData = {
//       ...req.body,
//       edited_at: new Date(),
//     };

//     const updated = await Transaction.findByIdAndUpdate(req.params.id, updateData, {
//       new: true,
//     });

//     if (!updated) {
//       return res.status(404).json({ success: false, message: "Transaction not found" });
//     }

//     res.status(200).json({ success: true, data: updated });
//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

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


// Helper function to build date range filter
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

  const filter = startDate && endDate ? { created_at: { $gte: startDate, $lte: endDate } } : {};
  console.log("Date filter:", { quickFilter, startDate, endDate, filter });
  return filter;
};


// Controller to get transaction history with filters and search
exports.getTransactionHistory = async (req, res) => {
  try {
    const {
      transactionType = "all",
      userType = "all",
      location = "all",
      fromDate,
      toDate,
      quickFilter,
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter object
    let filter = { status: "Success" }; // Only include successful transactions

    // Transaction type filter
    if (transactionType !== "all") {
      filter.transaction_type = transactionType;
    }

    // Location filter
    if (location !== "all") {
      filter.location_id = mongoose.Types.ObjectId.createFromHexString(location);
    }

    // Date filter (fromDate/toDate or quickFilter)
    const dateFilter = buildDateFilter(quickFilter, fromDate, toDate);
    if (dateFilter.created_at) {
      filter = { ...filter, ...dateFilter };
    }

    // User type filter (based on role_id)
    if (userType !== "all") {
      const role = await Role.findOne({ name: userType });
      if (!role) {
        return res.status(400).json({ error: `Invalid user type: ${userType}` });
      }
      const usersWithRole = await User.find({ role_id: role._id }).select("_id");
      const userIds = usersWithRole.map((user) => user._id);
      filter.$or = [
        { sender_id: { $in: userIds } },
        { receiver_id: { $in: userIds } },
      ];
    }

    // Search by name or phone number
    let userIds = [];
    if (search.trim()) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone_number: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      userIds = users.map((user) => user._id);
      filter.$or = [
        { sender_id: { $in: userIds } },
        { receiver_id: { $in: userIds } },
      ];
    }

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
      .populate("location_id", "name")
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
              $subtract: [
                "$_id.hour",
                { $mod: ["$_id.hour", 2] }, // Group by 2-hour intervals
              ],
            },
          },
          transactions: {
            $sum: {
              $cond: [
                { $ne: ["$_id.type", "Refund"] }, // Exclude refunds for transactions
                "$amount",
                0,
              ],
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
              $cond: [
                { $ne: ["$_id.type", "Refund"] },
                "$amount",
                0,
              ],
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
              $cond: [
                { $ne: ["$_id.type", "Refund"] },
                "$amount",
                0,
              ],
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
    const [transactions, statsResult, hourlyChart, dailyChart, weeklyChart] = await Promise.all([
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
      user: {
        name: txn.sender_id?.name || "Unknown",
        type: txn.sender_id?.role_id?.name || "Unknown",
      },
      type: txn.transaction_type,
      description: txn.remarks || `${txn.transaction_type} transaction`,
      location: txn.location_id?.name || "Unknown",
      amount: parseFloat(txn.amount),
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
    res.status(500).json({ error: "Internal server error" });
  }
};


// Update transaction by transaction_id
exports.updateTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { amount, transaction_type, payment_method, status, remarks, location_id, edited_by_id } = req.body;

    // Validate transaction_id
    if (!transactionId || !transactionId.startsWith("TRANX")) {
      return res.status(400).json({ success: false, message: "Invalid transaction ID" });
    }

    // Validate required fields
    if (!edited_by_id || !mongoose.Types.ObjectId.isValid(edited_by_id)) {
      return res.status(400).json({ success: false, message: "Invalid or missing edited_by_id" });
    }

    // Prepare update object with only provided fields
    const updateData = {
      amount: amount !== undefined && amount !== null ? parseFloat(amount) : undefined,
      transaction_type: transaction_type || undefined,
      payment_method: payment_method || undefined,
      status: status || undefined,
      remarks: remarks || undefined,
      location_id:
        location_id && mongoose.Types.ObjectId.isValid(location_id) ? location_id : undefined,
      edited_at: new Date(),
      edited_by_id,
    };

    // Remove undefined fields to prevent overwriting with undefined
    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

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
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    // Format response to match frontend expectations
    const formattedTransaction = {
      id: transaction.transaction_id,
      datetime: transaction.created_at.toISOString(),
      user: {
        name: transaction.sender_id?.name || transaction.receiver_id?.name || "Unknown",
        type: transaction.sender_id?.type || transaction.receiver_id?.type || "Unknown",
      },
      type: transaction.transaction_type,
      description: transaction.remarks || "",
      location: transaction.location_id?.name || "N/A",
      amount: parseFloat(transaction.amount),
      payment_method: transaction.payment_method || "",
      status: transaction.status || "Pending",
      location_id: transaction.location_id?._id?.toString() || "",
      edited_at: transaction.edited_at ? transaction.edited_at.toISOString() : null,
      edited_by_id: transaction.edited_by_id ? transaction.edited_by_id.toString() : null,
    };

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      transaction: formattedTransaction,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};