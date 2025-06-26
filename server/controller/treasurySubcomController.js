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
      search = '',
      status = 'all',
      lastActive = 'all',
      regDate = '',
      sortBy = 'asc',
      page = 1,
      pageSize = 10,
    } = req.query;

    const treasurySubcomRole = await Role.findOne({ name: 'Treasury-Subcom' }).select('_id');
    if (!treasurySubcomRole) {
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
        treasury_subcom_id: { $regex: search, $options: 'i' },
      }).select('user_id');
      const treasurySubcomUserIds = treasurySubcomIds.map((subcom) => subcom.user_id);
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone_number: { $regex: search, $options: 'i' } },
        { _id: { $in: treasurySubcomUserIds } },
      ];
    }

    if (regDate) {
      const startDate = new Date(regDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);
      userQuery.created_at = { $gte: startDate, $lt: endDate };
    }

    if (['today', 'week', 'month'].includes(lastActive)) {
      const now = new Date();
      let dateFilter;
      if (lastActive === 'today') {
        dateFilter = new Date(now.setHours(0, 0, 0, 0));
      } else if (lastActive === 'week') {
        dateFilter = new Date(now.setDate(now.getDate() - 7));
      } else {
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
      }
      const recentLogUserIds = await LoginLog.find({
        login_time: { $gte: dateFilter },
      }).distinct('user_id');
      userQuery._id = { $in: recentLogUserIds };
    }

    let pipeline = [
      { $match: userQuery },
      {
        $lookup: {
          from: 'treasurysubcoms',
          localField: '_id',
          foreignField: 'user_id',
          as: 'treasurySubcom',
        },
      },
      { $unwind: { path: '$treasurySubcom', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'userbalances',
          localField: '_id',
          foreignField: 'user_id',
          as: 'balance',
        },
      },
      { $unwind: { path: '$balance', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          phone_number: 1,
          treasury_subcom_id: '$treasurySubcom.treasury_subcom_id',
          balance: { $ifNull: ['$balance.balance', 0] },
          created_at: 1,
        },
      },
    ];

    const sortOption = {
      asc: { name: 1 },
      desc: { name: -1 },
      recent: { created_at: -1 },
      'high-balance': { balance: -1 },
      'low-balance': { balance: 1 },
    }[sortBy] || { name: 1 };

    pipeline.push({ $sort: sortOption });

    const treasurySubcomsRaw = await User.aggregate(pipeline);

    // Get Login Statuses
    const treasurySubcomIds = treasurySubcomsRaw.map((u) => u._id);
    const loginLogs = await LoginLog.find({ user_id: { $in: treasurySubcomIds } }).sort({ login_time: -1 });

    const lastActiveMap = {};
    const activeUserSet = new Set();

    loginLogs.forEach((log) => {
      const id = log.user_id.toString();
      if (!lastActiveMap[id]) {
        const diff = (new Date() - new Date(log.login_time)) / 60000;
        if (diff < 5) lastActiveMap[id] = 'Just now';
        else if (diff < 60) lastActiveMap[id] = `${Math.floor(diff)} mins ago`;
        else if (diff < 1440) lastActiveMap[id] = `${Math.floor(diff / 60)} hours ago`;
        else lastActiveMap[id] = new Date(log.login_time).toISOString().split('T')[0];
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
        status: activeUserSet.has(idStr) ? 'Online' : 'Offline',
        lastActive: lastActiveMap[idStr] || 'Unknown',
      };
    });

    // ✅ Apply status filter AFTER formatting
    if (status !== 'all') {
      formatted = formatted.filter((u) => u.status.toLowerCase() === status.toLowerCase());
    }

    // 🔁 Pagination after filtering
    const totalItems = formatted.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const start = (page - 1) * pageSize;
    const paginated = formatted.slice(start, start + parseInt(pageSize));

    // Compute statistics
    const totalBalance = formatted.reduce((sum, u) => sum + u.balance, 0);
    const onlineCount = formatted.filter((u) => u.status === 'Online').length;

    res.json({
      treasurySubcoms: paginated,
      totalTreasurySubcoms: totalItems,
      totalBalance: parseFloat(totalBalance.toFixed(2)),
      onlineCount,
      totalPages,
    });
  } catch (error) {
    console.error('Error in /api/treasury-subcoms:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
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
    const treasury = await Treasury.findOne({ treasury_id: treasuryId }).select("user_id");
    if (!treasury) {
      return res.status(404).json({ error: "Treasury not found" });
    }

    const transactions = await Transaction.find({
      $or: [
        { sender_id: treasury.user_id },
        { receiver_id: treasury.user_id },
      ],
      transaction_type: { $in: ["Transfer", "TopUp", "Refund", "Credit"] },
    })
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