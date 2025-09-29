import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { connectDB } from "../src/config/db.js";
import Patient from "../src/models/Patient.js";

const patients = [
  {
    email: "patient1@example.com",
    password: "pass1234",
    fullName: "K. Perera",
    phone: "0771234567",
    address: "Colombo",
    bloodGroup: "O+",
    allergies: ["Penicillin"],
    healthCardId: "HC-000001"
  },
  {
    email: "patient2@example.com",
    password: "pass1234",
    fullName: "S. Fernando",
    phone: "0719876543",
    address: "Kandy",
    bloodGroup: "A+",
    allergies: [],
    healthCardId: "HC-000002"
  }
];

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    for (const p of patients) {
      const passwordHash = await bcrypt.hash(p.password, 10);
      const existing = await Patient.findOne({ email: p.email });
      if (existing) {
        existing.passwordHash = passwordHash;
        existing.fullName = p.fullName;
        existing.phone = p.phone;
        existing.address = p.address;
        existing.bloodGroup = p.bloodGroup;
        existing.allergies = p.allergies;
        existing.healthCardId = p.healthCardId;
        existing.isActive = true;
        await existing.save();
        console.log(`🔁 Updated ${p.email}`);
      } else {
        await Patient.create({ ...p, passwordHash });
        console.log(`✅ Created ${p.email}`);
      }
    }
    console.log("🎉 Seeding done");
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.connection.close();
  }
})();
