const Customer = require("../model/customerModel");
const Role = require("../model/roleModel");
const User = require("../model/userModel");
const Transaction = require("../model/transactionModel");
const UserBalance = require("../model/userBalanceModel");
const LoginLog = require("../model/loginLogModel");
const mongoose = require("mongoose");
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
    res.status(201).json({
      success: true,
      message: "User added Successfully",
      data: customer,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get All Customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().populate(
      "user_id",
      "name email phone_number"
    );
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
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Customer
// exports.updateCustomer = async (req, res) => {
//   try {
//     const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//     });

//     if (!customer)
//       return res.status(404).json({ success: false, message: "Customer not found" });

//     res.status(200).json({ success: true, data: customer });
//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

// Delete Customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    res
      .status(200)
      .json({ success: true, message: "Customer deleted successfully" });
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

    const customerRole = await Role.findOne({ name: "Customer" }).select("_id");
    if (!customerRole) {
      return res.json({
        customers: [],
        totalCustomers: 0,
        totalBalance: 0,
        onlineCount: 0,
        totalPages: 0,
      });
    }

    const customerRoleId = customerRole._id;
    let userQuery = { role_id: customerRoleId };

    // Handle search
    if (search) {
      const customerMatches = await Customer.find({
        $or: [
          { customer_id: { $regex: search, $options: "i" } },
          { phone_number: { $regex: search, $options: "i" } },
        ],
      }).select("user_id");

      const customerUserIds = customerMatches.map((c) => c.user_id);
      if (customerUserIds.length > 0) {
        userQuery.$or = [
          { name: { $regex: search, $options: "i" } },
          { _id: { $in: customerUserIds } },
        ];
      } else {
        userQuery.name = { $regex: search, $options: "i" };
      }
    }

    // Handle registration date
    if (regDate) {
      const startDate = new Date(regDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);
      userQuery.created_at = { $gte: startDate, $lt: endDate };
    }

    // Handle lastActive filter
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
      userQuery._id = recentLogUserIds.length
        ? { $in: recentLogUserIds }
        : { $in: [] };
    }

    // Build pipeline
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
        $lookup: {
          from: "loginlogs",
          localField: "_id",
          foreignField: "user_id",
          as: "loginLogs",
        },
      },
      {
        $project: {
          user_id: "$_id",
          name: 1,
          phone_number: 1, // ✅ from User model
          is_flagged: 1,
          customer_id: "$customer.customer_id",
          balance: { $ifNull: ["$balance.balance", 0] },
          created_at: 1,
          loginLogs: 1,
          isOnline: {
            $cond: [
              { $eq: [{ $max: "$loginLogs.status" }, true] },
              true,
              false,
            ],
          },
          lastLogin: { $max: "$loginLogs.login_time" },
        },
      },
    ];

    // Sort
    const sortOption = {
      asc: { name: 1 },
      desc: { name: -1 },
      recent: { created_at: -1 },
      "high-balance": { balance: -1 },
      "low-balance": { balance: 1 },
    }[sortBy] || { name: 1 };

    pipeline.push({ $sort: sortOption });

    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 10;
    pipeline.push(
      { $skip: (pageNum - 1) * pageSizeNum },
      { $limit: pageSizeNum }
    );

    const customers = await User.aggregate(pipeline);

    const formattedCustomers = customers.map((customer) => {
      let lastActive = "Unknown";
      if (customer.lastLogin) {
        const now = new Date();
        const lastLogin = new Date(customer.lastLogin);
        const diffMinutes = (now - lastLogin) / 60000;

        if (diffMinutes < 5) lastActive = "Just now";
        else if (diffMinutes < 60)
          lastActive = `${Math.floor(diffMinutes)} mins ago`;
        else if (diffMinutes < 1440)
          lastActive = `${Math.floor(diffMinutes / 60)} hours ago`;
        else lastActive = lastLogin.toISOString().split("T")[0];
      }

      return {
        user_id: customer.user_id?.toString(), // from _id
        id: customer.customer_id,
        name: customer.name,
        phone: customer.phone_number,
        balance: parseFloat(customer.balance.toString()),
        status: customer.isOnline ? "Online" : "Offline",
        lastActive,
        is_flagged: customer.is_flagged || false,
      };
    });

    let finalCustomers = formattedCustomers;
    if (status !== "all") {
      finalCustomers = formattedCustomers.filter(
        (c) => c.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Stats pipeline
    const recentLoginThreshold = new Date(Date.now() - 5 * 60 * 1000);
    const statsPipeline = [
      { $match: userQuery },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "user_id",
          as: "customer",
        },
      },
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
        $lookup: {
          from: "loginlogs",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$user_id", "$$userId"] },
                login_time: { $gte: recentLoginThreshold },
                status: true,
                logout_time: { $exists: false },
              },
            },
            { $limit: 1 },
          ],
          as: "loginLogs",
        },
      },
      {
        $project: {
          balance: { $ifNull: ["$balance.balance", 0] },
          isOnline: { $gt: [{ $size: "$loginLogs" }, 0] },
        },
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalBalance: { $sum: "$balance" },
          onlineCount: { $sum: { $cond: ["$isOnline", 1, 0] } },
        },
      },
    ];

    const stats = await User.aggregate(statsPipeline);
    const {
      totalCustomers = 0,
      totalBalance = 0,
      onlineCount = 0,
    } = stats[0] || {};

    res.json({
      customers: finalCustomers,
      totalCustomers,
      totalBalance: parseFloat(totalBalance.toString()),
      onlineCount,
      totalPages: Math.ceil(totalCustomers / pageSizeNum),
    });
  } catch (error) {
    console.error("Error in getAllCustomerDetails:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.getCustomerByQrCode = async (req, res) => {
  try {
    const { qr_code } = req.query;
    if (!qr_code) {
      return res
        .status(400)
        .json({ success: false, message: "QR code is required" });
    }

    const customer = await Customer.findOne({ qr_code }).populate(
      "user_id",
      "name email phone_number"
    );
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "No customer found for this QR code",
      });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Get single customer details
// exports.getCustomerDetails = async (req, res) => {
//   try {
//     const { customerId } = req.params;

//     const customer = await Customer.aggregate([
//       { $match: { customer_id: customerId } },
//       {
//         $lookup: {
//           from: "users",
//           localField: "user_id",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       { $unwind: "$user" },
//       {
//         $lookup: {
//           from: "userbalances",
//           localField: "user_id",
//           foreignField: "user_id",
//           as: "balance",
//         },
//       },
//       { $unwind: { path: "$balance", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "loginlogs",
//           localField: "user_id",
//           foreignField: "user_id",
//           as: "loginLogs",
//         },
//       },
//       {
//         $lookup: {
//           from: "roles",
//           localField: "user.role_id",
//           foreignField: "_id",
//           as: "role",
//         },
//       },
//       { $unwind: "$role" },
//       {
//         $project: {
//           id: "$customer_id",
//           name: "$user.name",
//           phone: "$user.phone_number",
//           email: "$user.email",
//           balance: { $ifNull: ["$balance.balance", "0.00"] },
//           status: { $cond: [{ $eq: ["$loginLogs.status", true] }, "Online", "Offline"] },
//           lastActive: { $max: "$loginLogs.login_time" },
//           registration_type: 1,
//           registration_fee_paid: 1,
//           qr_code: 1,
//           createdAt: 1,
//         },
//       },
//     ]);

//     if (!customer.length) {
//       return res.status(404).json({ error: "Customer not found" });
//     }

//     res.status(200).json(customer[0]);
//   } catch (error) {
//     console.error("Error fetching customer details:", error);
//     res.status(500).json({ error: "Failed to fetch customer details" });
//   }
// };

exports.getCustomerDetails = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.aggregate([
      { $match: { customer_id: customerId } },
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
          from: "roles",
          localField: "user.role_id",
          foreignField: "_id",
          as: "role",
        },
      },
      { $unwind: "$role" },
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
      {
        $unwind: {
          path: "$transactionCount",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          id: "$customer_id",
          user_id: "$user_id", // Added to support update API
          name: "$user.name",
          phone: "$user.phone_number",
          email: "$user.email",
          balance: { $ifNull: [{ $toDouble: "$balance.balance" }, 0.0] },
          status: {
            $cond: [
              { $eq: [{ $max: "$loginLogs.status" }, true] },
              "Online",
              "Offline",
            ],
          },
          lastActive: { $max: "$loginLogs.login_time" },
          registrationDate: "$user.createdAt",
          totalTransactions: {
            $ifNull: ["$transactionCount.totalTransactions", 0],
          },
        },
      },
    ]);

    if (!customer.length) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.status(200).json(customer[0]);
  } catch (error) {
    console.error("Error fetching customer details:", error);
    res.status(500).json({ error: "Failed to fetch customer details" });
  }
};

