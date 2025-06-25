
const mongoose = require("mongoose");
const Role =require('../model/roleModel')
const User = require('../model/userModel');
const Restaurant = require('../model/restaurantModel');
const UserBalance = require('../model/userBalanceModel');
const LoginLog = require('../model/loginLogModel');
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

// Get All Restaurants
exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().populate("user_id", "name email");
    res.status(200).json({ success: true, data: restaurants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Restaurant by ID
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate("user_id");
    if (!restaurant)
      return res.status(404).json({ success: false, message: "Restaurant not found" });

    res.status(200).json({ success: true, data: restaurant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Restaurant
exports.updateRestaurant = async (req, res) => {
  try {
    const updated = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({ success: false, message: "Restaurant not found" });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Restaurant
exports.deleteRestaurant = async (req, res) => {
  try {
    const deleted = await Restaurant.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ success: false, message: "Restaurant not found" });

    res.status(200).json({ success: true, message: "Restaurant deleted successfully" });
  } catch (err) {
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

    // Log query parameters for debugging
    console.log("Query Parameters:", { search, status, lastActive, regDate, sortBy, page, pageSize });

    // Find Restaurant role ID
    const restaurantRole = await Role.findOne({ name: "Restaurant" }).select("_id");
    if (!restaurantRole) {
      console.log("No Restaurant role found");
      return res.json({
        restaurants: [],
        totalRestaurants: 0,
        totalSales: 0,
        onlineCount: 0,
        totalPages: 0,
      });
    }
    const restaurantRoleId = restaurantRole._id;
    console.log("Restaurant Role ID:", restaurantRoleId);

    // Build user query
    let userQuery = {
      role_id: restaurantRoleId,
    };

    if (search) {
      const restaurantIds = await Restaurant.find({
        $or: [
          { restaurant_id: { $regex: search, $options: "i" } },
          { restaurant_name: { $regex: search, $options: "i" } },
        ],
      }).select("user_id");
      const restaurantUserIds = restaurantIds.map((restaurant) => restaurant.user_id);
      console.log("Restaurant User IDs from search:", restaurantUserIds);
      userQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { _id: { $in: restaurantUserIds } },
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
    const usersWithRestaurantRole = await User.find({ role_id: restaurantRoleId }).select("_id name");
    console.log(
      "Users with Restaurant Role:",
      usersWithRestaurantRole.map((u) => ({ _id: u._id.toString(), name: u.name }))
    );

    // Aggregate to join User, Restaurant, UserBalance
    let pipeline = [
      { $match: userQuery },
      {
        $lookup: {
          from: "restaurants",
          localField: "_id",
          foreignField: "user_id",
          as: "restaurant",
        },
      },
      { $unwind: { path: "$restaurant", preserveNullAndEmptyArrays: false } }, // Strict match
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
        $project: {
          _id: 1,
          name: 1,
          restaurant_id: "$restaurant.restaurant_id",
          restaurant_name: "$restaurant.restaurant_name",
          category: "$location.city", // Map location.city to category, adjust as needed
          sales: { $toDouble: "$restaurant.treasury_to_customer_refund" }, // Map to sales
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
      pipeline.push({ $sort: { sales: -1 } });
    } else if (sortBy === "low-balance") {
      pipeline.push({ $sort: { sales: 1 } });
    } else {
      pipeline.push({ $sort: sortOption });
    }

    // Apply pagination
    const skip = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    pipeline.push({ $skip: skip }, { $limit: limit });

    const restaurants = await User.aggregate(pipeline);
    console.log("Aggregated Restaurants:", JSON.stringify(restaurants, null, 2));

    // Fetch last active times
    const restaurantIds = restaurants.map((restaurant) => restaurant._id);
    const loginLogs = await LoginLog.find({ user_id: { $in: restaurantIds } })
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

    const formattedRestaurants = restaurants.map((restaurant) => ({
      id: restaurant.restaurant_id,
      name: restaurant.restaurant_name,
      category: restaurant.category || "Unknown",
      sales: parseFloat(restaurant.sales.toString()),
      status: activeUsers.includes(restaurant._id.toString()) ? "Online" : "Offline",
      lastActive: lastActiveMap[restaurant._id.toString()] || "Unknown",
    }));
    console.log("Formatted Restaurants:", JSON.stringify(formattedRestaurants, null, 2));

    // Compute statistics
    const totalRestaurantsPipeline = [
      { $match: userQuery },
      { $lookup: { from: "restaurants", localField: "_id", foreignField: "user_id", as: "restaurant" } },
      { $unwind: "$restaurant" },
      { $count: "total" },
    ];
    const totalRestaurantsResult = await User.aggregate(totalRestaurantsPipeline);
    const totalRestaurants = totalRestaurantsResult[0]?.total || 0;
    console.log("Total Restaurants:", totalRestaurants);

    const onlineCountPipeline = [
      { $match: { ...userQuery, _id: { $in: activeUsers } } },
      { $lookup: { from: "restaurants", localField: "_id", foreignField: "user_id", as: "restaurant" } },
      { $unwind: "$restaurant" },
      { $count: "total" },
    ];
    const onlineCountResult = await User.aggregate(onlineCountPipeline);
    const onlineCount = onlineCountResult[0]?.total || 0;
    console.log("Online Count:", onlineCount);

    const totalSalesPipeline = [
      { $match: userQuery },
      { $lookup: { from: "restaurants", localField: "_id", foreignField: "user_id", as: "restaurant" } },
      { $unwind: "$restaurant" },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$restaurant.treasury_to_customer_refund" } },
        },
      },
    ];
    const totalSalesResult = await User.aggregate(totalSalesPipeline);
    const totalSales = parseFloat((totalSalesResult[0]?.total || 0).toString());
    console.log("Total Sales:", totalSales);

    res.json({
      restaurants: formattedRestaurants,
      totalRestaurants,
      totalSales,
      onlineCount,
      totalPages: Math.ceil(totalRestaurants / pageSize),
    });
  } catch (error) {
    console.error("Error in /api/restaurants:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};