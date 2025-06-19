const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    admin_to_admin_transfer_limit: {
      type: mongoose.Schema.Types.Decimal128,
      default: 100000.00,
    },
    admin_to_subcom_transfer_limit: {
      type: mongoose.Schema.Types.Decimal128,
      default: 50000.00,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

module.exports = mongoose.model("Admin", adminSchema);
