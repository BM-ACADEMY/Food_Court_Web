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
      sparse: true, // allows null+unique combo
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
    whatsapp_number: {
      type: String,
      trim: true,
    },
    balance: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0.0,
    },
    is_flagged: {
      type: Boolean,
      default: false,
    },
    flag_reason: {
      type: String,
    },
    last_activity_at: {
      type: Date,
    },
  },
  {
    timestamps:true
  }
);

// Compound index: (role_id, email, phone_number)
userSchema.index({ role_id: 1, email: 1, phone_number: 1 }, { name: "idx_users_role_email_phone" });

module.exports = mongoose.model("User", userSchema);
