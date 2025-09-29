import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    nic: { type: String },
    phone: { type: String },
    address: { type: String },
    bloodGroup: { type: String },
    allergies: [{ type: String }],
    avatarUrl: { type: String },
    healthCardId: { type: String, unique: true }, // used for QR check-in
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);
