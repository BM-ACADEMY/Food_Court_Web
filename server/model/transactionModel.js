const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    transaction_type: {
      type: String,
      required: true,
      enum: ["Transfer", "TopUp", "Refund", "Withdrawal"], // Add your exact types here
    },
    payment_method: {
      type: String,
      enum: ["Cash", "Online", "Wallet", "Card"], // Optional, adjust as per your enum
    },
    status: {
      type: String,
      enum: ["Pending", "Success", "Failed"],
      default: "Pending",
      required: true,
    },
    remarks: {
      type: String,
    },
    location_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
    },
    edited_at: {
      type: Date,
    },
    edited_by_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
