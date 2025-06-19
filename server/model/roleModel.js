// models/Role.js
const mongoose = require("mongoose");
const Counter = require("./counterModel");

const roleSchema = new mongoose.Schema(
  {
    role_id: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      enum: [
        "Master-Admin",
        "Admin",
        "Treasury-Subcom",
        "Restaurant",
        "Customer",
      ],
      required: true,
    },
  },
  {
    timestamps: true
  }
);

// Auto-generate role_id before saving
roleSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "role" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.role_id = `role-${counter.seq}`;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model("Role", roleSchema);
