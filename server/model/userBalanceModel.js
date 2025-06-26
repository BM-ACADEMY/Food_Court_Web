const mongoose = require("mongoose");

const UserBalanceSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
     balance: {
      type: mongoose.Schema.Types.Decimal128, 
      required: true,
      default: "0.00",
      get: (v) => parseFloat(v).toFixed(2),
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },

    toJSON: { getters: true }, // Ensure getters are applied when converting to JSON

  }
);

module.exports = mongoose.model("UserBalance", UserBalanceSchema);