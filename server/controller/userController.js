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

// Login function
exports.loginUser = async (req, res) => {
  const { emailOrPhone, password, role } = req.body; // include role from body

  try {
    // Find user by email or phone number
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone_number: emailOrPhone }],
    }).populate("role_id"); // to access role_id.role_id

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRoleId = user.role_id?.role_id;

    // Role-based access restriction
    if (role === "admin") {
      const allowedAdminRoles = ["role-1", "role-2", "role-3", "role-4"];
      if (!allowedAdminRoles.includes(userRoleId)) {
        return res.status(403).json({ message: "Unauthorized: Not an admin" });
      }
    } else if (role === "customer") {
      if (userRoleId !== "role-5") {
        return res.status(403).json({ message: "Unauthorized: Not a customer" });
      }
    } else {
      return res.status(400).json({ message: "Invalid role context provided" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role_id },
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
      status: true,
    });

    res.json({ success: true, message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Get current user
exports.getMe = async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Not logged in" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and populate role
    const user = await User.findById(decoded.id)
      .select("-password_hash")
      .populate("role_id");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch balance
    const userBalance = await UserBalance.findOne({ user_id: user._id });
    const balance = userBalance ? parseFloat(userBalance.balance.toString()) : 0.0;

    // Fetch customer data
    const customer = await Customer.findOne({ user_id: user._id }).lean();

    // Fetch restaurant data
    const restaurant = await Restaurant.findOne({ user_id: user._id }).lean();

    // Fetch treasury subcom data for role-3 users
    let treasurySubcom = null;
    if (user.role_id?.role_id === "role-3") {
      treasurySubcom = await TreasurySubcom.findOne({ user_id: user._id }).lean();
    }

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
      balance, // User's balance
      qr_code: customer ? customer.qr_code : null, // qrcode fetch
      customer_id: customer ? customer.customer_id : "N/A",
      restaurant_id: restaurant ? restaurant.restaurant_id : "N/A", // Add restaurant_id
      r_id: restaurant ? restaurant._id : null, // Mongo ID for updating restaurant
      treasury_subcom_id: treasurySubcom ? treasurySubcom.treasury_subcom_id : "N/A", // Add treasury_subcom_id
    };

    res.json({ user: userObj });
  } catch (err) {
    console.error("getMe error:", err.message, err.stack);
    return res.status(401).json({ message: "Invalid token", details: err.message });
  }
};
// Logout function
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
      { logout_time: new Date(), status: false },
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

// Get session history
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

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already exists. Please use a different email.",
      });
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({ phone_number });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "Phone number already exists. Please use a different number.",
      });
    }

    // Generate OTP
    const otp = generateOtp().toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    const otpres = sendOtpSms(phone_number, otp);
    console.log(otpres, "otp");

    // Create user
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

    // Create customer record for role-5 users
    if (role_id.toString() === "role-5") {
      const customer = new Customer({
        user_id: newUser._id,
        customer_id: `CUST-${newUser._id.toString().slice(-6)}`,
        registration_type: "Standard",
        registration_fee_paid: false,
        status: "Active",
      });
      await customer.save();
    }

    // Populate role
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

// Verify OTP
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

    // Check if OTP is correct and not expired
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

    // Mark number as verified
    user.number_verified = true;
    user.phone_number_otp = null;
    user.otp_expires_at = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Phone number verified successfully",
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyMobileLoginOtp = async (req, res) => {
  try {
    const { phone_number, otp } = req.body;

    if (!phone_number || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    // Find user and populate role_id
    const user = await User.findOne({ phone_number }).populate("role_id");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if OTP is correct and not expired
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

    // Mark number as verified
    user.number_verified = true;
    user.phone_number_otp = null;
    user.otp_expires_at = null;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role_id.role_id }, // Use role_id from populated role
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 86400000, // 1 day
    });

    // Create login log
    await LoginLog.create({
      user_id: user._id,
      login_time: new Date(),
      status: true,
    });

    // Return user data with populated role
    return res.status(200).json({
      success: true,
      message: "Phone number verified and login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role: {
          role_id: user.role_id.role_id,
          name:user.role_id.name
        },
        number_verified: user.number_verified,
      },
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

