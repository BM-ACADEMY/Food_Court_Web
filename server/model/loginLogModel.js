const mongoose = require("mongoose");

const loginLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    login_time: {
      type: Date,
      required: true,
    },
    logout_time: {
      type: Date,
    },
    status:{
      type:Boolean,
      default:false,
    },
    location_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
    },
    upi_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Upi",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

module.exports = mongoose.model("LoginLog", loginLogSchema);
