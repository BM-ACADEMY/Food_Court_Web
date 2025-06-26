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
      type: String,
      required: true,
      default: "0.00",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { getters: true }, // Ensure getters are applied when converting to JSON>>>>>>> f1d465f7450ec779ac0e5724bfaa0ca3384c88b6
  }
);

module.exports = mongoose.model("UserBalance", UserBalanceSchema);