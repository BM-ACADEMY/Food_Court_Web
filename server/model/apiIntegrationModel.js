const mongoose = require("mongoose");

const apiIntegrationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["SMS", "Email", "Payment", "WhatsApp", "Map"], // You can adjust enum values
    },
    api_key: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Inactive",
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

module.exports = mongoose.model("ApiIntegration", apiIntegrationSchema);
