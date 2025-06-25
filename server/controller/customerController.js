const Customer = require("../model/customerModel");
const mongoose = require("mongoose");
const Role = require('../model/roleModel');
const User = require('../model/userModel');

const UserBalance = require('../model/userBalanceModel');
const LoginLog = require('../model/loginLogModel');

// Create Customer
exports.createCustomer = async (req, res) => {
  try {
    const {
      user_id,
      registration_type,
      registration_fee_paid = false,
      qr_code,
    } = req.body;

    const customer = new Customer({
      user_id,
      registration_type,
      registration_fee_paid,
      qr_code,
    });

    await customer.save();
    res.status(201).json({ success: true,message:"User added Successfully", data: customer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get All Customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().populate("user_id", "name email phone_number");
    res.status(200).json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate("user_id");
    if (!customer)
      return res.status(404).json({ success: false, message: "Customer not found" });

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Customer
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!customer)
      return res.status(404).json({ success: false, message: "Customer not found" });

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer)
      return res.status(404).json({ success: false, message: "Customer not found" });

    res.status(200).json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getAllCustomerDetails = async (req, res) => {
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

    // Log query parameters for debugging
    console.log("Query Parameters:", { search, status, lastActive, regDate, sortBy, page, pageSize });

    // Find Customer role ID
    const customerRole = await Role.findOne({ name: "Customer" }).select("_id");
    if (!customerRole) {
      console.log("No Customer role found");
      return res.json({
        customers: [],
        totalCustomers: 0,
        totalBalance: 0,
        onlineCount: 0,
        totalPages: 0,
      });
    }
    const customerRoleId = customerRole._id;
    console.log("Customer Role ID:", customerRoleId);

    // Build user query
    let userQuery = {
      role_id: customerRoleId,
    };

    if (search) {
      const customerIds = await Customer.find({
        $or: [
          { customer_id: { $regex: search, $options: "i" } },
          { phone_number: { $regex: search, $options: "i" } },
        ],
      }).select("user_id");
      const customerUserIds = customerIds.map((customer) => customer.user_id);
      console.log("Customer User IDs from search:", customerUserIds);
      userQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { _id: { $in: customerUserIds } },
      ];
    }

    if (regDate) {
      const startDate = new Date(regDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);
      userQuery.created_at = { $gte: startDate, $lt: endDate };
      console.log("Registration Date Filter:", { startDate, endDate });
    }

    // Handle last active filter
    let userIds = [];
    const validLastActiveValues = ["all", "today", "week", "month"];
    if (validLastActiveValues.includes(lastActive) && lastActive !== "all") {
      const now = new Date();
      let dateFilter;
      if (lastActive === "today") {
        dateFilter = new Date(now.setHours(0, 0, 0, 0));
      } else if (lastActive === "week") {
        dateFilter = new Date(now.setDate(now.getDate() - 7));
      } else if (lastActive === "month") {
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
      }
      const recentLogs = await LoginLog.find({
        login_time: { $gte: dateFilter },
      }).distinct("user_id");
      userIds = recentLogs;
      console.log("Last Active User IDs:", userIds);
      if (userIds.length > 0) {
        userQuery._id = { $in: userIds };
      }
    } else {
      console.log("Skipping lastActive filter due to invalid or 'all' value:", lastActive);
    }

    // Status filter
    if (status !== "all") {
      const recentLoginThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const activeUsers = await LoginLog.find({
        login_time: { $gte: recentLoginThreshold },
        logout_time: { $exists: false },
      }).distinct("user_id");
      userQuery._id = status === "Online" ? { $in: activeUsers } : { $nin: activeUsers };
      console.log("Active Users for Status Filter:", activeUsers);
    }

    // Log the final user query
    console.log("User Query:", JSON.stringify(userQuery, null, 2));

    // Check if users exist in Users collection
    const usersWithCustomerRole = await User.find({ role_id: customerRoleId }).select("_id name");
    console.log(
      "Users with Customer Role:",
      usersWithCustomerRole.map((u) => ({ _id: u._id.toString(), name: u.name }))
    );

    // Aggregate to join User, Customer, UserBalance
    let pipeline = [
      { $match: userQuery },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "user_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: false } },
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
        $project: {
          _id: 1,
          name: 1,
          customer_id: "$customer.customer_id",
          phone_number: "$customer.phone_number",
          balance: { $ifNull: ["$balance.balance", 0] },
          created_at: 1,
        },
      },
    ];

    // Apply sorting
    let sortOption = {};
    if (sortBy === "asc") {
      sortOption["name"] = 1;
    } else if (sortBy === "desc") {
      sortOption["name"] = -1;
    } else if (sortBy === "recent") {
      sortOption["created_at"] = -1;
    }

    if (sortBy === "high-balance") {
      pipeline.push({ $sort: { balance: -1 } });
    } else if (sortBy === "low-balance") {
      pipeline.push({ $sort: { balance: 1 } });
    } else {
      pipeline.push({ $sort: sortOption });
    }

    // Apply pagination
    const skip = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    pipeline.push({ $skip: skip }, { $limit: limit });

    const customers = await User.aggregate(pipeline);
    console.log("Aggregated Customers:", JSON.stringify(customers, null, 2));

    // Fetch last active times
    const customerIds = customers.map((customer) => customer._id);
    const loginLogs = await LoginLog.find({ user_id: { $in: customerIds } })
      .sort({ login_time: -1 })
      .lean();
    console.log("Login Logs:", loginLogs);

    const lastActiveMap = {};
    loginLogs.forEach((log) => {
      if (!lastActiveMap[log.user_id]) {
        const loginTime = new Date(log.login_time);
        const now = new Date();
        const diff = (now - loginTime) / 1000 / 60;
        if (diff < 5) {
          lastActiveMap[log.user_id] = "Just now";
        } else if (diff < 60) {
          lastActiveMap[log.user_id] = `${Math.floor(diff)} mins ago`;
        } else if (diff < 1440) {
          lastActiveMap[log.user_id] = `${Math.floor(diff / 60)} hours ago`;
        } else {
          lastActiveMap[log.user_id] = loginTime.toISOString().split("T")[0];
        }
      }
    });

    // Determine status
    const recentLoginThreshold = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsers = await LoginLog.find({
      login_time: { $gte: recentLoginThreshold },
      logout_time: { $exists: false },
    }).distinct("user_id");
    console.log("Active Users:", activeUsers);

    const formattedCustomers = customers.map((customer) => ({
      id: customer.customer_id,
      name: customer.name,
      phone: customer.phone_number,
      balance: parseFloat(customer.balance.toString()),
      status: activeUsers.includes(customer._id.toString()) ? "Online" : "Offline",
      lastActive: lastActiveMap[customer._id.toString()] || "Unknown",
    }));
    console.log("Formatted Customers:", JSON.stringify(formattedCustomers, null, 2));

    // Compute statistics
    const totalCustomersPipeline = [
      { $match: userQuery },
      { $lookup: { from: "customers", localField: "_id", foreignField: "user_id", as: "customer" } },
      { $unwind: "$customer" },
      { $count: "total" },
    ];
    const totalCustomersResult = await User.aggregate(totalCustomersPipeline);
    const totalCustomers = totalCustomersResult[0]?.total || 0;
    console.log("Total Customers:", totalCustomers);

    const onlineCountPipeline = [
      { $match: { ...userQuery, _id: { $in: activeUsers } } },
      { $lookup: { from: "customers", localField: "_id", foreignField: "user_id", as: "customer" } },
      { $unwind: "$customer" },
      { $count: "total" },
    ];
    const onlineCountResult = await User.aggregate(onlineCountPipeline);
    const onlineCount = onlineCountResult[0]?.total || 0;
    console.log("Online Count:", onlineCount);

    const totalBalancePipeline = [
      { $match: userQuery },
      { $lookup: { from: "customers", localField: "_id", foreignField: "user_id", as: "customer" } },
      { $unwind: "$customer" },
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
        $group: {
          _id: null,
          total: { $sum: "$balance.balance" },
        },
      },
    ];
    const totalBalanceResult = await User.aggregate(totalBalancePipeline);
    const totalBalance = parseFloat((totalBalanceResult[0]?.total || 0).toString());
    console.log("Total Balance:", totalBalance);

    res.json({
      customers: formattedCustomers,
      totalCustomers,
      totalBalance,
      onlineCount,
      totalPages: Math.ceil(totalCustomers / pageSize),
    });
  } catch (error) {
    console.error("Error in /api/customers:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
exports.getCustomerByQrCode = async (req, res) => {
  try {
    const { qr_code } = req.query;
    if (!qr_code) {
      return res.status(400).json({ success: false, message: "QR code is required" });
    }

    const customer = await Customer.findOne({ qr_code }).populate("user_id", "name email phone_number");
    if (!customer) {
      return res.status(404).json({ success: false, message: "No customer found for this QR code" });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};