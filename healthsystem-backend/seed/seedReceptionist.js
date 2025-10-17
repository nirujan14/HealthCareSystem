import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Receptionist from "../src/models/Receptionist/Receptionist.js";

dotenv.config();

const seedReceptionist = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "receptionist@healthcare.lk";
    const existing = await Receptionist.findOne({ email });

    if (existing) {
      console.log("Receptionist already exists");
      process.exit();
    }

    const passwordHash = await bcrypt.hash("reception123", 10);

    await Receptionist.create({
      name: "Default Receptionist",
      email,
      passwordHash,
      phone: "0771234567",
    });

    console.log("✅ Receptionist account created!");
    process.exit();
  } catch (error) {
    console.error("❌ Error seeding receptionist:", error);
    process.exit(1);
  }
};

seedReceptionist();
