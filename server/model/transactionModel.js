const mongoose = require("mongoose");
const Counter = require("../model/counterModel"); // import counter model

const transactionSchema = new mongoose.Schema(
  {
    transaction_id: {
      type: String,
      unique: true,
      index: true,

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
      type: String,
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
 
    edited_at: {
      type: Date,
    },
    edited_by_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);



// Pre-save hook to generate unique transaction_id
transactionSchema.pre("save", async function (next) {
  if (!this.transaction_id) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "transaction_id" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.transaction_id = `TXN${counter.seq.toString().padStart(6, "0")}`; // e.g., TXN000001
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);

