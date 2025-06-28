const TreasurySubcom = require("../model/treasurySubcomModel");
const Role=require('../model/roleModel');
const User =require('../model/userModel');
const LoginLog=require('../model/loginLogModel');
// const UserBalance = mongoose.model("UserBalance");
const mongoose=require('mongoose');
const Treasury=require('../model/treasurySubcomModel');
const Transaction=require('../model/transactionModel');


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

    console.log("Query params:", { search, status, lastActive, regDate, sortBy, page, pageSize });

    const treasurySubcomRole = await Role.findOne({ name: "Treasury-Subcom" }).select("_id");
    if (!treasurySubcomRole) {
      console.log("Treasury-Subcom role not found");
      return res.json({
        treasurySubcoms: [],
        totalTreasurySubcoms: 0,
        totalBalance: 0,
        onlineCount: 0,
        totalPages: 0,
      });
    }

    const treasurySubcomRoleId = treasurySubcomRole._id;
    let userQuery = { role_id: treasurySubcomRoleId };

    if (search) {
      const treasurySubcomIds = await TreasurySubcom.find({
        treasury_subcom_id: { $regex: search, $options: "i" },
      }).select("user_id");
      const treasurySubcomUserIds = treasurySubcomIds.map((subcom) => subcom.user_id);
      userQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone_number: { $regex: search, $options: "i" } },
        { _id: { $in: treasurySubcomUserIds } },
      ];
      console.log("Search treasurySubcomUserIds:", treasurySubcomUserIds);
    }

    if (regDate) {
      const startDate = new Date(regDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);
      userQuery.created_at = { $gte: startDate, $lt: endDate };
      console.log("Registration date filter:", { startDate, endDate });
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
      const recentLogUserIds = await LoginLog.find({
        login_time: { $gte: dateFilter },
      }).distinct("user_id");
      if (recentLogUserIds.length > 0) {
        userQuery._id = { $in: recentLogUserIds };
      }
      console.log("Last active user IDs:", recentLogUserIds);
    }

    let pipeline = [
      { $match: userQuery },
      {
        $lookup: {
          from: "treasurysubcoms",
          localField: "_id",
          foreignField: "user_id",
          as: "treasurySubcom",
        },
      },
      { $unwind: { path: "$treasurySubcom", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "userbalances",
          localField: "_id",
          foreignField: "user_id",
          as: "balance",
        },
      },
      { $unwind: { path: "$balance", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "transactions",
          let: { user_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$sender_id", "$$user_id"] },
                    { $eq: ["$receiver_id", "$$user_id"] },
                  ],
                },
              },
            },
            { $sort: { created_at: -1 } },
            { $limit: 1 },
            {
              $lookup: {
                from: "users",
                localField: "sender_id",
                foreignField: "_id",
                as: "sender",
              },
            },
            { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "roles",
                localField: "sender.role_id",
                foreignField: "_id",
                as: "sender_role",
              },
            },
            { $unwind: { path: "$sender_role", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "users",
                localField: "receiver_id",
                foreignField: "_id",
                as: "receiver",
              },
            },
            { $unwind: { path: "$receiver", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "roles",
                localField: "receiver.role_id",
                foreignField: "_id",
                as: "receiver_role",
              },
            },
            { $unwind: { path: "$receiver_role", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                sender_id: "$sender._id",
                sender_name: "$sender.name",
                sender_role_name: "$sender_role.name",
                receiver_id: "$receiver._id",
                receiver_name: "$receiver.name",
                receiver_role_name: "$receiver_role.name",
              },
            },
          ],
          as: "transaction",
        },
      },
      { $unwind: { path: "$transaction", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          phone_number: 1,
          treasury_subcom_id: "$treasurySubcom.treasury_subcom_id",
          balance: { $ifNull: ["$balance.balance", 0] },
          created_at: 1,
          sender_id: "$transaction.sender_id",
          sender_name: "$transaction.sender_name",
          sender_role_name: "$transaction.sender_role_name",
          receiver_id: "$transaction.receiver_id",
          receiver_name: "$transaction.receiver_name",
          receiver_role_name: "$transaction.receiver_role_name",
        },
      },
    ];

    const sortOption = {
      asc: { name: 1 },
      desc: { name: -1 },
      recent: { created_at: -1 },
      "high-balance": { balance: -1 },
      "low-balance": { balance: 1 },
    }[sortBy] || { name: 1 };

    pipeline.push({ $sort: sortOption });

    const treasurySubcomsRaw = await User.aggregate(pipeline);
    console.log("Aggregated treasurySubcoms:", treasurySubcomsRaw.length);

    // Get Login Statuses
    const treasurySubcomIds = treasurySubcomsRaw.map((u) => u._id);
    const loginLogs = await LoginLog.find({ user_id: { $in: treasurySubcomIds } }).sort({ login_time: -1 });

    const lastActiveMap = {};
    const activeUserSet = new Set();

    loginLogs.forEach((log) => {
      const id = log.user_id.toString();
      if (!lastActiveMap[id]) {
        const diff = (new Date() - new Date(log.login_time)) / 60000;
        if (diff < 5) lastActiveMap[id] = "Just now";
        else if (diff < 60) lastActiveMap[id] = `${Math.floor(diff)} mins ago`;
        else if (diff < 1440) lastActiveMap[id] = `${Math.floor(diff / 60)} hours ago`;
        else lastActiveMap[id] = new Date(log.login_time).toISOString().split("T")[0];
      }
      if (log.status === true && !log.logout_time) activeUserSet.add(id);
    });

    // Format data
    let formatted = treasurySubcomsRaw.map((u) => {
      const idStr = u._id.toString();
      return {
        id: u.treasury_subcom_id,
        name: u.name,
        phone: u.phone_number,
        balance: parseFloat(u.balance.toString()),
        status: activeUserSet.has(idStr) ? "Online" : "Offline",
        lastActive: lastActiveMap[idStr] || "Unknown",
        sender_id: u.sender_id?.toString() || "Unknown",
        sender_name: u.sender_name || "Unknown",
        sender_role_name: u.sender_role_name || "Unknown",
        receiver_id: u.receiver_id?.toString() || "Unknown",
        receiver_name: u.receiver_name || "Unknown",
        receiver_role_name: u.receiver_role_name || "Unknown",
      };
    });

    // Apply status filter AFTER formatting
    if (status !== "all") {
      formatted = formatted.filter((u) => u.status.toLowerCase() === status.toLowerCase());
    }

    // Pagination after filtering
    const totalItems = formatted.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const start = (page - 1) * pageSize;
    const paginated = formatted.slice(start, start + parseInt(pageSize));

    // Compute statistics
    const totalBalance = formatted.reduce((sum, u) => sum + u.balance, 0);
    const onlineCount = formatted.filter((u) => u.status === "Online").length;

    res.json({
      treasurySubcoms: paginated,
      totalTreasurySubcoms: totalItems,
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
    const { treasuryId } = req.params;
    const { location_id, upi_id } = req.query; // New query parameters

    const treasury = await Treasury.findOne({ treasury_id: treasuryId }).select("user_id");
    if (!treasury) {
      return res.status(404).json({ error: "Treasury not found" });
    }

    // Base transaction query
    let transactionQuery = {
      $or: [
        { sender_id: treasury.user_id },
        { receiver_id: treasury.user_id },
      ],
      transaction_type: { $in: ["Transfer", "TopUp", "Refund", "Credit"] },
    };

    // If location_id or upi_id is provided, filter by LoginLog time ranges
    if (location_id || upi_id) {
      const loginLogQuery = { user_id: treasury.user_id };
      if (location_id) loginLogQuery.location_id = location_id;
      if (upi_id) loginLogQuery.upi_id = upi_id;

      const loginLogs = await mongoose.model("LoginLog").find(loginLogQuery).select("login_time logout_time");
      
      if (!loginLogs.length) {
        return res.status(200).json({ data: [] }); // No matching login logs
      }

      // Create time range conditions
      const timeConditions = loginLogs.map(log => ({
        created_at: {
          $gte: log.login_time,
          $lte: log.logout_time || new Date(), // Use current time if logout_time is null
        },
      }));

      transactionQuery = {
        ...transactionQuery,
        $or: timeConditions, // Transactions must fall within any login log's time range
      };
    }

    const transactions = await Transaction.find(transactionQuery)
      .populate("sender_id", "name")
      .populate("receiver_id", "name")
      .lean();

    const formattedTransactions = transactions.map((tx) => ({
      id: tx.transaction_id,
      type: tx.transaction_type.toLowerCase(),
      amount: parseFloat(tx.amount),
      date: tx.created_at,
      description:
        tx.transaction_type === "Transfer"
          ? `To ${tx.receiver_id?.name || "Unknown"}`
          : tx.transaction_type === "Refund"
          ? `From ${tx.sender_id?.name || "Unknown"}`
          : tx.remarks || `${tx.transaction_type} transaction`,
    }));

    res.status(200).json({ data: formattedTransactions });
  } catch (error) {
    console.error("Error fetching treasury transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
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