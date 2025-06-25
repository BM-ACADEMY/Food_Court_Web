const TreasurySubcom = require("../model/treasurySubcomModel");
const Role=require('../model/roleModel');
const User =require('../model/userModel');
const LoginLog=require('../model/loginLogModel');
// const UserBalance = mongoose.model("UserBalance");
const mongoose=require('mongoose');

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

    // Log query parameters for debugging
    console.log('Query Parameters:', { search, status, lastActive, regDate, sortBy, page, pageSize });

    // Find Treasury-Subcom role ID
    const treasurySubcomRole = await Role.findOne({ name: 'Treasury-Subcom' }).select('_id');
    if (!treasurySubcomRole) {
      console.log('No Treasury-Subcom role found');
      return res.json({
        treasurySubcoms: [],
        totalTreasurySubcoms: 0,
        totalBalance: 0,
        onlineCount: 0,
        totalPages: 0,
      });
    }
    const treasurySubcomRoleId = treasurySubcomRole._id;
    console.log('Treasury-Subcom Role ID:', treasurySubcomRoleId);

    // Build user query
    let userQuery = {
      role_id: treasurySubcomRoleId,
    };

    if (search) {
      const treasurySubcomIds = await TreasurySubcom.find({
        treasury_subcom_id: { $regex: search, $options: 'i' },
      }).select('user_id');
      const treasurySubcomUserIds = treasurySubcomIds.map((subcom) => subcom.user_id);
      console.log('Treasury-Subcom User IDs from search:', treasurySubcomUserIds);
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
      console.log('Registration Date Filter:', { startDate, endDate });
    }

    // Handle last active filter
    let userIds = [];
    const validLastActiveValues = ['all', 'today', 'week', 'month'];
    if (validLastActiveValues.includes(lastActive) && lastActive !== 'all') {
      const now = new Date();
      let dateFilter;
      if (lastActive === 'today') {
        dateFilter = new Date(now.setHours(0, 0, 0, 0));
      } else if (lastActive === 'week') {
        dateFilter = new Date(now.setDate(now.getDate() - 7));
      } else if (lastActive === 'month') {
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
      }
      const recentLogs = await LoginLog.find({
        login_time: { $gte: dateFilter },
      }).distinct('user_id');
      userIds = recentLogs;
      console.log('Last Active User IDs:', userIds);
      if (userIds.length > 0) {
        userQuery._id = { $in: userIds };
      }
    } else {
      console.log('Skipping lastActive filter due to invalid or "all" value:', lastActive);
    }

    // Status filter
    if (status !== 'all') {
      const recentLoginThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const activeUsers = await LoginLog.find({
        login_time: { $gte: recentLoginThreshold },
        logout_time: { $exists: false },
      }).distinct('user_id');
      userQuery._id = status === 'Online' ? { $in: activeUsers } : { $nin: activeUsers };
      console.log('Active Users for Status Filter:', activeUsers);
    }

    // Log the final user query
    console.log('User Query:', JSON.stringify(userQuery, null, 2));

    // Check if users exist in Users collection
    const usersWithTreasurySubcomRole = await User.find({ role_id: treasurySubcomRoleId }).select('_id name phone_number');
    console.log('Users with Treasury-Subcom Role:', usersWithTreasurySubcomRole.map(u => ({ _id: u._id.toString(), name: u.name, phone_number: u.phone_number })));

    // Aggregate to join User, TreasurySubcom, UserBalance
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
      { $unwind: { path: '$treasurySubcom', preserveNullAndEmptyArrays: false } }, // Strict match
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

    // Apply sorting for balance
    let sortOption = {};
    if (sortBy === 'asc') {
      sortOption['name'] = 1;
    } else if (sortBy === 'desc') {
      sortOption['name'] = -1;
    } else if (sortBy === 'recent') {
      sortOption['created_at'] = -1;
    }

    if (sortBy === 'high-balance') {
      pipeline.push({ $sort: { balance: -1 } });
    } else if (sortBy === 'low-balance') {
      pipeline.push({ $sort: { balance: 1 } });
    } else {
      pipeline.push({ $sort: sortOption });
    }

    // Apply pagination
    const skip = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    pipeline.push({ $skip: skip }, { $limit: limit });

    const treasurySubcoms = await User.aggregate(pipeline);
    console.log('Aggregated Treasury-Subcoms:', JSON.stringify(treasurySubcoms, null, 2));

    // Fetch last active times
    const treasurySubcomIds = treasurySubcoms.map((subcom) => subcom._id);
    const loginLogs = await LoginLog.find({ user_id: { $in: treasurySubcomIds } })
      .sort({ login_time: -1 })
      .lean();
    console.log('Login Logs:', loginLogs);

    const lastActiveMap = {};
    loginLogs.forEach((log) => {
      if (!lastActiveMap[log.user_id]) {
        const loginTime = new Date(log.login_time);
        const now = new Date();
        const diff = (now - loginTime) / 1000 / 60;
        if (diff < 5) {
          lastActiveMap[log.user_id] = 'Just now';
        } else if (diff < 60) {
          lastActiveMap[log.user_id] = `${Math.floor(diff)} mins ago`;
        } else if (diff < 1440) {
          lastActiveMap[log.user_id] = `${Math.floor(diff / 60)} hours ago`;
        } else {
          lastActiveMap[log.user_id] = loginTime.toISOString().split('T')[0];
        }
      }
    });

    // Determine status
    const recentLoginThreshold = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsers = await LoginLog.find({
      login_time: { $gte: recentLoginThreshold },
      logout_time: { $exists: false },
    }).distinct('user_id');
    console.log('Active Users:', activeUsers);

    const formattedTreasurySubcoms = treasurySubcoms.map((subcom) => ({
      id: subcom.treasury_subcom_id,
      name: subcom.name,
      phone: subcom.phone_number,
      balance: parseFloat(subcom.balance.toString()),
      status: activeUsers.includes(subcom._id.toString()) ? 'Online' : 'Offline',
      lastActive: lastActiveMap[subcom._id.toString()] || 'Unknown',
    }));
    console.log('Formatted Treasury-Subcoms:', JSON.stringify(formattedTreasurySubcoms, null, 2));

    // Compute statistics
    const totalTreasurySubcomsPipeline = [
      { $match: userQuery },
      { $lookup: { from: 'treasurysubcoms', localField: '_id', foreignField: 'user_id', as: 'treasurySubcom' } },
      { $unwind: '$treasurySubcom' },
      { $count: 'total' },
    ];
    const totalTreasurySubcomsResult = await User.aggregate(totalTreasurySubcomsPipeline);
    const totalTreasurySubcoms = totalTreasurySubcomsResult[0]?.total || 0;
    console.log('Total Treasury-Subcoms:', totalTreasurySubcoms);

    const onlineCountPipeline = [
      { $match: { ...userQuery, _id: { $in: activeUsers } } },
      { $lookup: { from: 'treasurysubcoms', localField: '_id', foreignField: 'user_id', as: 'treasurySubcom' } },
      { $unwind: '$treasurySubcom' },
      { $count: 'total' },
    ];
    const onlineCountResult = await User.aggregate(onlineCountPipeline);
    const onlineCount = onlineCountResult[0]?.total || 0;
    console.log('Online Count:', onlineCount);

    const totalBalancePipeline = [
      { $match: userQuery },
      { $lookup: { from: 'treasurysubcoms', localField: '_id', foreignField: 'user_id', as: 'treasurySubcom' } },
      { $unwind: '$treasurySubcom' },
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
        $group: {
          _id: null,
          total: { $sum: '$balance.balance' },
        },
      },
    ];
    const totalBalanceResult = await User.aggregate(totalBalancePipeline);
    const totalBalance = parseFloat((totalBalanceResult[0]?.total || 0).toString());
    console.log('Total Balance:', totalBalance);

    res.json({
      treasurySubcoms: formattedTreasurySubcoms,
      totalTreasurySubcoms,
      totalBalance,
      onlineCount,
      totalPages: Math.ceil(totalTreasurySubcoms / pageSize),
    });
  } catch (error) {
    console.error('Error in /api/treasury-subcoms:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};