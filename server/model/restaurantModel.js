const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
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

// Compound index
restaurantSchema.index(
  { user_id: 1, qr_code: 1 },
  { name: "idx_restaurants_user_qr" }
);

// ✅ Pre-save hook to generate qr_code UUID if not already set
restaurantSchema.pre("save", function (next) {
  if (!this.qr_code) {
    this.qr_code = uuidv4();
  }
  next();
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
