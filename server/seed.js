const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

// Import Models
const Role = require("./model/roleModel");
const User = require("./model/userModel");
const Customer = require("./model/customerModel");
const Restaurant = require("./model/restaurantModel");
const TreasurySubcom = require("./model/treasurySubcomModel");
const Admin = require("./model/adminModel");
const MasterAdmin = require("./model/masterAdminModel");

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is missing in .env file");
    }

    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB for seeding");

    const rolesToCreate = [
      "Master-Admin",
      "Admin",
      "Treasury-Subcom",
      "Restaurant",
      "Customer",
    ];

    const passwordHash = await bcrypt.hash("password123", 10);

    for (let i = 0; i < rolesToCreate.length; i++) {
      const roleName = rolesToCreate[i];
      
      // 1. Check or Create Role
      let role = await Role.findOne({ name: roleName });
      if (!role) {
        role = new Role({ name: roleName });
        await role.save();
        console.log(`✅ Created Role: ${roleName}`);
      }

      // 2. Check or Create User
      const email = `${roleName.toLowerCase().replace("-", "")}@test.com`;
      const phone = `123456789${i}`;
      
      let user = await User.findOne({ email });

      if (!user) {
        user = new User({
          role_id: role._id,
          name: `${roleName} User`,
          email: email,
          phone_number: phone,
          password_hash: passwordHash,
        });
        await user.save();
        console.log(`✅ Created User: ${email}`);

        // 3. Create Specific Role Profile
        if (roleName === "Master-Admin") {
          await new MasterAdmin({ user_id: user._id }).save();
        } else if (roleName === "Admin") {
          await new Admin({ user_id: user._id }).save();
        } else if (roleName === "Treasury-Subcom") {
          await new TreasurySubcom({ user_id: user._id }).save();
        } else if (roleName === "Restaurant") {
          await new Restaurant({ user_id: user._id, restaurant_name: "Test Restaurant" }).save();
        } else if (roleName === "Customer") {
          await new Customer({ user_id: user._id, registration_type: "online" }).save();
        }
        console.log(`✅ Created Profile for: ${roleName}`);
      } else {
        console.log(`⚠️ User already exists: ${email}`);
      }
    }

    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
