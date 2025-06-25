const mongoose = require("mongoose");
const Counter = require("./counterModel"); // Import Counter

const treasurySubcomSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    treasury_subcom_id: {
      type: String,
      unique: true,
      index: true,
    },
    top_up_limit: {
      type: mongoose.Schema.Types.Decimal128,
      default: 5000.0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

// 🧠 Pre-save hook to generate `TRES1001`, etc.
treasurySubcomSchema.pre("save", async function (next) {
  if (!this.treasury_subcom_id) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "treasury_subcom_id" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.treasury_subcom_id = `TRES${counter.seq}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("TreasurySubcom", treasurySubcomSchema);
