const UserBalance = require("../model/userBalanceModel");
const Transaction = require("../model/transactionModel");
const User=require('../model/userModel')
const MasterAdmin=require('../model/masterAdminModel')

// Create or Initialize Balance for a User
// exports.createOrUpdateBalance = async (req, res) => {
//   const { user_id, balance } = req.body;

//   // ✅ Validate input
//   if (!user_id || balance === undefined || balance === null) {
//     return res.status(400).json({
//       success: false,
//       message: "user_id and balance are required.",
//     });
//   }

//   try {
//     const updated = await UserBalance.findOneAndUpdate(
//       { user_id },
//       { $set: { balance } },
//       { upsert: true, new: true }
//     );

//     res.status(200).json({ success: true, data: updated });
//   } catch (error) {
//     console.error("Error updating/creating balance:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };


exports.getDashboardSummary = async (req, res) => {
  try {
    const startOfCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const startOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const endOfLastMonth = new Date(startOfCurrentMonth.getTime() - 1);

    const rolesToTrack = ["Master-Admin", "Admin", "Treasury-Subcom"];

    const pipeline = [
      // Join Role
      {
        $lookup: {
          from: "roles",
          localField: "role_id",
          foreignField: "_id",
          as: "role",
        },
      },
      { $unwind: "$role" },

      // Filter by specific roles
      {
        $match: {
          "role.name": { $in: rolesToTrack },
        },
      },

      // Join Balance
      {
        $lookup: {
          from: "userbalances",
          localField: "_id",
          foreignField: "user_id",
          as: "balance",
        },
      },
      {
        $unwind: {
          path: "$balance",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Group by Role Name
      {
        $group: {
          _id: "$role.name",
          totalBalance: {
            $sum: {
              $toDouble: "$balance.balance",
            },
          },
          userCount: { $sum: 1 },
        },
      },
    ];

    const currentMonthBalances = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfCurrentMonth },
        },
      },
      ...pipeline.slice(1),
    ]);

    const lastMonthBalances = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfLastMonth,
            $lt: startOfCurrentMonth,
          },
        },
      },
      ...pipeline.slice(1),
    ]);

    const allTimeBalances = await User.aggregate(pipeline);

    // Merge data
    const summary = {};

    for (const role of rolesToTrack) {
      const all = allTimeBalances.find((x) => x._id === role);
      const curr = currentMonthBalances.find((x) => x._id === role);
      const prev = lastMonthBalances.find((x) => x._id === role);

      summary[role] = {
        totalBalance: all?.totalBalance || 0,
        currentMonthBalance: curr?.totalBalance || 0,
        lastMonthBalance: prev?.totalBalance || 0,
        difference:
          (curr?.totalBalance || 0) - (prev?.totalBalance || 0),
        userCount: all?.userCount || 0,
      };
    }

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// exports.createOrUpdateBalance = async (req, res) => {
//   const {
//     user_id,
//     balance,
//     transaction_type = "Credit",
//     payment_method,
//     remarks,
//   } = req.body;
//   console.log(req.body,"body");
  
//   try {
//     // Validate
//     if (!user_id || isNaN(balance) || Number(balance) <= 0) {
//       return res.status(400).json({ message: "Invalid data provided" });
//     }

//     const amount = Number(balance);

//     // Step 1: Insert or update UserBalance
//     const updatedBalance = await UserBalance.findOneAndUpdate(
//       { user_id },
//       { $inc: { balance: amount } },
//       { new: true, upsert: true }
//     );

//     // Step 2: Insert into Transaction (after balance is updated)
//     const newTransaction = await Transaction.create({
//       sender_id: user_id,
//       receiver_id: user_id,
//       amount,
//       transaction_type,
//       payment_method,
//       remarks,
//       status: "Success",
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Balance updated and transaction recorded",
//       balance: updatedBalance,
//       transaction: newTransaction,
//     });
//   } catch (error) {
//     console.error("Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };


exports.createOrUpdateBalance = async (req, res) => {
  const {
    user_id,
    balance,
    transaction_type = "Credit",
    payment_method,
    remarks,
  } = req.body;

  try {
    if (!user_id || isNaN(balance) || Number(balance) <= 0) {
      return res.status(400).json({ message: "Invalid data provided" });
    }

    const amount = Number(balance);

    // ✅ Step 1: Fetch user & role
    const user = await User.findById(user_id).populate("role_id");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Step 2: If Master Admin, check point_creation_limit
    if (user.role_id?.name === "Master-Admin") {
      const masterAdmin = await MasterAdmin.findOne({ user_id: user_id });
      const creationLimit = parseFloat(masterAdmin?.point_creation_limit?.toString() || "0");

      if (amount > creationLimit) {
        return res.status(400).json({
          message: `Amount exceeds Master Admin's creation limit of ₹${creationLimit}`,
        });
      }
    }

    // ✅ Step 3: Update balance
    const updatedBalance = await UserBalance.findOneAndUpdate(
      { user_id },
      { $inc: { balance: amount } },
      { new: true, upsert: true }
    );

    // ✅ Step 4: Record transaction
    const newTransaction = await Transaction.create({
      sender_id: user_id,
      receiver_id: user_id,
      amount,
      transaction_type,
      payment_method,
      remarks,
      status: "Success",
    });

    return res.status(200).json({
      success: true,
      message: "Balance updated and transaction recorded",
      balance: updatedBalance,
      transaction: newTransaction,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Balance by User ID
exports.getBalanceByUserId = async (req, res) => {
  const { user_id } = req.params;

  try {
    const balance = await UserBalance.findOne({ user_id });

    if (!balance) {
      return res
        .status(404)
        .json({ success: false, message: "Balance not found" });
    }

    res.status(200).json({ success: true, data: balance });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get All Balances
exports.getAllUserBalances = async (req, res) => {
  try {
    const balances = await UserBalance.find().populate("user_id", "name email");
    res.status(200).json({ success: true, data: balances });
  } catch (error) {
    console.error("Error fetching all balances:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete Balance by ID
exports.deleteBalance = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await UserBalance.findByIdAndDelete(id);
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    res.status(200).json({ success: true, message: "User balance deleted" });
  } catch (error) {
    console.error("Error deleting balance:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};