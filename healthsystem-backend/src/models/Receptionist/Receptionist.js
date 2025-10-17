import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const receptionistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["RECEPTIONIST"],
      default: "RECEPTIONIST",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  { timestamps: true }
);

// Password comparison
receptionistSchema.methods.isPasswordMatch = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model("Receptionist", receptionistSchema);
