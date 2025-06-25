const mongoose = require("mongoose");

const upiSchema = new mongoose.Schema(
  {
    upiId: {
      type: String,
      required: true,
      trim: true,
    },
    upiName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

module.exports = mongoose.model("Upi", upiSchema);