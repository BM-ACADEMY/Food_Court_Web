const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Counter = require("./counterModel"); // 👈 Import Counter model

const customerSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    registration_type: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },
    registration_fee_paid: {
      type: Boolean,
      default: false,
    },
    qr_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customer_id: {
      type: String,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Blocked", "Lost"],
      default: "Active",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 👇 Auto-generate `qr_code` & `customer_id`
customerSchema.pre("save", async function (next) {
  if (!this.qr_code) {
    this.qr_code = uuidv4();
  }

  if (!this.customer_id) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "customer_id" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.customer_id = `CUST${counter.seq}`;
    } catch (err) {
      return next(err);
    }
  }

  next();
});

// Compound index: (user_id, qr_code)
customerSchema.index({ user_id: 1, qr_code: 1 }, { name: "idx_customers_user_qr" });

module.exports = mongoose.model("Customer", customerSchema);
