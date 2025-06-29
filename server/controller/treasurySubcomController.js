const TreasurySubcom = require("../model/treasurySubcomModel");
const Role=require('../model/roleModel');
const User =require('../model/userModel');
const LoginLog=require('../model/loginLogModel');
// const UserBalance = mongoose.model("UserBalance");
const mongoose=require('mongoose');
const Treasury=require('../model/treasurySubcomModel');
const Transaction=require('../model/transactionModel');
const Location = require('../model/locationModel');
const Upi = require('../model/upiModel');

// Create Treasury Subcom
exports.createSubcom = async (req, res) => {
  try {
    const { user_id, top_up_limit = 5000.00 } = req.body;

    const subcom = new TreasurySubcom({
      user_id,
      top_up_limit,
    });

    await subcom.save();
    res.status(201).json({ success: true, data: subcom });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
// Get all Treasury Subcom members
exports.getAllSubcoms = async (req, res) => {
  try {
    const subcoms = await TreasurySubcom.find().populate("user_id", "name email phone_number");
    res.status(200).json({ success: true, data: subcoms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// Get a Treasury Subcom by ID
exports.getSubcomById = async (req, res) => {
  try {
    const subcom = await TreasurySubcom.findById(req.params.id).populate("user_id");
    if (!subcom)
      return res.status(404).json({ success: false, message: "Subcom not found" });

    res.status(200).json({ success: true, data: subcom });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// Update Treasury Subcom
exports.updateSubcom = async (req, res) => {
  try {
    const updated = await TreasurySubcom.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({ success: false, message: "Subcom not found" });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
// Delete Treasury Subcom
exports.deleteSubcom = async (req, res) => {
  try {
    const deleted = await TreasurySubcom.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Subcom not found" });

    res.status(200).json({ success: true, message: "Subcom deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllTreasurySubcomDetails = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      lastActive = "all",
      regDate = "",
      sortBy = "asc",
      page = 1,
      pageSize = 10,
    } = req.query;

  

    // Find Treasury-Subcom role
    const treasurySubcomRole = await Role.findOne({ name: "Treasury-Subcom" }).select("_id");
    if (!treasurySubcomRole) {

      return res.json({
        loginSessions: [],
        totalLoginSessions: 0,
        totalBalance: 0,
        onlineCount: 0,
        totalPages: 0,
      });
    }

    const treasurySubcomRoleId = treasurySubcomRole._id;

    // Base query for users with Treasury-Subcom role
    let userQuery = { role_id: treasurySubcomRoleId };
    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone_number: { $regex: search, $options: "i" } },
      ];
    }
    if (regDate) {
      const startDate = new Date(regDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);
      userQuery.created_at = { $gte: startDate, $lt: endDate };
    }

    // Fetch treasury subcom users
    const treasuryUsers = await User.find(userQuery).select("_id name");
    const treasuryUserIds = treasuryUsers.map((u) => u._id);

    // LoginLog query
    let loginLogQuery = { user_id: { $in: treasuryUserIds } };
    if (status !== "all") {
      loginLogQuery.status = status.toLowerCase() === "online";
    }
    if (["today", "week", "month"].includes(lastActive)) {
      const now = new Date();
      let dateFilter;
      if (lastActive === "today") {
        dateFilter = new Date(now.setHours(0, 0, 0, 0));
      } else if (lastActive === "week") {
        dateFilter = new Date(now.setDate(now.getDate() - 7));
      } else {
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
      }
      loginLogQuery.login_time = { $gte: dateFilter };
    }

    // Fetch login sessions with population
    const loginLogs = await LoginLog.find(loginLogQuery)
      .populate("user_id", "name")
      .populate("location_id", "name")
      .populate("upi_id", "upiId")
      .lean();

    // Calculate duration and transaction summaries
    const currentTime = new Date("2025-06-30T04:14:00+05:30");
    const formattedSessions = await Promise.all(
      loginLogs.map(async (log) => {
        const endTime = log.logout_time || currentTime;
        const durationMs = new Date(endTime) - new Date(log.login_time);
        const duration = {
          hours: Math.floor(durationMs / (1000 * 60 * 60)),
          minutes: Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((durationMs % (1000 * 60)) / 1000),
        };

        // Fetch transactions for this session
        const transactions = await Transaction.find({
          $or: [
            { sender_id: log.user_id },
            { receiver_id: log.user_id },
          ],
          created_at: { $gte: log.login_time, $lte: endTime },
          status: "Success",
        }).lean();

        // Calculate payment method summaries
        let gpayAmount = 0;
        let cashAmount = 0;
        let messBillAmount = 0;
        transactions.forEach((txn) => {
          const amount = parseFloat(txn.amount);
          if (txn.payment_method === "Gpay") gpayAmount += amount;
          if (txn.payment_method === "Cash") cashAmount += amount;
          if (txn.payment_method === "Mess bill") messBillAmount += amount;
        });

        return {
          session_id: log._id.toString(),
          treasury_name: log.user_id?.name || "Unknown",
          login_time: log.login_time.toLocaleString(),
          logout_time: log.logout_time ? log.logout_time.toLocaleString() : "Active",
          duration: `${duration.hours}h ${duration.minutes}m ${duration.seconds}s`,
          location: log.location_id?.name || "N/A",
          upi: log.upi_id?.upiId || "N/A",
          gpay_amount: gpayAmount.toFixed(2),
          cash_amount: cashAmount.toFixed(2),
          mess_bill_amount: messBillAmount.toFixed(2),
          status: log.status && !log.logout_time ? "Online" : "Offline",
        };
      })
    );

    // Apply sorting
    const sortOption = {
      asc: (a, b) => a.treasury_name.localeCompare(b.treasury_name),
      desc: (a, b) => b.treasury_name.localeCompare(a.treasury_name),
      recent: (a, b) => new Date(b.login_time) - new Date(a.login_time),
      "high-balance": (a, b) => b.gpay_amount + b.cash_amount + b.mess_bill_amount - (a.gpay_amount + a.cash_amount + a.mess_bill_amount),
      "low-balance": (a, b) => a.gpay_amount + a.cash_amount + a.mess_bill_amount - (b.gpay_amount + b.cash_amount + b.mess_bill_amount),
    }[sortBy] || ((a, b) => a.treasury_name.localeCompare(b.treasury_name));

    formattedSessions.sort(sortOption);

    // Pagination
    const totalItems = formattedSessions.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const start = (page - 1) * pageSize;
    const paginated = formattedSessions.slice(start, start + parseInt(pageSize));

    // Compute statistics
    const totalBalance = formattedSessions.reduce(
      (sum, session) => sum + parseFloat(session.gpay_amount) + parseFloat(session.cash_amount) + parseFloat(session.mess_bill_amount),
      0
    );
    const onlineCount = formattedSessions.filter((s) => s.status === "Online").length;



    res.json({
      loginSessions: paginated,
      totalLoginSessions: totalItems,
      totalBalance: parseFloat(totalBalance.toFixed(2)),
      onlineCount,
      totalPages,
    });
  } catch (error) {
    console.error("Error in getAllTreasurySubcomDetails:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.getTreasuryDetails = async (req, res) => {
  try {
    const { treasuryId } = req.params;

    const treasury = await Treasury.aggregate([
      { $match: { treasury_id: treasuryId } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "userbalances",
          localField: "user_id",
          foreignField: "user_id",
          as: "balance",
        },
      },
      { $unwind: { path: "$balance", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "loginlogs",
          localField: "user_id",
          foreignField: "user_id",
          as: "loginLogs",
        },
      },
      {
        $lookup: {
          from: "transactions",
          let: { userId: "$user_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$sender_id", "$$userId"] },
                    { $eq: ["$receiver_id", "$$userId"] },
                  ],
                },
              },
            },
            { $count: "totalTransactions" },
          ],
          as: "transactionCount",
        },
      },
      { $unwind: { path: "$transactionCount", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: "$treasury_id",
          user_id: "$user_id",
          name: "$user.name",
          phone: "$user.phone_number",
          email: "$user.email",
          balance: { $ifNull: [{ $toDouble: "$balance.balance" }, 0.00] },
          status: {
            $cond: [
              { $eq: [{ $max: "$loginLogs.status" }, true] },
              "Online",
              "Offline",
            ],
          },
          lastActive: { $max: "$loginLogs.login_time" },
          registrationDate: "$user.createdAt",
          totalTransactions: { $ifNull: ["$transactionCount.totalTransactions", 0] },
        },
      },
    ]);

    if (!treasury.length) {
      return res.status(404).json({ error: "Treasury not found" });
    }

    res.status(200).json(treasury[0]);
  } catch (error) {
    console.error("Error fetching treasury details:", error);
    res.status(500).json({ error: "Failed to fetch treasury details" });
  }
};

exports.getTreasuryTransactions = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { payment_method } = req.query; // Filter by payment method (Cash, Gpay, Mess bill)

    // Find the login session
    const loginLog = await LoginLog.findById(sessionId)
      .populate("user_id", "name")
      .populate("location_id", "name")
      .populate("upi_id", "upiId")
      .lean();

    if (!loginLog) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Use current time for active sessions
    const endTime = loginLog.logout_time || new Date("2025-06-30T04:14:00+05:30");

    // Transaction query
    let transactionQuery = {
      $or: [
        { sender_id: loginLog.user_id },
        { receiver_id: loginLog.user_id },
      ],
      created_at: { $gte: loginLog.login_time, $lte: endTime },
      status: "Success",
    };

    if (payment_method && ["Cash", "Gpay", "Mess bill"].includes(payment_method)) {
      transactionQuery.payment_method = payment_method;
    }

    const transactions = await Transaction.find(transactionQuery)
      .populate("sender_id", "name")
      .populate("receiver_id", "name")
      .lean();

    const formattedTransactions = transactions.map((tx) => ({
      id: tx.transaction_id || tx._id.toString(),
      type: tx.transaction_type.toLowerCase(),
      amount: parseFloat(tx.amount),
      date: tx.created_at,
      description:
        tx.transaction_type === "Transfer"
          ? `To ${tx.receiver_id?.name || "Unknown"}`
          : tx.transaction_type === "Refund"
          ? `From ${tx.sender_id?.name || "Unknown"}`
          : tx.remarks || `${tx.transaction_type} transaction`,
      payment_method: tx.payment_method || "Unknown",
    }));

    res.status(200).json({
      session: {
        treasury_name: loginLog.user_id?.name || "Unknown",
        login_time: loginLog.login_time.toLocaleString(),
        logout_time: loginLog.logout_time ? loginLog.logout_time.toLocaleString() : "Active",
        location: loginLog.location_id?.name || "N/A",
        upi: loginLog.upi_id?.upiId || "N/A",
      },
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.error("Error fetching session transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

exports.getSessionReport = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId format" });
    }

    // Find the most recent active login session (no logout_time, status: true)
    const currentSession = await LoginLog.findOne({
      user_id: mongoose.Types.ObjectId.createFromHexString(userId),
      logout_time: { $exists: false },
      status: true, // Ensure active session
    })
      .sort({ login_time: -1 }) // Most recent first
      .populate("location_id", "name")
      .populate("upi_id", "upiId")
      .lean();

    if (!currentSession) {

      return res.status(404).json({ success: false, message: "No active session found for this user" });
    }

 

    const { login_time, location_id, upi_id } = currentSession;

    // Use current time as end time (04:04 AM IST, June 30, 2025)
    const endTime = new Date("2025-06-30T04:04:00+05:30");
    const durationMs = endTime - new Date(login_time);
    const duration = {
      hours: Math.floor(durationMs / (1000 * 60 * 60)),
      minutes: Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((durationMs % (1000 * 60)) / 1000),
    };

    // Fetch transactions for this session
    const transactions = await Transaction.find({
      $or: [
        { sender_id: mongoose.Types.ObjectId.createFromHexString(userId) },
        { receiver_id: mongoose.Types.ObjectId.createFromHexString(userId) },
      ],
      created_at: { $gte: login_time, $lte: endTime },
      status: "Success",
    }).lean();



    // Calculate transaction summaries
    let totalOutgoing = 0;
    let totalIncoming = 0;
    let refundOutgoingCount = 0;
    let topUpOutgoingCount = 0;
    const paymentMethodSummary = {};
    const transactionTypeCounts = {};

    transactions.forEach((txn) => {
      const amount = parseFloat(txn.amount);
      const isSender = txn.sender_id.toString() === userId;
      const isReceiver = txn.receiver_id.toString() === userId;

      // Total outgoing and incoming amounts
      if (isSender) {
        totalOutgoing += amount;
        if (txn.transaction_type === "Refund") refundOutgoingCount += 1;
        if (txn.transaction_type === "TopUp") topUpOutgoingCount += 1;
      }
      if (isReceiver) {
        totalIncoming += amount;
      }

      // Payment method summary
      const paymentMethod = txn.payment_method || "Unknown";
      if (!paymentMethodSummary[paymentMethod]) {
        paymentMethodSummary[paymentMethod] = 0;
      }
      paymentMethodSummary[paymentMethod] += amount;

      // Transaction type counts
      const transactionType = txn.transaction_type;
      if (!transactionTypeCounts[transactionType]) {
        transactionTypeCounts[transactionType] = 0;
      }
      transactionTypeCounts[transactionType] += 1;
    });

    // Format the response
    const report = {
      session: {
        start_time: login_time.toLocaleString(),
        end_time: endTime.toLocaleString(),
        duration: `${duration.hours}h ${duration.minutes}m ${duration.seconds}s`,
        location: location_id?.name || "N/A",
        upi_id: upi_id?.upiId || "N/A",
      },
      payment_methods: Object.entries(paymentMethodSummary).map(([method, amount]) => ({
        method,
        amount: `₹${amount.toFixed(2)}`,
      })),
      transaction_types: Object.entries(transactionTypeCounts).map(([type, count]) => ({
        type,
        count,
      })),
      total_outgoing: `₹${totalOutgoing.toFixed(2)}`,
      total_incoming: `₹${totalIncoming.toFixed(2)}`,
      refund_outgoing_count: refundOutgoingCount,
      topup_outgoing_count: topUpOutgoingCount,
    };

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error in getSessionReport:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: `Error generating session report: ${error.message || "Unknown error"}` });
  }
};

// exports.getTreasuryTransactions = async (req, res) => {
//   try {
//     const { treasuryId } = req.params;
//     const treasury = await Treasury.findOne({ treasury_id: treasuryId }).select("user_id");
//     if (!treasury) {
//       return res.status(404).json({ error: "Treasury not found" });
//     }

//     const transactions = await Transaction.find({
//       $or: [
//         { sender_id: treasury.user_id },
//         { receiver_id: treasury.user_id },
//       ],
//       transaction_type: { $in: ["Transfer", "TopUp", "Refund", "Credit"] },
//     })
//       .populate("sender_id", "name")
//       .populate("receiver_id", "name")
//       .lean();

//     const formattedTransactions = transactions.map((tx) => ({
//       id: tx.transaction_id,
//       type: tx.transaction_type.toLowerCase(),
//       amount: parseFloat(tx.amount),
//       date: tx.created_at,
//       description:
//         tx.transaction_type === "Transfer"
//           ? `To ${tx.receiver_id?.name || "Unknown"}`
//           : tx.transaction_type === "Refund"
//           ? `From ${tx.sender_id?.name || "Unknown"}`
//           : tx.remarks || `${tx.transaction_type} transaction`,
//     }));

//     res.status(200).json({ data: formattedTransactions });
//   } catch (error) {
//     console.error("Error fetching treasury transactions:", error);
//     res.status(500).json({ error: "Failed to fetch transactions" });
//   }
// };