// src/controllers/receptionistController.js
import Patient from "../models/Patient.js";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import cloudinary from "../config/cloudinary.js";

export const addPatient = async (req, res) => {
  try {
    const { fullName, email, phone, healthCardId, passwordHash, gender, bloodGroup, address } = req.body;

    const existing = await Patient.findOne({ $or: [{ email }, { healthCardId }] });
    if (existing) return res.status(400).json({ error: "Email or Health Card ID already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordHash, 10);

    // Upload avatar if present
    let avatarUrl = "";
    if (req.file) {
      const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const uploadResult = await cloudinary.uploader.upload(fileStr, {
        folder: "healthsystem/avatars/patients",
        public_id: `patient_${healthCardId}`,
        overwrite: true
      });
      avatarUrl = uploadResult.secure_url;
    }

    // Generate QR code
    const qrCodeData = await QRCode.toDataURL(healthCardId);

    const patient = await Patient.create({
      fullName,
      email,
      phone,
      healthCardId,
      passwordHash: hashedPassword,
      gender,
      bloodGroup,
      address: JSON.parse(address || "{}"),
      avatarUrl,
      qrCode: qrCodeData
    });

    res.status(201).json({ message: "Patient added successfully", patient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
