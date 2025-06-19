const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    qr_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Blocked", "Lost"], // adjust to your enum
      default: "Active",
      required: true,
    },
    issued_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // we are only using `issued_at` instead of createdAt/updatedAt
  }
);

module.exports = mongoose.model("Card", cardSchema);
