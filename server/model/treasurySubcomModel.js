const mongoose = require("mongoose");

const treasurySubcomSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    top_up_limit: {
      type: mongoose.Schema.Types.Decimal128,
      default: 5000.00,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

module.exports = mongoose.model("TreasurySubcom", treasurySubcomSchema);
