const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Customer = require("./model/customerModel");
const User = require("./model/userModel");
const Role = require("./model/roleModel");
const Transaction = require("./model/transactionModel");

const { getTransactionHistoryByCustomerId } = require("./controller/transactionController");

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://admin:Bmtechx%402025@82.25.85.114:27017/food_court?authSource=admin";
  console.log("Connecting to MongoDB:", mongoUri);
  await mongoose.connect(mongoUri);
  console.log("Connected successfully.");

  // Find a customer
  const customer = await Customer.findOne();
  if (!customer) {
    console.error("No customer found in DB.");
    process.exit(1);
  }
  console.log("Testing with Customer ID:", customer.customer_id);

  const req = {
    params: { customerId: customer.customer_id },
    query: { page: 1, limit: 10 }
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
    await getTransactionHistoryByCustomerId(req, res);
  } catch (err) {
    console.error("\n--- Crash Error ---");
    console.error(err);
    process.exit(1);
  }
}

run();
