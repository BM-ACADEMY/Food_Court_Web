const mongoose = require("mongoose");
const User = require("../model/userModel");
const Customer = require("../model/customerModel");
const Restaurant = require("../model/restaurantModel");
const Role = require("../model/roleModel");
const UserBalance = require("../model/userBalanceModel");
const Transaction = require("../model/transactionModel");
const { format } = require("date-fns");
const { startOfDay, endOfDay, subDays } = require("date-fns");

// Helper to calculate percentage difference
const calculatePercentageDiff = (today, yesterday) => {
  if (yesterday === 0) return today > 0 ? "+100%" : "0%";
  const diff = ((today - yesterday) / yesterday) * 100;
  const rounded = Number(diff.toFixed(2));
  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
  return `${sign}${Math.abs(rounded)}%`;
};


exports.getDashboardStats = async (req, res) => {
  try {
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);

    // Customer and Restaurant role IDs
    const customerRole = await Role.findOne({ name: "Customer" });
    const restaurantRole = await Role.findOne({ name: "Restaurant" });

    if (!customerRole || !restaurantRole) {
      return res.status(404).json({ error: "Role not found" });
    }

    // Logins today (based on User.updatedAt)
    const loginsToday = await User.countDocuments({
      role_id: customerRole._id,
      updatedAt: { $gte: today, $lte: endOfDay(today) },
    });
    const loginsYesterday = await User.countDocuments({
      role_id: customerRole._id,
      updatedAt: { $gte: startOfDay(yesterday), $lte: endOfDay(yesterday) },
    });

    // Registrations today (based on Customer.created_at)
    const registrationsToday = await User.countDocuments({
      createdAt: { $gte: today, $lte: endOfDay(today) },
    });

    const registrationsYesterday = await User.countDocuments({
      createdAt: { $gte: startOfDay(yesterday), $lte: endOfDay(yesterday) },
    });

    // Transactions today
    const transactionsToday = await Transaction.countDocuments({
      created_at: { $gte: today, $lte: endOfDay(today) },
    });
    const transactionsYesterday = await Transaction.countDocuments({
      created_at: { $gte: startOfDay(yesterday), $lte: endOfDay(yesterday) },
    });

    // Active restaurants
    const activeRestaurants = await Restaurant.countDocuments({
      status: "Active",
    });
    const activeRestaurantsYesterday = await Restaurant.countDocuments({
      status: "Active",
      created_at: { $lte: endOfDay(yesterday) },
    });

    res.status(200).json({
      loginsToday,
      loginDiff: calculatePercentageDiff(loginsToday, loginsYesterday),
      registrationsToday,
      registrationDiff: calculatePercentageDiff(
        registrationsToday,
        registrationsYesterday
      ),
      transactionsToday,
      transactionDiff: calculatePercentageDiff(
        transactionsToday,
        transactionsYesterday
      ),
      activeRestaurants,
      activeRestaurantsDiff: calculatePercentageDiff(
        activeRestaurants,
        activeRestaurantsYesterday
      ),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch dashboard stats",
      details: error.message,
    });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const {
      transactionType,
      userType,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    if (transactionType && transactionType !== "all") {
      // Map frontend transaction types to backend enum
      const typeMap = {
        Topup: "TopUp",
        Withdraw: "Transfer", // Assuming Withdraw maps to Transfer
        Refund: "Refund",
        Credit: "Credit",
      };
      query.transaction_type = typeMap[transactionType] || transactionType;
    }
    if (userType && userType !== "all") {
      query.$or = [
        {
          sender_id: {
            $in: await User.find({ role_id: userType }).distinct("_id"),
          },
        },
        {
          receiver_id: {
            $in: await User.find({ role_id: userType }).distinct("_id"),
          },
        },
      ];
    }
    if (fromDate && toDate) {
      query.created_at = {
        $gte: new Date(fromDate),
        $lte: endOfDay(new Date(toDate)),
      };
    }

    const transactions = await Transaction.find(query)
      .populate("sender_id", "name")
      .populate("receiver_id", "name")
      .sort({ created_at: -1 }) // Latest first
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Transaction.countDocuments(query);

    const formattedTransactions = transactions.map((tx) => ({
      id: tx.transaction_id,
      time: format(new Date(tx.created_at), "dd-MM-yyyy HH:mm"),
      type: tx.transaction_type,
      from: tx.sender_id ? tx.sender_id.name : "Unknown",
      to: tx.receiver_id ? tx.receiver_id.name : "Unknown",
      amount: `₹${tx.amount.toString()}`,
      status: tx.status,
    }));

    res.status(200).json({ transactions: formattedTransactions, total });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch transactions", details: error.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find().select("name _id").lean();
    res.status(200).json({
      roles: roles.map((role) => ({ id: role._id, name: role.name })),
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch roles", details: error.message });
  }
};

exports.getExportData = async (req, res) => {
  try {
    const { userType, startDate, endDate } = req.query;

    const query = {};
    if (userType && userType !== "all") {
      query.$or = [
        {
          sender_id: {
            $in: await User.find({ role_id: userType }).distinct("_id"),
          },
        },
        {
          receiver_id: {
            $in: await User.find({ role_id: userType }).distinct("_id"),
          },
        },
      ];
    }
    if (startDate && endDate) {
      query.created_at = {
        $gte: new Date(startDate),
        $lte: endOfDay(new Date(endDate)),
      };
    }

    const transactions = await Transaction.find(query)
      .populate("sender_id", "name phone_number")
      .populate("receiver_id", "name")
      .sort({ created_at: -1 })
      .lean();

    const exportData = await Promise.all(
      transactions.map(async (tx) => {
        const userId = tx.sender_id._id; // Using sender_id for export
        const userBalance = await UserBalance.findOne({
          user_id: userId,
        }).lean();
        const customer = await Customer.findOne({ user_id: userId }).lean();
        const restaurant = await Restaurant.findOne({ user_id: userId }).lean();

        return {
          id: tx.transaction_id,
          name: tx.sender_id ? tx.sender_id.name : "Unknown",
          phone: tx.sender_id ? tx.sender_id.phone_number : "N/A",
          balance: userBalance ? parseFloat(userBalance.balance) : 0,
          status: customer
            ? customer.status
            : restaurant
            ? restaurant.status
            : "N/A",
          lastActive: format(new Date(tx.created_at), "dd-MM-yyyy HH:mm"),
        };
      })
    );

    res.status(200).json(exportData);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to export data", details: error.message });
  }
};