// Get customer transaction history
// exports.getCustomerTransactions = async (req, res) => {
//   try {
//     const { customerId } = req.params;

//     const customer = await Customer.findOne({ customer_id: customerId });
//     if (!customer) {
//       return res.status(404).json({ error: "Customer not found" });
//     }

//     const transactions = await Transaction.find({
//       $or: [
//         { sender_id: customer.user_id },
//         { receiver_id: customer.user_id },
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
//           ? `To ${tx.receiver_id.name}`
//           : tx.transaction_type === "Refund"
//           ? `From ${tx.sender_id.name}`
//           : tx.remarks || `${tx.transaction_type} transaction`,
//     }));

//     res.status(200).json(formattedTransactions);
//   } catch (error) {
//     console.error("Error fetching transactions:", error);
//     res.status(500).json({ error: "Failed to fetch transactions" });
//   }
// };

exports.getCustomerTransactions = async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await Customer.findOne({ customer_id: customerId });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    const transactions = await Transaction.find({
      $or: [{ sender_id: customer.user_id }, { receiver_id: customer.user_id }],
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
          ? `To ${tx.receiver_id.name}`
          : tx.transaction_type === "Refund"
          ? `From ${tx.sender_id.name}`
          : tx.remarks || `${tx.transaction_type} transaction`,
    }));
    res.status(200).json({ data: formattedTransactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { name, phone, balance } = req.body;

    const customer = await Customer.findOneAndUpdate(
      { customer_id: customerId },
      { name, phone, balance: parseFloat(balance) },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.status(200).json({
      customer_id: customer.customer_id,
      name: customer.name,
      phone: customer.phone,
      balance: customer.balance,
      status: customer.status,
      lastActive: customer.lastActive,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
};

// Update customer information
exports.updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { name, phone, balance } = req.body;

    const customer = await Customer.findOne({ customer_id: customerId });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const user = await User.findById(customer.user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update User
    if (name) user.name = name;
    if (phone) user.phone_number = phone;
    await user.save();

    // Update UserBalance
    if (balance) {
      await UserBalance.findOneAndUpdate(
        { user_id: customer.user_id },
        { balance },
        { upsert: true }
      );
    }

    // Fetch updated customer data
    const updatedCustomer = await Customer.aggregate([
      { $match: { customer_id: customerId } },
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
        $project: {
          id: "$customer_id",
          name: "$user.name",
          phone: "$user.phone_number",
          email: "$user.email",
          balance: { $ifNull: ["$balance.balance", "0.00"] },
          status: {
            $cond: [{ $eq: ["$loginLogs.status", true] }, "Online", "Offline"],
          },
          lastActive: { $max: "$loginLogs.login_time" },
          registration_type: 1,
          registration_fee_paid: 1,
          qr_code: 1,
          createdAt: 1,
        },
      },
    ]);

    res.status(200).json(updatedCustomer[0]);
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
};

// Get Customer Details and Balance by QR Code
exports.getCustomerDetailsByQrCode = async (req, res) => {
  try {
    const { qr_code } = req.query;

    // Validate QR code input
    if (!qr_code) {
      return res.status(400).json({ success: false, message: "QR code is required" });
    }

    // Find customer by QR code and populate user_id
    const customer = await Customer.findOne({ qr_code }).populate("user_id", "name email phone_number");
    if (!customer) {
      return res.status(404).json({ success: false, message: "No customer found for this QR code" });
    }

    // Get user_id from customer
    const userId = customer.user_id._id;

    // Fetch user details
    const user = await User.findById(userId).select("name email phone_number");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Fetch balance from UserBalance model
    const userBalance = await UserBalance.findOne({ user_id: userId });
    const balance = userBalance ? parseFloat(userBalance.balance.toString()) : null;

    // Prepare response
    const response = {
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      balance: balance !== null ? balance : "Payment not done yet",
    };

    res.status(200).json({ success: true, data: response });
  } catch (err) {
    console.error("Error in getCustomerDetailsByQrCode:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

