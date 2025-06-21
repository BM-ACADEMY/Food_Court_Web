const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    restaurant_name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    owner_name: {
      type: String,
      required: true,
      trim: true,
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
    treasury_to_customer_refund: {
      type: mongoose.Schema.Types.Decimal128,
      default: 1000.0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

// Compound index: (user_id, qr_code)
restaurantSchema.index(
  { user_id: 1, qr_code: 1 },
  { name: "idx_restaurants_user_qr" }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
