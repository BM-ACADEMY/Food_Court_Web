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

// Utility to send SMS using BhashSMS
const sendOtpSms = async (mobile, otp) => {
  const message = `Your OTP is ${otp} to verify your mobile number on Pegasus2025.`;

  const params = {
    user: process.env.SMS_USER, // e.g. "FreshBloom"
    pass: process.env.SMS_PASS, // e.g. your password
    sender: process.env.SMS_SENDER, // e.g. "FRHBLM" (must be approved)
    phone: mobile,
    text: message,
    priority: process.env.SMS_PRIORITY || "ndnd",
    stype: process.env.SMS_STYPE || "normal",
  };

  const url = `http://bhashsms.com/api/sendmsg.php?${qs.stringify(params)}`;

  try {
    const res = await axios.get(url);
    console.log("SMS API response:", res.data); // optional for debugging
    return res.data;
  } catch (err) {
    console.error("Failed to send OTP SMS:", err.message);
    throw new Error("Failed to send OTP SMS");
  }
};
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
    // const otpres = await sendOtpSms(phone_number, otp);
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
      return res.status(404).json({ success: false, message: "User not found" });

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
