const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    phone_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    is_flagged: {
      type: Boolean,
      default: false,
    },
    flag_reason: {
      type: String,
    },
    phone_number_otp: {
      type: String,
      default: null,
    },
    number_verified: {
      type: Boolean,
      default: false,
    },
    otp_expires_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index(
  { role_id: 1, email: 1, phone_number: 1 },
  { name: "idx_users_role_email_phone" }
);

module.exports = mongoose.model("User", userSchema);