exports.sendOtpController = async (req, res) => {
  const { phone_number } = req.body;

  try {
    // Validate phone number
    if (!phone_number) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid phone number. Must be a valid Indian number (+91xxxxxxxxxx).",
      });
    }

    // Check if user exists
    const user = await User.findOne({ phone_number });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this phone number.",
      });
    }

    // Generate OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 3 * 60 * 1000); // OTP expires in 3 minutes

    // Update user's OTP fields
    user.phone_number_otp = otp;
    user.otp_expires_at = otpExpiry;
    await user.save();

    // Send OTP via ChennaiSMS
    try {
      const smsResponse = await sendOtpSms(phone_number, otp);
      if (smsResponse) {
        return res.status(200).json({
          success: true,
          message: "OTP sent successfully.",
        });
      } else {
        console.error("SMS response:", smsResponse);
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP. Please try again.",
        });
      }
    } catch (smsError) {
      console.error("SMS sending failed:", smsError.message);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again.",
      });
    }
  } catch (error) {
    console.error("Error in sendOtpController:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request.",
    });
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
      .select("-password_hash")
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
            const master = await MasterAdmin.findOne({
              user_id: user._id,
            }).lean();
            if (master) {
              enriched.master_admin_id = master.master_admin_id;
              enriched.m_id = master._id;
              enriched.point_creation_limit = master.point_creation_limit;
              enriched.master_admin_to_admin = master.master_admin_to_admin;
            }
            break;
          }
          case "role-2": {
            const admin = await Admin.findOne({ user_id: user._id }).lean();
            if (admin) {
              enriched.admin_id = admin.admin_id;
              enriched.a_id = admin._id;
              enriched.admin_to_admin_transfer_limit =
                admin.admin_to_admin_transfer_limit;
              enriched.admin_to_subcom_transfer_limit =
                admin.admin_to_subcom_transfer_limit;
            }
            break;
          }
          case "role-3": {
            const subcom = await TreasurySubcom.findOne({
              user_id: user._id,
            }).lean();
            if (subcom) {
              enriched.treasury_subcom_id = subcom.treasury_subcom_id;
              enriched.t_id = subcom._id;
              enriched.top_up_limit = subcom.top_up_limit;
            }
            break;
          }
          case "role-4": {
            const restaurant = await Restaurant.findOne({ user_id: user._id })
              .populate("location", "name")
              .lean();
            if (restaurant) {
              enriched.restaurant_id = restaurant.restaurant_id;
              enriched.r_id = restaurant._id;
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
            const customer = await Customer.findOne({
              user_id: user._id,
            }).lean();
            if (customer) {
              enriched.customer_id = customer.customer_id;
              enriched.c_id = customer._id;
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

// Get all users for history (with customer_id for role-5)
exports.getAllUsersforHistory = async (req, res) => {
  try {
    const requestingUserId = req.user?.id;
    const { userId, startDate, endDate } = req.query;

    // Validate requesting user
    const requestingUser = await User.findById(requestingUserId).populate(
      "role_id"
    );
    if (!requestingUser) {
      return res.status(404).json({ error: "Requesting user not found" });
    }

    const roleName = requestingUser.role_id?.name || "";
    if (!["Master-Admin", "Admin"].includes(roleName)) {
      return res
        .status(403)
        .json({ error: "Unauthorized to view user history" });
    }

    // Build match query for users
    let matchQuery = {};
    if (userId) {
      try {
        matchQuery._id = mongoose.Types.ObjectId(userId);
      } catch (err) {
        return res.status(400).json({ error: "Invalid userId format" });
      }
    }

    // Build session match query for date filtering
    let sessionMatch = {};
    if (startDate) {
      sessionMatch.login_time = { $gte: new Date(startDate) };
    }
    if (endDate) {
      sessionMatch.login_time = {
        ...sessionMatch.login_time,
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    // Aggregate users, sessions, and transactions
    const users = await User.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "roles",
          localField: "role_id",
          foreignField: "_id",
          as: "role",
        },
      },
      { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "loginlogs",
          let: { user_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$user_id", "$$user_id"] },
                ...sessionMatch,
              },
            },
            { $sort: { login_time: -1 } },
            { $limit: 1 },
          ],
          as: "latestSession",
        },
      },
      { $unwind: { path: "$latestSession", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "transactions",
          let: {
            user_id: "$_id",
            session_start: "$latestSession.login_time",
            session_end: {
              $ifNull: ["$latestSession.logout_time", new Date()],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $eq: ["$sender_id", "$$user_id"] },
                        { $eq: ["$receiver_id", "$$user_id"] },
                      ],
                    },
                    { $gte: ["$created_at", "$$session_start"] },
                    { $lte: ["$created_at", "$$session_end"] },
                  ],
                },
              },
            },
            {
              $project: {
                transaction_id: 1,
                sender_id: 1,
                receiver_id: 1,
                amount: 1,
                transaction_type: 1,
                payment_method: 1,
                status: 1,
                remarks: 1,
                created_at: 1,
              },
            },
          ],
          as: "actions",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone_number: 1,
          role: "$role.name",
          session: {
            login_time: "$latestSession.login_time",
            logout_time: "$latestSession.logout_time",
            status: {
              $cond: {
                if: { $eq: ["$latestSession.status", true] },
                then: "Online",
                else: "Offline",
              },
            },
          },
          actions: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Get users history error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("role_id", "name role_id")
      .select("-password_hash")
      .lean();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const enriched = {
      ...user,
      role_id: user.role_id?._id,
      role_name: user.role_id?.name,
      role_key: user.role_id?.role_id,
    };

    if (user.role_id?.role_id === "role-5") {
      const customer = await Customer.findOne({ user_id: user._id }).lean();
      enriched.customer_id = customer ? customer.customer_id : "N/A";
    }

    res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    console.error("Get user by ID error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, phone_number, is_flagged } = req.body;

    console.log("updateUser: Request payload:", { userId, name, email, phone_number, is_flagged });

    if (!mongoose.isValidObjectId(userId)) {
      console.error(`updateUser: Invalid user ID format: ${userId}`);
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (!name || !email || !phone_number) {
      console.error("updateUser: Missing required fields", { name, email, phone_number });
      return res.status(400).json({ message: "Name, email, and phone number are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error(`updateUser: Invalid email format: ${email}`);
      return res.status(400).json({ message: "Invalid email format" });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone_number)) {
      console.error(`updateUser: Invalid phone number format: ${phone_number}`);
      return res.status(400).json({ message: "Phone number must be 10 digits" });
    }

    const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
    if (existingEmail) {
      console.error(`updateUser: Email already exists: ${email}`);
      return res.status(409).json({ message: "Email already exists" });
    }

    const existingPhone = await User.findOne({ phone_number, _id: { $ne: userId } });
    if (existingPhone) {
      console.error(`updateUser: Phone number already exists: ${phone_number}`);
      return res.status(409).json({ message: "Phone number already exists" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, phone_number, is_flagged, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
      .select("-password_hash")
      .populate("role_id");

    if (!updatedUser) {
      console.error(`updateUser: User not found for ID ${userId}`);
      return res.status(404).json({ message: "User not found" });
    }

    if (updatedUser.role_id?.role_id === "role-4") {
      const restaurant = await Restaurant.findOneAndUpdate(
        { user_id: userId },
        { restaurant_name: name },
        { new: true }
      );
      if (!restaurant) {
        console.warn(`updateUser: No restaurant found for user ${userId}`);
      }
    }

    const userBalance = await UserBalance.findOne({ user_id: updatedUser._id });
    const balance = userBalance ? parseFloat(userBalance.balance.toString()) : 0.0;

    const customer = await Customer.findOne({ user_id: updatedUser._id }).lean();
    const restaurant = await Restaurant.findOne({ user_id: updatedUser._id }).lean();

    let treasurySubcom = null;
    if (updatedUser.role_id?.role_id === "role-3") {
      treasurySubcom = await TreasurySubcom.findOne({ user_id: updatedUser._id }).lean();
      console.log("updateUser: TreasurySubcom:", treasurySubcom);
    }

    const userObj = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone_number: updatedUser.phone_number,
      is_flagged: updatedUser.is_flagged,
      flag_reason: updatedUser.flag_reason,
      number_verified: updatedUser.number_verified,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      role: updatedUser.role_id,
      role_key: updatedUser.role_id?.role_id,
      role_name: updatedUser.role_id?.name,
      balance,
      customer_id: customer ? customer.customer_id : "N/A",
      restaurant_id: restaurant ? restaurant.restaurant_id : "N/A",
      r_id: restaurant ? restaurant._id : null,
      treasury_subcom_id: treasurySubcom ? treasurySubcom.treasury_subcom_id : "N/A",
    };

    console.log("updateUser: Success, user updated:", userObj);
    res.json({ data: userObj, message: "User updated successfully" });
  } catch (err) {
    console.error("updateUser error:", err.message, err.stack);
    res.status(500).json({ message: "Server error", details: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
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

exports.getTransactionDetails = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const requestingUserId = req.user?.id;

    // Validate requesting user
    const requestingUser = await User.findById(requestingUserId).populate(
      "role_id"
    );
    if (!requestingUser) {
      return res.status(404).json({ error: "Requesting user not found" });
    }

    const roleName = requestingUser.role_id?.name || "";
    if (!["Master-Admin", "Admin"].includes(roleName)) {
      return res
        .status(403)
        .json({ error: "Unauthorized to view transaction details" });
    }

    // Find transaction and populate sender/receiver details
    const transaction = await Transaction.findOne({
      transaction_id: transactionId,
    })
      .populate({
        path: "sender_id",
        select: "name email phone_number role_id",
        populate: { path: "role_id", select: "name" },
      })
      .populate({
        path: "receiver_id",
        select: "name email phone_number role_id",
        populate: { path: "role_id", select: "name" },
      })
      .lean();

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Format response
    const formattedTransaction = {
      transaction_id: transaction.transaction_id,
      amount: transaction.amount,
      transaction_type: transaction.transaction_type,
      payment_method: transaction.payment_method || "N/A",
      status: transaction.status,
      remarks: transaction.remarks || "N/A",
      created_at: transaction.created_at,
      sender: {
        _id: transaction.sender_id._id,
        name: transaction.sender_id.name,
        email: transaction.sender_id.email || "N/A",
        phone_number: transaction.sender_id.phone_number,
        role: transaction.sender_id.role_id?.name || "Unknown",
      },
      receiver: {
        _id: transaction.receiver_id._id,
        name: transaction.receiver_id.name,
        email: transaction.receiver_id.email || "N/A",
        phone_number: transaction.receiver_id.phone_number,
        role: transaction.receiver_id.role_id?.name || "Unknown",
      },
    };

    res.status(200).json({ success: true, data: formattedTransaction });
  } catch (error) {
    console.error("Get transaction details error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.verifyCredentials = async (req, res) => {
  try {
    const { emailOrPhone, password, user_id } = req.body;

    // Validate required fields
    if (!emailOrPhone || !password || !user_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find user by email or phone number
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone_number: emailOrPhone }],
    }).populate("role_id"); // Populate role_id to get Role document

    if (!user) {
      return res.status(401).json({ error: "Invalid email or phone number" });
    }

    // Verify user_id matches
    if (user._id.toString() !== user_id) {
      return res.status(403).json({ error: "Unauthorized user" });
    }

    // Check role_id from Role model
    if (!user.role_id || !["role-1", "role-2"].includes(user.role_id.role_id)) {
      return res.status(403).json({
        error: "Unauthorized: Only Master-Admin or Admin roles are allowed",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Credentials and role are valid
    res.status(200).json({ isValid: true });
  } catch (error) {
    console.error("Credential verification error:", error);
    res.status(500).json({
      error: "Failed to verify credentials",
      details: error.message,
    });
  }
};