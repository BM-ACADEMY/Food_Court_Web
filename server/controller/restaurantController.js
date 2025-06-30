
const Role = require("../model/roleModel");
const User = require("../model/userModel");
const Restaurant = require("../model/restaurantModel");
const UserBalance = require("../model/userBalanceModel");
const LoginLog = require("../model/loginLogModel");
const Transaction = require("../model/transactionModel");
const mongoose = require("mongoose");
const { startOfDay, subDays, subMonths, format } = require("date-fns");

// Create Restaurant
exports.createRestaurant = async (req, res) => {
  try {
    const {
      user_id,
      restaurant_name,
      location,
      qr_code,
    } = req.body;

    const restaurant = new Restaurant({
      user_id,
      restaurant_name,
      location,
      qr_code,
    });

    await restaurant.save();
    res.status(201).json({ success: true, data: restaurant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};




exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate("user_id", "name email role_id")
      .select("name restaurant_name restaurant_id qr_code user_id status");
    res.status(200).json({ success: true, data: restaurants });
  } catch (err) {
    console.error("Fetch all restaurants error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid restaurant ID format" });
    }
    const restaurant = await Restaurant.findById(id)
      .populate("user_id", "name email role_id")
      .select("name restaurant_name restaurant_id qr_code user_id status");
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    res.status(200).json({ success: true, data: restaurant });
  } catch (err) {
    console.error("Fetch restaurant by ID error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRestaurantByQrCode = async (req, res) => {
  try {
    const { qr_code } = req.query;
    if (!qr_code) {
      return res.status(400).json({ success: false, message: "QR code is required" });
    }
    const restaurant = await Restaurant.findOne({ qr_code })
      .populate("user_id", "name email role_id")
      .select("name restaurant_name restaurant_id qr_code user_id status");
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "No restaurant found for this QR code" });
    }
    res.status(200).json({ success: true, data: restaurant });
  } catch (err) {
    console.error("Fetch restaurant by QR code error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid restaurant ID format" });
    }
    const updated = await Restaurant.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("Update restaurant error:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid restaurant ID format" });
    }
    const deleted = await Restaurant.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    res.status(200).json({ success: true, message: "Restaurant deleted successfully" });
  } catch (err) {
    console.error("Delete restaurant error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getAllRestaurantDetails = async (req, res) => {
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

    const debug =
      process.env.NODE_ENV !== "production" ? console.log : () => {};
    debug("Query Parameters:", {
      search,
      status,
      lastActive,
      regDate,
      sortBy,
      page,
      pageSize,
    });

    // Find the Restaurant role
    const restaurantRole = await Role.findOne({ name: "Restaurant" }).select("_id");
    if (!restaurantRole) {
      debug("Restaurant role not found");
      return res.json({
        restaurants: [],
        totalRestaurants: 0,
        totalSales: 0,
        onlineCount: 0,
        totalPages: 0,
      });
    }

    const restaurantRoleId = restaurantRole._id;
    let userQuery = { role_id: restaurantRoleId };

    // Search filter
    if (search) {
      const restaurantIds = await Restaurant.find({
        $or: [
          { restaurant_id: { $regex: search, $options: "i" } },
          { restaurant_name: { $regex: search, $options: "i" } },
        ],
      }).select("user_id");
      const restaurantUserIds = restaurantIds.map((r) => r.user_id);
      debug("Search restaurantUserIds:", restaurantUserIds);
      if (restaurantUserIds.length > 0) {
        userQuery.$or = [
          { name: { $regex: search, $options: "i" } },
          { _id: { $in: restaurantUserIds } },
        ];
      } else {
        userQuery.name = { $regex: search, $options: "i" };
      }
    }

    // Registration date filter
    if (regDate) {
      const startDate = new Date(regDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);
      userQuery.created_at = { $gte: startDate, $lt: endDate };
      debug("Registration date filter:", { startDate, endDate });
    }

    // Last active filter
    if (["today", "week", "month"].includes(lastActive)) {
      const now = new Date();
      let dateFilter;
      if (lastActive === "today") {
        dateFilter = startOfDay(now);
      } else if (lastActive === "week") {
        dateFilter = subDays(now, 7);
      } else if (lastActive === "month") {
        dateFilter = subMonths(now, 1);
      }
      const recentLogUserIds = await LoginLog.find({
        login_time: { $gte: dateFilter },
      }).distinct("user_id");
      userQuery._id =
        recentLogUserIds.length > 0 ? { $in: recentLogUserIds } : { $in: [] };
      debug("Last active user IDs:", recentLogUserIds);
    }

    // Main aggregation pipeline for restaurant details
    const pipeline = [
      { $match: userQuery },
      {
        $lookup: {
          from: "restaurants",
          localField: "_id",
          foreignField: "user_id",
          as: "restaurant",
        },
      },
      { $unwind: { path: "$restaurant", preserveNullAndEmptyArrays: false } },
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
          from: "locations",
          localField: "restaurant.location",
          foreignField: "_id",
          as: "location",
        },
      },
      { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "loginlogs",
          localField: "_id",
          foreignField: "user_id",
          as: "loginLogs",
        },
      },
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
          user_id: "$_id",
          name: 1,
          is_flagged: 1,
          restaurant_id: "$restaurant.restaurant_id",
          restaurant_name: "$restaurant.restaurant_name",
          category: "$location.city",
          sales: { $toDouble: { $ifNull: ["$balance.balance", 0] } }, // Use balance.balance from userbalances
          created_at: 1,
          status: {
            $cond: [
              { $eq: [{ $max: "$loginLogs.status" }, true] },
              "Online",
              "Offline",
            ],
          },
          lastActive: { $max: "$loginLogs.login_time" },
          sender_id: "$transaction.sender_id",
          sender_name: "$transaction.sender_name",
          sender_role_name: "$transaction.sender_role_name",
          receiver_id: "$transaction.receiver_id",
          receiver_name: "$transaction.receiver_name",
          receiver_role_name: "$transaction.receiver_role_name",
        },
      },
    ];

    // Sorting
    const sortOption = {
      asc: { name: 1 },
      desc: { name: -1 },
      recent: { created_at: -1 },
      "high-balance": { sales: -1 },
      "low-balance": { sales: 1 },
    }[sortBy] || { name: 1 };
    pipeline.push({ $sort: sortOption });

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 10;
    pipeline.push(
      { $skip: (pageNum - 1) * pageSizeNum },
      { $limit: pageSizeNum }
    );

    const restaurants = await User.aggregate(pipeline);
    debug("Aggregated restaurants:", restaurants.length);
    debug("Sample restaurant data:", restaurants[0]); // Log first result for debugging

    // Format data
    let formattedRestaurants = restaurants.map((r) => {
      let lastActive = "Unknown";
      if (r.lastActive) {
        const lastTime = new Date(r.lastActive);
        const now = new Date();
        const diff = (now - lastTime) / 60000;

        if (diff < 5) lastActive = "Just now";
        else if (diff < 60) lastActive = `${Math.floor(diff)} mins ago`;
        else if (diff < 1440) lastActive = `${Math.floor(diff / 60)} hours ago`;
        else lastActive = format(lastTime, "yyyy-MM-dd");
      }

      return {
        user_id: r.user_id?.toString(),
        id: r.restaurant_id,
        name: r.restaurant_name,
        category: r.category || "Unknown",
        sales: parseFloat(r.sales.toString()),
        status: r.status,
        lastActive,
        is_flagged: r.is_flagged || false,
        sender_id: r.sender_id?.toString() || "Unknown",
        sender_name: r.sender_name || "Unknown",
        sender_role_name: r.sender_role_name || "Unknown",
        receiver_id: r.receiver_id?.toString() || "Unknown",
        receiver_name: r.receiver_name || "Unknown",
        receiver_role_name: r.receiver_role_name || "Unknown",
      };
    });

    // Apply status filter after formatting
    if (status !== "all") {
      formattedRestaurants = formattedRestaurants.filter(
        (r) => r.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Statistics pipeline
    const statsPipeline = [
      { $match: userQuery },
      {
        $lookup: {
          from: "restaurants",
          localField: "_id",
          foreignField: "user_id",
          as: "restaurant",
        },
      },
      { $unwind: { path: "$restaurant", preserveNullAndEmptyArrays: false } },
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
          totalRestaurants: { $sum: 1 },
          totalSales: {
            $sum: { $toDouble: { $ifNull: ["$balance.balance", 0] } },
          },
        },
      },
    ];
    const statsResult = await User.aggregate(statsPipeline);
    const { totalRestaurants = 0, totalSales = 0 } = statsResult[0] || {};
    debug("Stats result:", { totalRestaurants, totalSales });

    // Online count
    const onlineCount = formattedRestaurants.filter(
      (r) => r.status === "Online"
    ).length;

    // Data integrity check for user_id mismatches
    const mismatchedUserBalances = await UserBalance.find({
      user_id: { $nin: await User.distinct("_id") },
    }).select("user_id");
    if (mismatchedUserBalances.length > 0) {
      debug("Mismatched user_ids in UserBalance:", mismatchedUserBalances);
    }

    res.json({
      restaurants: formattedRestaurants,
      totalRestaurants,
      totalSales: parseFloat(totalSales.toString()),
      onlineCount,
      totalPages: Math.ceil(totalRestaurants / pageSizeNum),
    });
  } catch (error) {
    console.error("Error in getAllRestaurantDetails:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.getRestaurantDetails = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant.aggregate([
      { $match: { restaurant_id: restaurantId } },
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
      {
        $unwind: {
          path: "$transactionCount",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          id: "$restaurant_id",
          user_id: "$user_id",
          name: "$user.name",
          phone: "$user.phone_number",
          email: "$user.email",
          sales: { $ifNull: [{ $toDouble: "$balance.balance" }, 0.0] },
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

    if (!restaurant.length) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    res.status(200).json(restaurant[0]);
  } catch (error) {
    console.error("Error fetching restaurant details:", error);
    res.status(500).json({ error: "Failed to fetch restaurant details" });
  }
};
// Fetch transactions for a restaurant
// Fetch transactions for a restaurant with filtering and pagination
exports.getRestaurantTransactions = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { filter = "all", page = 1, pageSize = 5 } = req.query;

    // Validate restaurant
    const restaurant = await Restaurant.findOne({
      restaurant_id: restaurantId,
    }).select("user_id");
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Build query
    const query = {
      $or: [
        { sender_id: restaurant.user_id },
        { receiver_id: restaurant.user_id },
      ],
    };

    // Apply transaction type filter
    if (filter !== "all") {
      query.transaction_type = filter.charAt(0).toUpperCase() + filter.slice(1); // Capitalize (e.g., "transfer" → "Transfer")
    } else {
      query.transaction_type = {
        $in: ["Transfer", "TopUp", "Refund", "Credit"],
      };
    }

    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    if (pageNum < 1 || pageSizeNum < 1) {
      return res.status(400).json({ error: "Invalid page or pageSize" });
    }

    // Fetch total count for pagination
    const totalCount = await Transaction.countDocuments(query);

    // Fetch transactions with pagination
    const transactions = await Transaction.find(query)
      .populate("sender_id", "name")
      .populate("receiver_id", "name")
      .skip((pageNum - 1) * pageSizeNum)
      .limit(pageSizeNum)
      .lean();

    // Format transactions
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

    // Response
    res.status(200).json({
      data: formattedTransactions,
      total: totalCount,
      totalPages: Math.ceil(totalCount / pageSizeNum),
      currentPage: pageNum,
    });
  } catch (error) {
    console.error("Error fetching restaurant transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
