const mongoose = require("mongoose");
const Counter = require("./counterModel"); // 👈 Import Counter

const adminSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    admin_id: {
      type: String,
      unique: true,
      index: true,
    },
    admin_to_admin_transfer_limit: {
      type: mongoose.Schema.Types.Decimal128,
      default: 100000.0,
    },
    admin_to_subcom_transfer_limit: {
      type: mongoose.Schema.Types.Decimal128,
      default: 50000.0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

// 🧠 Pre-save hook to generate custom `admin_id` like ADMI1001
adminSchema.pre("save", async function (next) {
  if (!this.admin_id) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "admin_id" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.admin_id = `ADMI${counter.seq}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("Admin", adminSchema);
