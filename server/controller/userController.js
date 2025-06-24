const User = require("../model/userModel");
const bcrypt = require("bcryptjs");
const qs = require("qs");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();
const MasterAdmin = require("../model/masterAdminModel");
const Admin = require("../model/adminModel");
const TreasurySubcom = require("../model/treasurySubcomModel");
const Restaurant = require("../model/restaurantModel");
const Customer = require("../model/customerModel");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const UserBalance = require("../model/userBalanceModel");
const { sendOtpSms } = require("../utils/sentSmsOtp");
const LoginLog = require("../model/loginLogModel");
const Role = require("../model/roleModel");
const Transaction = require("../model/transactionModel");

//login function
exports.loginUser = async (req, res) => {
  const { emailOrPhone, password } = req.body;

  try {
    // Find user by email or phone number
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone_number: emailOrPhone }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 86400000,
    });

    // Create login log
    await LoginLog.create({
      user_id: user._id,
      login_time: new Date(),
    });

    res.json({ success: true, message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMe = async (req, res) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ message: "Not logged in" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and populate role
    const user = await User.findById(decoded.id)
      .select("-password_hash")
      .populate("role_id");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch balance
    const userBalance = await UserBalance.findOne({ user_id: user._id });
    const balance = userBalance
      ? parseFloat(userBalance.balance.toString())
      : 0.0;

    // Prepare response object
    const userObj = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      is_flagged: user.is_flagged,
      flag_reason: user.flag_reason,
      number_verified: user.number_verified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role_id, // full role object
      balance, // user's balance
    };

    res.json({ user: userObj });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};

