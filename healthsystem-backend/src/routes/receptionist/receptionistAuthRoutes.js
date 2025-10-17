import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Receptionist from "../../models/Receptionist/Receptionist.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const receptionist = await Receptionist.findOne({ email });
    if (!receptionist) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, receptionist.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

const token = jwt.sign(
  { id: receptionist._id, role: receptionist.role, userType: "RECEPTIONIST" }, // add userType
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);


    receptionist.lastLogin = new Date();
    await receptionist.save();

    res.json({
      message: "Login successful",
      token,
      receptionist: {
        id: receptionist._id,
        name: receptionist.name,
        email: receptionist.email,
        role: receptionist.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
