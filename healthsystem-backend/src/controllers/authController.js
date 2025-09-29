import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Patient from "../models/Patient.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const patient = await Patient.findOne({ email });
  if (!patient || !patient.isActive) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, patient.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: patient._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({
    token,
    user: {
      id: patient._id,
      fullName: patient.fullName,
      email: patient.email,
      avatarUrl: patient.avatarUrl,
      healthCardId: patient.healthCardId
    }
  });
});
