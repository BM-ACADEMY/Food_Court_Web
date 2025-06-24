const mongoose = require("mongoose");
const Counter = require("../model/counterModel"); // import counter model

const transactionSchema = new mongoose.Schema(
  {
    transaction_id: {
      type: String,
      unique: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    transaction_type: {
      type: String,
      required: true,
      enum: ["Transfer", "TopUp", "Refund", "Credit"],
    },
    payment_method: {
      type: String,
      enum: ["Cash", "Gpay", "Mess bill"],
    },
    status: {
      type: String,
      enum: ["Pending", "Success", "Failed"],
      default: "Pending",
      required: true,
    },
    remarks: {
      type: String,
    },
    location_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
    },
    edited_at: {
      type: Date,
    },
    edited_by_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

// Auto-generate transaction_id like TRANX001
transactionSchema.pre("save", async function (next) {
  if (this.transaction_id) return next();

  try {
    const counter = await Counter.findOneAndUpdate(
      { _id: "transaction_id" }, // ✅ fix here
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const paddedSeq = String(counter.seq).padStart(3, "0");
    this.transaction_id = `TRANX${paddedSeq}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);