//logout function
exports.logoutUser = async (req, res) => {
  try {
    // Get user ID from middleware
    const userId = req.user?.id;
    console.log("Logout attempt for userId:", userId);

    // Validate userId
    if (!userId) {
      console.warn("No user ID provided for logout");
      return res
        .status(401)
        .json({ success: false, message: "No user ID provided" });
    }

    // Update the most recent login log with logout time
    const updatedLog = await LoginLog.findOneAndUpdate(
      { user_id: userId, logout_time: null },
      { logout_time: new Date() },
      { sort: { login_time: -1 }, new: true } // Return updated document
    );

    if (!updatedLog) {
      console.warn(`No open login log found for user ${userId}`);
    } else {
      console.log("Updated login log:", updatedLog);
    }

    // Clear token cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getSessionHistory = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    // Validate userId
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    // Build query
    const query = { user_id: userId };
    if (startDate || endDate) {
      query.login_time = {};
      if (startDate) query.login_time.$gte = new Date(startDate);
      if (endDate) query.login_time.$lte = new Date(endDate);
    }

    // Fetch session logs
    const sessions = await LoginLog.find(query)
      .sort({ login_time: -1 })
      .select("login_time logout_time created_at");

    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    console.error("Session history error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Function to generate a 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000);
}

// Function to send OTP SMS
// async function sendOtpSms(mobile) {
//   const otp = generateOtp();
//   const message = `Dear User, Your OTP for login to FreshBloom is ${otp}. Please do not share this OTP. Regards Piyums`;

//   // Build query parameters (auto URL-encodes)
//   const params = new URLSearchParams({
//     user: "FreshBloom",
//     pass: "123456",
//     sender: "FSHBLM",
//     phone: mobile,
//     text: message,
//     priority: "ndnd",
//     stype: "normal",
//   });

//   const url = `https://bhashsms.com/api/sendmsg.php?${params.toString()}`;

//   try {
//     const response = await axios.get(url);
//     console.log("✅ OTP sent successfully:", otp);
//     console.log("📨 SMS API response:", response.data);
//   } catch (err) {
//     console.error("❌ Failed to send OTP SMS:", err.message);
//   }
// }
// Create User
exports.createUser = async (req, res) => {
  try {
    const { role_id, name, email, phone_number, password, confirm_password } =
      req.body;

    if (!password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password are required",
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }

    // ✅ Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already exists. Please use a different email.",
      });
    }

    // ✅ Check if phone number already exists
    const existingPhone = await User.findOne({ phone_number });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "Phone number already exists. Please use a different number.",
      });
    }

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // ✅ Send OTP via SMS (optional)
    // const otpres = await sendOtpSms(phone_number,otp);
    // console.log(otpres, "res");

    // ✅ Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // ✅ Create user
    const newUser = new User({
      role_id,
      name,
      email,
      phone_number,
      password_hash,
      phone_number_otp: otp,
      number_verified: false,
      otp_expires_at: otpExpiry,
    });

    await newUser.save();

    // ✅ Populate role
    const populatedUser = await User.findById(newUser._id).populate("role_id");

    res.status(201).json({
      success: true,
      message: "User created successfully. OTP sent to phone.",
      data: {
        _id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        phone_number: populatedUser.phone_number,
        role: populatedUser.role_id,
      },
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /users/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { phone_number, otp } = req.body;

    if (!phone_number || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    const user = await User.findOne({ phone_number });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.number_verified) {
      return res
        .status(200)
        .json({ success: true, message: "Number already verified" });
    }

    // ✅ Check if OTP is correct and not expired
    const now = new Date();
    if (
      user.phone_number_otp !== otp ||
      !user.otp_expires_at ||
      now > user.otp_expires_at
    ) {
      return res.status(400).json({
        success: false,
        message:
          user.phone_number_otp !== otp
            ? "Invalid OTP"
            : "OTP has expired. Please request a new one.",
      });
    }

    // ✅ Mark number as verified
    user.number_verified = true;
    user.phone_number_otp = null;
    user.otp_expires_at = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Phone number verified successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all users with pagination, search, and role filter

exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone_number: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role ObjectId
    if (role) {
      if (!mongoose.Types.ObjectId.isValid(role)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid role ID" });
      }
      query.role_id = role;
    }

    const totalCount = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const users = await User.find(query)
      .populate("role_id", "name role_id")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-password_hash") // 🚫 EXCLUDE password_hash
      .lean();

    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const roleKey = user.role_id?.role_id;
        const roleName = user.role_id?.name;

        const enriched = {
          ...user,
          role_id: user.role_id?._id,
          role_key: roleKey,
          role_name: roleName,
        };

        switch (roleKey) {
          case "role-1": {
            // Master Admin
            const master = await MasterAdmin.findOne({
              user_id: user._id,
            }).lean();
            if (master) {
              enriched.master_admin_id = master.master_admin_id;
              enriched.m_id = master._id; // 👈 Mongo ID for deletion
              enriched.point_creation_limit = master.point_creation_limit;
              enriched.master_admin_to_admin = master.master_admin_to_admin;
            }
            break;
          }

          case "role-2": {
            // Admin
            const admin = await Admin.findOne({ user_id: user._id }).lean();
            if (admin) {
              enriched.admin_id = admin.admin_id;
              enriched.a_id = admin._id; // 👈 Mongo ID
              enriched.admin_to_admin_transfer_limit =
                admin.admin_to_admin_transfer_limit;
              enriched.admin_to_subcom_transfer_limit =
                admin.admin_to_subcom_transfer_limit;
            }
            break;
          }

          case "role-3": {
            // Treasury Subcom
            const subcom = await TreasurySubcom.findOne({
              user_id: user._id,
            }).lean();
            if (subcom) {
              enriched.treasury_subcom_id = subcom.treasury_subcom_id;
              enriched.t_id = subcom._id; // 👈 Mongo ID
              enriched.top_up_limit = subcom.top_up_limit;
            }
            break;
          }

          case "role-4": {
            // Restaurant
            const restaurant = await Restaurant.findOne({ user_id: user._id })
              .populate("location", "name")
              .lean();
            if (restaurant) {
              enriched.restaurant_id = restaurant.restaurant_id;
              enriched.r_id = restaurant._id; // 👈 Mongo ID
              enriched.restaurant_name = restaurant.restaurant_name;
              enriched.location = restaurant.location?.name || "-";
              enriched.qr_code = restaurant.qr_code;
              enriched.status = restaurant.status;
              enriched.treasury_to_customer_refund =
                restaurant.treasury_to_customer_refund;
            }
            break;
          }

          case "role-5": {
            // Customer
            const customer = await Customer.findOne({
              user_id: user._id,
            }).lean();
            if (customer) {
              enriched.customer_id = customer.customer_id;
              enriched.c_id = customer._id; // 👈 Mongo ID
              enriched.registration_type = customer.registration_type;
              enriched.registration_fee_paid = customer.registration_fee_paid;
              enriched.qr_code = customer.qr_code;
              enriched.status = customer.status;
            }
            break;
          }

          default:
            break;
        }

        return enriched;
      })
    );

    return res.status(200).json({
      success: true,
      data: enrichedUsers,
      totalPages,
    });
  } catch (error) {
    console.error("getUsers error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getAllUsersforHistory = async (req, res) => {
  try {
    const requestingUserId = req.user?.id;
    const requestingUser = await User.findById(requestingUserId).populate(
      "role_id"
    );

    if (!requestingUser) {
      return res
        .status(404)
        .json({ success: false, message: "Requesting user not found" });
    }

    const roleName = requestingUser.role_id?.name || "";
    if (!["Master-Admin", "Admin"].includes(roleName)) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to view users" });
    }

    const users = await User.find()
      .populate("role_id", "name")
      .select("name email role_id");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("role_id", "name");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("role_id"); // ✅ Populate role

    if (!updatedUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const roleModelMap = {
  "role-1": MasterAdmin,
  "role-2": Admin,
  "role-3": TreasurySubcom,
  "role-4": Restaurant,
  "role-5": Customer,
};

exports.getUsersWithBalanceByRole = async (req, res) => {
  const { role_id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const search = req.query.search || "";
  const status = req.query.status || "all"; // active, inactive, all
  const sort = req.query.sort || ""; // name, balance-high, balance-low, recent

  try {
    const role = await Role.findOne({ role_id });
    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    // 1. Base user query
    const userQuery = {
      role_id: role._id,
    };

    if (search) {
      userQuery["$or"] = [
        { name: { $regex: search, $options: "i" } },
        { phone_number: { $regex: search, $options: "i" } },
      ];
    }

    let users = await User.find(userQuery).populate("role_id").lean();

    const userIds = users.map((u) => u._id);

    // 2. Balances
    const balances = await UserBalance.find({ user_id: { $in: userIds } });

    const balanceMap = {};
    for (const b of balances) {
      balanceMap[b.user_id.toString()] = parseFloat(b.balance.toString());
    }

    // 3. Filter by status after getting balances
    if (status === "active") {
      users = users.filter((u) => (balanceMap[u._id.toString()] || 0) > 0);
    } else if (status === "inactive") {
      users = users.filter((u) => (balanceMap[u._id.toString()] || 0) === 0);
    }

    // Recreate userIds after filtering
    const filteredUserIds = users.map((u) => u._id);

    // 4. Transactions
    const transactions = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { sender_id: { $in: filteredUserIds } },
            { receiver_id: { $in: filteredUserIds } },
          ],
          status: "Success",
        },
      },
      { $sort: { created_at: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $in: ["$sender_id", filteredUserIds] },
              "$sender_id",
              "$receiver_id",
            ],
          },
          amount: { $first: "$amount" },
          created_at: { $first: "$created_at" },
        },
      },
    ]);

    const txnMap = {};
    for (const txn of transactions) {
      txnMap[txn._id.toString()] = {
        amount: parseFloat(txn.amount.toString()),
        timeAgo: txn.created_at,
      };
    }

    // 5. Last logins
    const loginLogs = await LoginLog.aggregate([
      { $match: { user_id: { $in: filteredUserIds } } },
      { $sort: { created_at: -1 } },
      {
        $group: {
          _id: "$user_id",
          lastLogin: { $first: "$created_at" },
        },
      },
    ]);

    const loginMap = {};
    for (const log of loginLogs) {
      loginMap[log._id.toString()] = log.lastLogin;
    }

    // 6. Extra profile info
    const dynamicModel = roleModelMap[role_id];
    let extraInfos = [];
    if (dynamicModel) {
      extraInfos = await dynamicModel
        .find({ user_id: { $in: filteredUserIds } })
        .lean();
    }

    const extraInfoMap = {};
    for (const info of extraInfos) {
      extraInfoMap[info.user_id.toString()] = info;
    }

    // 7. Merge all
    let usersWithData = users.map((user) => {
      const uid = user._id.toString();
      return {
        ...user,
        balance: balanceMap[uid] || 0,
        lastTransaction: txnMap[uid] || null,
        lastLogin: loginMap[uid] || null,
        ...(extraInfoMap[uid] || {}),
      };
    });

    // 8. Sorting
    if (sort === "name") {
      usersWithData.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "balance-high") {
      usersWithData.sort((a, b) => b.balance - a.balance);
    } else if (sort === "balance-low") {
      usersWithData.sort((a, b) => a.balance - b.balance);
    } else if (sort === "recent") {
      usersWithData.sort(
        (a, b) =>
          new Date(b.lastTransaction?.timeAgo || 0) -
          new Date(a.lastTransaction?.timeAgo || 0)
      );
    }

    // 9. Pagination
    const paginated = usersWithData.slice((page - 1) * limit, page * limit);

    return res.json({ success: true, data: paginated });
  } catch (err) {
    console.error("Error fetching users with balance, txn, login:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
