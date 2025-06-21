const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    registration_type: {
      type: String,
      enum: ["online", "offline"], 
      required: true,
    },
    registration_fee_paid: {
      type: Boolean,
      default: false,
    },
    qr_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
      status: {
      type: String,
      enum: ["Active", "Inactive", "Blocked", "Lost"],
      default: "Active",
      required: true,
    },
  },
  {
    timestamps: true
  }
);

// Compound index: (user_id, qr_code)
customerSchema.index({ user_id: 1, qr_code: 1 }, { name: "idx_customers_user_qr" });

module.exports = mongoose.model("Customer", customerSchema);
