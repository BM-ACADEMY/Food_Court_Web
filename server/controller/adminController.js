const Admin = require("../model/adminModel");
const Transaction = require("../model/transactionModel");
const UserBalance=require('../model/userBalanceModel')
const MasterAdmin=require('../model/masterAdminModel');
const User=require('../model/userModel')
const moment=require('moment');
const Role =require('../model/roleModel');
const mongoose=require('mongoose');
const LoginLog=require('../model/loginLogModel')


// Create Admin
exports.createAdmin = async (req, res) => {
  try {
    const {
      user_id,
      admin_to_admin_transfer_limit ,
      admin_to_subcom_transfer_limit ,
    } = req.body;

    const admin = new Admin({
      user_id,
      admin_to_admin_transfer_limit,
      admin_to_subcom_transfer_limit,
    });

    await admin.save();
    res.status(201).json({ success: true, data: admin });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get All Admins
exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().populate("user_id", "name email phone_number");
    res.status(200).json({ success: true, data: admins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Admin by ID
exports.getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).populate("user_id");
    if (!admin)
      return res.status(404).json({ success: false, message: "Admin not found" });

    res.status(200).json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Admin
exports.updateAdmin = async (req, res) => {
  try {
    const updated = await Admin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({ success: false, message: "Admin not found" });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Admin
exports.deleteAdmin = async (req, res) => {
  try {
    const deleted = await Admin.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ success: false, message: "Admin not found" });

    res.status(200).json({ success: true, message: "Admin deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getAllAdminDetails = async (req, res) => {
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

    // Find Admin role ID
    const adminRole = await Role.findOne({ name: 'Admin' }).select('_id');
    if (!adminRole) {
      console.log('No Admin role found');
      return res.json({
        admins: [],
        totalAdmins: 0,
        totalBalance: 0,
        onlineCount: 0,
        totalPages: 0,
      });
    }
    const adminRoleId = adminRole._id;
    console.log('Admin Role ID:', adminRoleId);

    // Build user query
    let userQuery = {
      role_id: adminRoleId,
    };

    if (search) {
      const adminIds = await Admin.find({
        admin_id: { $regex: search, $options: 'i' },
      }).select('user_id');
      const adminUserIds = adminIds.map((admin) => admin.user_id);
      console.log('Admin User IDs from search:', adminUserIds);
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone_number: { $regex: search, $options: 'i' } },
        { _id: { $in: adminUserIds } },
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
    const usersWithAdminRole = await User.find({ role_id: adminRoleId }).select('_id name phone_number');
    console.log('Users with Admin Role:', usersWithAdminRole.map(u => ({ _id: u._id.toString(), name: u.name, phone_number: u.phone_number })));

    // Aggregate to join User, Admin, UserBalance
    let pipeline = [
      { $match: userQuery },
      {
        $lookup: {
          from: 'admins',
          localField: '_id',
          foreignField: 'user_id',
          as: 'admin',
        },
      },
      { $unwind: { path: '$admin', preserveNullAndEmptyArrays: false } }, // Strict match
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
          admin_id: '$admin.admin_id',
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
      sortOption['name']=2 -1;
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

    const admins = await User.aggregate(pipeline);
    console.log('Aggregated Admins:', JSON.stringify(admins, null, 2));

    // Fetch last active times
    const adminIds = admins.map((admin) => admin._id);
    const loginLogs = await LoginLog.find({ user_id: { $in: adminIds } })
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

    const formattedAdmins = admins.map((admin) => ({
      id: admin.admin_id,
      name: admin.name,
      phone: admin.phone_number,
      balance: parseFloat(admin.balance.toString()),
      status: activeUsers.includes(admin._id.toString()) ? 'Online' : 'Offline',
      lastActive: lastActiveMap[admin._id.toString()] || 'Unknown',
    }));
    console.log('Formatted Admins:', JSON.stringify(formattedAdmins, null, 2));

    // Compute statistics
    const totalAdminsPipeline = [
      { $match: userQuery },
      { $lookup: { from: 'admins', localField: '_id', foreignField: 'user_id', as: 'admin' } },
      { $unwind: '$admin' },
      { $count: 'total' },
    ];
    const totalAdminsResult = await User.aggregate(totalAdminsPipeline);
    const totalAdmins = totalAdminsResult[0]?.total || 0;
    console.log('Total Admins:', totalAdmins);

    const onlineCountPipeline = [
      { $match: { ...userQuery, _id: { $in: activeUsers } } },
      { $lookup: { from: 'admins', localField: '_id', foreignField: 'user_id', as: 'admin' } },
      { $unwind: '$admin' },
      { $count: 'total' },
    ];
    const onlineCountResult = await User.aggregate(onlineCountPipeline);
    const onlineCount = onlineCountResult[0]?.total || 0;
    console.log('Online Count:', onlineCount);

    const totalBalancePipeline = [
      { $match: userQuery },
      { $lookup: { from: 'admins', localField: '_id', foreignField: 'user_id', as: 'admin' } },
      { $unwind: '$admin' },
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
      admins: formattedAdmins,
      totalAdmins,
      totalBalance,
      onlineCount,
      totalPages: Math.ceil(totalAdmins / pageSize),
    });
  } catch (error) {
    console.error('Error in /api/admins:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};