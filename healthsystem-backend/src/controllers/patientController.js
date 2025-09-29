import Patient from "../models/Patient.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const upload = multer({ storage: multer.memoryStorage() });
export const avatarUploadMiddleware = upload.single("file");

export const getMe = asyncHandler(async (req, res) => {
  const me = await Patient.findById(req.user.id).select("-passwordHash");
  res.json(me);
});

export const updateMe = asyncHandler(async (req, res) => {
  const updatable = ["fullName", "phone", "address", "bloodGroup", "allergies"];
  const patch = {};
  updatable.forEach(k => {
    if (req.body[k] !== undefined) patch[k] = req.body[k];
  });
  const updated = await Patient.findByIdAndUpdate(req.user.id, patch, { new: true }).select("-passwordHash");
  res.json(updated);
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  const upload = await cloudinary.uploader.upload(fileStr, { folder: "healthsystem/avatars" });
  const updated = await Patient.findByIdAndUpdate(req.user.id, { avatarUrl: upload.secure_url }, { new: true }).select("-passwordHash");
  res.json(updated);
});
