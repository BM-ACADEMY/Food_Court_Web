const mongoose = require("mongoose");

const restaurantSubownerSchema = new mongoose.Schema(
  {
    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    refund_limit: {
      type: mongoose.Schema.Types.Decimal128,
      default: 1000.00,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

module.exports = mongoose.model("RestaurantSubowner", restaurantSubownerSchema);
