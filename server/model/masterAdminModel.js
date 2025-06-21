const mongoose = require("mongoose");
const Counter = require("./counterModel"); // Import Counter model

const masterAdminSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    master_admin_id: {
      type: String,
      unique: true,
      index: true,
    },
    point_creation_limit: {
      type: mongoose.Schema.Types.Decimal128,
      default: 500000.0,
    },
    master_admin_to_admin: {
      type: mongoose.Schema.Types.Decimal128,
      default: 100000.0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

// Auto-generate master_admin_id like MASA1001
masterAdminSchema.pre("save", async function (next) {
  if (!this.master_admin_id) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "master_admin_id" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.master_admin_id = `MASA${counter.seq}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("MasterAdmin", masterAdminSchema);
