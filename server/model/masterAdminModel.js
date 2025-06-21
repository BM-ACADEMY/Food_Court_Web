const mongoose = require("mongoose");

const masterAdminSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    point_creation_limit: {
      type: mongoose.Schema.Types.Decimal128,
      default: 500000.00,
    },
    master_admin_to_admin: {
      type: mongoose.Schema.Types.Decimal128,
      default: 100000.00,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

module.exports = mongoose.model("MasterAdmin", masterAdminSchema);
