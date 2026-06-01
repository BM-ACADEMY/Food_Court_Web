const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load .env
dotenv.config();

// Import models
const User = require("./model/userModel");
const Role = require("./model/roleModel");
const LoginLog = require("./model/loginLogModel");
const Transaction = require("./model/transactionModel");

// Import the controller function
const { getAllUsersforHistory } = require("./controller/userController");

async function run() {
  const mongoUri = process.env.MONGO_URI;
  console.log("Connecting to MongoDB:", mongoUri);
  
  await mongoose.connect(mongoUri);
  console.log("Connected successfully.");

  // Find an admin user
  const adminRole = await Role.findOne({ name: { $in: ["Admin", "Master-Admin"] } });
  if (!adminRole) {
    console.error("Could not find Admin or Master-Admin role in database.");
    process.exit(1);
  }

  const adminUser = await User.findOne({ role_id: adminRole._id });
  if (!adminUser) {
    console.error("Could not find any user with Admin/Master-Admin role in database.");
    process.exit(1);
  }

  console.log(`Testing using Admin User: ${adminUser.name} (${adminUser._id})`);

  // Mock req and res
  const req = {
    user: { id: adminUser._id.toString() },
    query: {}
  };

  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      console.log(`\n--- Response (Status ${this.statusCode}) ---`);
      console.log(JSON.stringify(data, null, 2));
      process.exit(0);
    }
  };

  try {
    await getAllUsersforHistory(req, res);
  } catch (err) {
    console.error("\n--- Crash Error ---");
    console.error(err);
    process.exit(1);
  }
}

run();
