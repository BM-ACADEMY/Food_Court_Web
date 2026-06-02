const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    login_log_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoginLog",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
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

module.exports = mongoose.model("ActivityLog", activityLogSchema);
